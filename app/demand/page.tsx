"use client";

import { useState, useMemo } from "react";
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import realData from "@/lib/real-data.json";
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus,
  CreditCard, Clock, Store, ChevronDown, ChevronUp,
  Search, Package, Users, BarChart3, AlertCircle,
} from "lucide-react";
import { retailerProfiles } from "@/lib/retailer-profiles";

// ── Types ──────────────────────────────────────────────────────────────
type WeekRow = Record<string, number | string>;
type SkuDetail = (typeof realData.skuDetails)[number];

// ── Color palette for predicted SKUs ───────────────────────────────────
const SKU_COLORS: Record<string, string> = {
  WATERMELON: "#22c55e", "KASHMIR APPLE": "#ef4444", "KINNAUR APPLE": "#f97316",
  ANAR: "#ec4899", KINNOW: "#f59e0b", ORANGE: "#fb923c", "SAFEDA MANGO": "#84cc16",
  "VNR GUAVA": "#8b5cf6", CHIKOO: "#a16207", "GREEN GRAPES": "#059669",
  "INDIAN GUAVA": "#6366f1", MANDARIN: "#0ea5e9", MAUSAMI: "#14b8a6",
  SHAREEFA: "#d946ef", RAMPHAL: "#78716c", PEAR: "#84cc16",
  "RED GRAPES": "#dc2626", "BLACK GRAPES": "#4c1d95", PAPAYA: "#ea580c",
  COCONUT: "#92400e", MALTA: "#0369a1", BANANA: "#eab308",
  "APPLE BER": "#be185d", AVOCADO: "#166534", BLUEBERRY: "#1d4ed8",
  "SHIMLA APPLE": "#b91c1c", "DESI GUAVA": "#4ade80", "RED PEAR": "#f43f5e",
};

const SUGGESTED_PRICES: Record<string, number> = {
  WATERMELON: 28, "KASHMIR APPLE": 145, "KINNAUR APPLE": 135,
  ANAR: 95, KINNOW: 45, ORANGE: 55, "SAFEDA MANGO": 110, "VNR GUAVA": 65,
  CHIKOO: 40, "GREEN GRAPES": 85, "INDIAN GUAVA": 50, MANDARIN: 60,
  MAUSAMI: 35, SHAREEFA: 45, RAMPHAL: 50, PEAR: 90,
  "RED GRAPES": 120, "BLACK GRAPES": 110, PAPAYA: 35, COCONUT: 30,
  MALTA: 50, BANANA: 25, "APPLE BER": 40, AVOCADO: 250,
};

// ── Build unified timeline: dispatched + predicted ─────────────────────
const dispatched = realData.weekly as unknown as WeekRow[];
const predicted = realData.weeklyPredicted as unknown as WeekRow[];
const skuDetails = realData.skuDetails as SkuDetail[];

// Merge into a single timeline for navigation
type TimelineWeek = {
  week: string;
  dispatchedData: WeekRow | null;
  predictedData: WeekRow | null;
  total: number;
  isPredicted: boolean;
};

function buildTimeline(): TimelineWeek[] {
  const map = new Map<string, TimelineWeek>();

  for (const w of dispatched) {
    const key = w.week as string;
    map.set(key, { week: key, dispatchedData: w, predictedData: null, total: w.total as number, isPredicted: false });
  }
  for (const w of predicted) {
    const key = w.week as string;
    const existing = map.get(key);
    if (existing) {
      existing.predictedData = w;
    } else {
      map.set(key, { week: key, dispatchedData: null, predictedData: w, total: w.total as number, isPredicted: true });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.week.localeCompare(b.week));
}

const timeline = buildTimeline();

// ── Helpers ────────────────────────────────────────────────────────────
function weekLabel(w: string) { return w.split("/")[0].slice(5); } // "01-26"
function weekDate(w: string) { return w.split("/")[0]; } // "2026-01-26"

function getActiveSkus(tw: TimelineWeek): { sku: string; qty: number }[] {
  const src = tw.predictedData ?? tw.dispatchedData;
  if (!src) return [];
  return Object.entries(src)
    .filter(([k, v]) => k !== "week" && k !== "total" && typeof v === "number" && v > 0)
    .map(([sku, qty]) => ({ sku, qty: qty as number }))
    .sort((a, b) => b.qty - a.qty);
}

function getExcludedSkus(activeNames: Set<string>): SkuDetail[] {
  return skuDetails.filter(s => s.exclusionReason && s.exclusionReason !== "-" && !activeNames.has(s.name));
}

function getSkuDetail(name: string): SkuDetail | undefined {
  return skuDetails.find(s => s.name === name || s.name.startsWith(name) || name.startsWith(s.name));
}

// ── Chart data: Predicted vs Dispatched ────────────────────────────────
function buildComparisonChart() {
  // Show last 12 dispatched weeks + all predicted weeks after that
  const lastDispatched = dispatched.slice(-12);
  const futureOnly = predicted.filter(p => {
    const pw = p.week as string;
    return !dispatched.some(d => d.week === pw);
  }).slice(0, 12);

  const points: { label: string; dispatched?: number; predicted?: number }[] = [];

  for (const w of lastDispatched) {
    const label = weekLabel(w.week as string);
    const pw = predicted.find(p => p.week === w.week);
    points.push({ label, dispatched: w.total as number, predicted: pw ? (pw.total as number) : undefined });
  }
  for (const w of futureOnly) {
    points.push({ label: weekLabel(w.week as string), predicted: w.total as number });
  }

  return points;
}

// ═══════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════
export default function DemandPage() {
  // Start at the last dispatched week that also has a prediction (or just last dispatched)
  const defaultIdx = timeline.findIndex(tw => tw.predictedData && tw.dispatchedData) || (timeline.length - 2);
  const [selectedIdx, setSelectedIdx] = useState(Math.max(0, defaultIdx));
  const [searchItem, setSearchItem] = useState("");
  const [searchVendor, setSearchVendor] = useState("");
  const [expandedRetailer, setExpandedRetailer] = useState<string | null>(null);

  const tw = timeline[selectedIdx];
  const prevTw = selectedIdx > 0 ? timeline[selectedIdx - 1] : null;
  const nextTw = selectedIdx < timeline.length - 1 ? timeline[selectedIdx + 1] : null;

  // Active SKUs for this week
  const activeSkus = useMemo(() => getActiveSkus(tw), [tw]);
  const activeNames = useMemo(() => new Set(activeSkus.map(s => s.sku)), [activeSkus]);
  const excludedSkus = useMemo(() => getExcludedSkus(activeNames), [activeNames]);

  // Filter by search
  const filteredSkus = searchItem
    ? activeSkus.filter(s => s.sku.toLowerCase().includes(searchItem.toLowerCase()))
    : activeSkus;

  const filteredExcluded = searchItem
    ? excludedSkus.filter(s => s.name.toLowerCase().includes(searchItem.toLowerCase()))
    : excludedSkus;

  const filteredRetailers = searchVendor
    ? retailerProfiles.filter(r =>
        r.name.toLowerCase().includes(searchVendor.toLowerCase()) ||
        r.area.toLowerCase().includes(searchVendor.toLowerCase()))
    : retailerProfiles;

  // Comparison chart
  const comparisonData = useMemo(buildComparisonChart, []);

  // KPIs
  const stats = realData.stats;

  // Week picker: show ±6 weeks around selected
  const pickerStart = Math.max(0, selectedIdx - 5);
  const pickerEnd = Math.min(timeline.length, selectedIdx + 7);
  const pickerWeeks = timeline.slice(pickerStart, pickerEnd);

  const tierStyle = (tier: string) =>
    tier === "Priority" ? "bg-green-100 text-green-700 border-green-200"
    : tier === "Secondary" ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-red-100 text-red-700 border-red-200";

  const scoreColor = (s: number) => s >= 85 ? "text-green-600" : s >= 70 ? "text-amber-600" : "text-red-500";

  return (
    <div>
      <PageHeader
        title="Demand Forecast"
        description={`Weekly SKU predictions + retailer allocation — powered by ${(stats.totalOrders / 1000).toFixed(0)}K real orders`}
      />

      {/* ── Search bars ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search items…"
            value={searchItem}
            onChange={(e) => setSearchItem(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
          />
        </div>
        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search vendors or areas…"
            value={searchVendor}
            onChange={(e) => setSearchVendor(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
          />
        </div>
      </div>

      {/* ── Week Picker ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" className="shrink-0"
          onClick={() => setSelectedIdx(Math.max(0, selectedIdx - 1))}
          disabled={selectedIdx <= 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
          {pickerWeeks.map((tw, i) => {
            const idx = pickerStart + i;
            const isSelected = idx === selectedIdx;
            const isFuture = tw.isPredicted && !tw.dispatchedData;
            return (
              <button key={tw.week}
                onClick={() => setSelectedIdx(idx)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-all border ${
                  isSelected ? "bg-green-600 text-white border-green-600 shadow-md scale-105"
                  : isFuture ? "border-dashed border-green-400 text-green-600 bg-green-50"
                  : "border-border bg-card hover:border-green-400 hover:bg-green-50"
                }`}>
                <span className="block">{weekLabel(tw.week)}</span>
                <span className={`block text-[10px] mt-0.5 ${isSelected ? "text-green-100" : "text-muted-foreground"}`}>
                  {`${(tw.total / 1000).toFixed(0)}K kg`}
                </span>
              </button>
            );
          })}
        </div>
        <Button variant="outline" size="icon" className="shrink-0"
          onClick={() => setSelectedIdx(Math.min(timeline.length - 1, selectedIdx + 1))}
          disabled={selectedIdx >= timeline.length - 1}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* ═══ SECTION 1: SKU breakdown + Summary ═══════════════════════ */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5 mb-8">

        {/* LEFT: SKU list (3/5) */}
        <div className="xl:col-span-3 space-y-4">
          <h2 className="text-base font-bold">List of items <span className="text-muted-foreground font-normal">(predicted qty)</span></h2>

          {/* Active SKU cards */}
          <div className="space-y-2">
            {filteredSkus.map((s) => {
              const prevSrc = prevTw?.predictedData ?? prevTw?.dispatchedData;
              const prevQty = prevSrc ? ((prevSrc as WeekRow)[s.sku] as number) ?? 0 : s.qty;
              const change = prevQty > 0 ? ((s.qty - prevQty) / prevQty) * 100 : 0;
              const detail = getSkuDetail(s.sku);
              const quality = detail ? { A: detail.A, B: detail.B, C: detail.C } : null;
              const price = SUGGESTED_PRICES[s.sku] ?? 80;
              const upper = Math.round(s.qty * 1.18);
              const lower = Math.round(s.qty * 0.82);
              const TrendIcon = change > 2 ? TrendingUp : change < -2 ? TrendingDown : Minus;
              const tColor = change > 2 ? "text-green-600" : change < -2 ? "text-red-500" : "text-muted-foreground";
              const color = SKU_COLORS[s.sku] ?? "#6b7280";

              return (
                <Card key={s.sku} className="overflow-hidden">
                  <div className="h-1 w-full" style={{ backgroundColor: color }} />
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-semibold">{s.sku}</p>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1 ${tColor}`}>
                          <TrendIcon className="h-3 w-3" />
                          <span className="text-xs">{Math.abs(change).toFixed(1)}%</span>
                        </div>
                        <span className="text-base font-bold">{s.qty.toLocaleString()} kg</span>
                      </div>
                    </div>
                    {/* Band bar */}
                    <div className="relative h-2 rounded-full bg-muted overflow-hidden mb-1.5">
                      <div className="absolute h-full rounded-full opacity-25 w-full" style={{ backgroundColor: color }} />
                      <div className="absolute h-full rounded-full" style={{ left: "18%", width: "64%", backgroundColor: color }} />
                      <div className="absolute top-1/2 -translate-y-1/2 h-3 w-0.5 rounded-full bg-white" style={{ left: "50%" }} />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-muted-foreground">{lower.toLocaleString()} – {upper.toLocaleString()} kg</span>
                      <span className="text-xs font-bold" style={{ color }}>₹{price}/kg</span>
                    </div>
                    {quality && (
                      <div className="flex items-center gap-1.5">
                        {[
                          { label: "A", value: quality.A, bg: "bg-green-100 text-green-700" },
                          { label: "B", value: quality.B, bg: "bg-amber-100 text-amber-700" },
                          { label: "C", value: quality.C, bg: "bg-muted text-muted-foreground" },
                        ].filter(g => g.value && g.value !== "-").map((g) => (
                          <span key={g.label} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${g.bg}`}>
                            {g.label}: {g.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Excluded / greyed-out SKUs */}
          {filteredExcluded.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 mt-4">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Not included this week ({filteredExcluded.length})
                </p>
              </div>
              <div className="space-y-1.5">
                {filteredExcluded.map((s) => (
                  <div key={s.name} className="flex items-center justify-between rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30 px-3 py-2 opacity-60">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                      <span className="text-xs font-medium text-muted-foreground">{s.name}</span>
                      {s.area && <span className="text-[10px] text-muted-foreground/60">{s.area}</span>}
                    </div>
                    <span className="text-[10px] text-muted-foreground/80 italic max-w-[180px] truncate">
                      {s.exclusionReason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Summary + KPIs + Chart (2/5) */}
        <div className="xl:col-span-2 space-y-4">
          {/* Week summary */}
          <Card className="bg-gradient-to-br from-green-600 to-green-500 text-white">
            <CardContent className="p-5">
              <p className="text-sm text-green-100 font-medium">Week of {weekDate(tw.week)}</p>
              <p className="text-3xl sm:text-4xl font-bold mt-1">{tw.total.toLocaleString()} kg</p>
              <p className="text-sm text-green-100 mt-1">Total demand across {activeSkus.length} SKUs</p>
              <div className="flex items-center gap-4 mt-3">
                <div>
                  <p className="text-xs text-green-100">Confidence</p>
                  <p className="text-lg font-bold">±18%</p>
                </div>
                {nextTw && (
                  <div>
                    <p className="text-xs text-green-100">vs Next Week</p>
                    <p className={`text-lg font-bold ${nextTw.total > tw.total ? "text-white" : "text-red-200"}`}>
                      {nextTw.total > tw.total ? "+" : ""}{(((nextTw.total - tw.total) / tw.total) * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total Volume", value: `${(stats.totalQty / 1000).toFixed(1)}K kg`, icon: Package, color: "text-green-600 bg-green-50" },
              { label: "Retailers", value: stats.uniqueRetailers.toString(), icon: Users, color: "text-blue-600 bg-blue-50" },
              { label: "Predicted Items", value: activeSkus.length.toString(), icon: BarChart3, color: "text-purple-600 bg-purple-50" },
              { label: "Growth", value: `${stats.monthlyGrowth}%`, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
            ].map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${kpi.color}`}>
                    <kpi.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-lg font-bold leading-none">{kpi.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Predicted vs Dispatched chart */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-[10px] font-semibold text-muted-foreground">PREDICTED DASHBOARD</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-gray-800" />
                  <span className="text-[10px] font-semibold text-muted-foreground">DISPATCHED INVENTORY</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    formatter={(v: number, name: string) => [`${v.toLocaleString()} kg`, name === "predicted" ? "Predicted" : "Dispatched"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "11px" }}
                  />
                  <Line type="monotone" dataKey="dispatched" stroke="#1f2937" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} name="dispatched" />
                  <Line type="monotone" dataKey="predicted" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="6 3" connectNulls={false} name="predicted" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══ SECTION 2: Retailer allocation ═══════════════════════════ */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold">Who Gets This Stock?</h2>
            <p className="text-sm text-muted-foreground hidden sm:block">Expand each retailer to see full profile + SKU indent</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {retailerProfiles.filter(r => r.tier === "Priority").length} Priority
            </Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {retailerProfiles.filter(r => r.tier === "Secondary").length} Secondary
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          {filteredRetailers.map((r, i) => {
            const isExpanded = expandedRetailer === r.name;
            const weeklyKg = Math.round(r.avgDailyKg * 7);
            const sColor = scoreColor(r.score);

            return (
              <Card key={r.name}
                className={`overflow-hidden transition-all duration-200 ${isExpanded ? "shadow-lg ring-1 ring-green-300" : "hover:shadow-sm"}`}>
                <div className="h-1 w-full" style={{ backgroundColor: r.color }} />
                <CardContent className="p-0">
                  {/* Collapsed row */}
                  <button className="w-full text-left px-4 py-3"
                    onClick={() => setExpandedRetailer(isExpanded ? null : r.name)}>
                    <div className="flex items-center gap-3">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i < 5 ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold">{r.name}</p>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${tierStyle(r.tier)}`}>{r.tier}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{r.area} · {r.shopType}</p>
                      </div>
                      <div className="text-center shrink-0 hidden sm:block w-12">
                        <p className={`text-lg font-bold ${sColor}`}>{r.score}</p>
                        <p className="text-[10px] text-muted-foreground">score</p>
                      </div>
                      <div className="text-center shrink-0 w-14">
                        <p className="text-base font-bold text-green-700">{(weeklyKg / 1000).toFixed(1)}K</p>
                        <p className="text-[10px] text-muted-foreground">kg/wk</p>
                      </div>
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </div>
                  </button>

                  {/* Expanded profile */}
                  {isExpanded && (
                    <div className="border-t px-4 py-4 bg-muted/20">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

                        {/* Col 1: Profile */}
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Profile</p>
                          <div className="space-y-2">
                            {[
                              { icon: CreditCard, label: "Credit Score", value: `${r.creditScore}/100`, color: r.creditScore >= 80 ? "text-green-600" : "text-amber-600" },
                              { icon: Clock, label: "Payment", value: `Net ${r.paymentDays}d`, color: r.paymentDays <= 10 ? "text-green-600" : r.paymentDays <= 18 ? "text-amber-600" : "text-red-500" },
                              { icon: Store, label: "Type", value: r.shopType, color: "text-foreground" },
                            ].map((m) => (
                              <div key={m.label} className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <m.icon className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{m.label}</span>
                                </div>
                                <span className={`text-xs font-semibold ${m.color}`}>{m.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Col 2: SKU Indent */}
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">SKU Indent This Week</p>
                          <div className="space-y-2">
                            {Object.entries(r.skuAllocation).map(([sku, pct]) => {
                              const kg = Math.round(weeklyKg * pct / 100);
                              const detail = getSkuDetail(sku);
                              return (
                                <div key={sku}>
                                  <div className="flex items-center justify-between mb-0.5">
                                    <div className="flex items-center gap-1">
                                      <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: SKU_COLORS[sku] ?? "#6b7280" }} />
                                      <span className="text-xs">{sku.split(" ")[0]}</span>
                                      {detail?.A && (
                                        <span className="text-[9px] bg-muted px-1 rounded text-muted-foreground">{detail.A}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-muted-foreground">{pct}%</span>
                                      <span className="text-xs font-bold">{kg.toLocaleString()} kg</span>
                                      <span className="text-[10px] font-semibold" style={{ color: SKU_COLORS[sku] }}>₹{SUGGESTED_PRICES[sku] ?? 80}</span>
                                    </div>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: SKU_COLORS[sku] ?? "#6b7280" }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Col 3: Radar */}
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Performance</p>
                          <ResponsiveContainer width="100%" height={160}>
                            <RadarChart data={r.radarMetrics}>
                              <PolarGrid stroke="#d1d5db" />
                              <PolarAngleAxis dataKey="label" tick={{ fontSize: 9 }} />
                              <Radar dataKey="value" stroke={r.color} fill={r.color} fillOpacity={0.25} strokeWidth={2} />
                            </RadarChart>
                          </ResponsiveContainer>
                          <div className="grid grid-cols-2 gap-1 mt-1">
                            {r.radarMetrics.map((m) => (
                              <div key={m.label} className="flex items-center justify-between rounded bg-muted/40 px-1.5 py-0.5">
                                <span className="text-[10px] text-muted-foreground">{m.label}</span>
                                <span className="text-[10px] font-bold">{m.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ═══ SECTION 3: Full-width Predicted vs Dispatched chart ══════ */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-6 mb-4">
            <h3 className="font-semibold">Predicted vs Dispatched</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-muted-foreground">PREDICTED DASHBOARD</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-gray-800" />
                <span className="text-xs font-medium text-muted-foreground">DISPATCHED INVENTORY</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                formatter={(v: number, name: string) => [`${v.toLocaleString()} kg`, name === "predicted" ? "Predicted" : "Dispatched"]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
              />
              <Line type="monotone" dataKey="dispatched" stroke="#1f2937" strokeWidth={2.5} dot={{ r: 3, fill: "#1f2937" }} connectNulls={false} name="dispatched" />
              <Line type="monotone" dataKey="predicted" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3, fill: "#16a34a" }} strokeDasharray="6 3" connectNulls={false} name="predicted" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
