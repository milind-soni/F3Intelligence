"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO, startOfWeek, endOfWeek, closestTo } from "date-fns";
import realData from "@/lib/real-data.json";
import {
  TrendingUp, TrendingDown, Minus,
  CreditCard, Clock, Store, ChevronDown, ChevronUp,
  Search, Package, Users, BarChart3, AlertCircle, Leaf,
  Calendar as CalendarIcon, X, ArrowRight, Layers, Target,
} from "lucide-react";
import { retailerProfiles } from "@/lib/retailer-profiles";
import allCustomers from "@/lib/customers.json";
import { cn } from "@/lib/utils";

type Customer = { cid: string; name: string; area: string; zone: string; address: string; geoLink: string; status: string };

// ── Types ──────────────────────────────────────────────────────────────
type WeekRow = Record<string, number | string>;
type SkuDetail = (typeof realData.skuDetails)[number];

// ── Colors & prices ────────────────────────────────────────────────────
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
};

// ── Data ───────────────────────────────────────────────────────────────
const dispatched = realData.weekly as unknown as WeekRow[];
const predicted = realData.weeklyPredicted as unknown as WeekRow[];
const skuDetails = realData.skuDetails as SkuDetail[];

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

function weekLabel(w: string) { return w.split("/")[0].slice(5); }
function weekDate(w: string) { return w.split("/")[0]; }

function getActiveSkus(tw: TimelineWeek) {
  const src = tw.predictedData ?? tw.dispatchedData;
  if (!src) return [];
  return Object.entries(src)
    .filter(([k, v]) => k !== "week" && k !== "total" && typeof v === "number" && v > 0)
    .map(([sku, qty]) => ({ sku, qty: qty as number }))
    .sort((a, b) => b.qty - a.qty);
}

function getExcludedSkus(activeNames: Set<string>) {
  return skuDetails.filter(s => s.exclusionReason && s.exclusionReason !== "-" && !activeNames.has(s.name));
}

function getSkuDetail(name: string) {
  return skuDetails.find(s => s.name === name || s.name.startsWith(name) || name.startsWith(s.name));
}

function buildComparisonChart() {
  const lastDispatched = dispatched.slice(-12);
  const futureOnly = predicted.filter(p => !dispatched.some(d => d.week === p.week)).slice(0, 12);
  const points: { label: string; dispatched?: number; predicted?: number }[] = [];
  for (const w of lastDispatched) {
    const pw = predicted.find(p => p.week === w.week);
    points.push({ label: weekLabel(w.week as string), dispatched: w.total as number, predicted: pw ? (pw.total as number) : undefined });
  }
  for (const w of futureOnly) {
    points.push({ label: weekLabel(w.week as string), predicted: w.total as number });
  }
  return points;
}

// ═══════════════════════════════════════════════════════════════════════
export default function DemandPage() {
  const defaultIdx = timeline.findIndex(tw => tw.predictedData && tw.dispatchedData) || (timeline.length - 2);
  const [selectedIdx, setSelectedIdx] = useState(Math.max(0, defaultIdx));
  const [searchItem, setSearchItem] = useState("");
  const [searchVendor, setSearchVendor] = useState("");
  const [expandedRetailer, setExpandedRetailer] = useState<string | null>(null);
  const [vendorPage, setVendorPage] = useState(1);
  const VENDORS_PER_PAGE = 30;
  const weekScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = weekScrollRef.current;
    if (!el) return;
    const selected = el.querySelector("[data-selected]") as HTMLElement | null;
    if (selected) {
      selected.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [selectedIdx]);

  const tw = timeline[selectedIdx];
  const prevTw = selectedIdx > 0 ? timeline[selectedIdx - 1] : null;
  const nextTw = selectedIdx < timeline.length - 1 ? timeline[selectedIdx + 1] : null;

  const activeSkus = useMemo(() => getActiveSkus(tw), [tw]);
  const activeNames = useMemo(() => new Set(activeSkus.map(s => s.sku)), [activeSkus]);
  const excludedSkus = useMemo(() => getExcludedSkus(activeNames), [activeNames]);
  const comparisonData = useMemo(buildComparisonChart, []);
  const stats = realData.stats;

  const filteredSkus = searchItem
    ? activeSkus.filter(s => s.sku.toLowerCase().includes(searchItem.toLowerCase()))
    : activeSkus;
  const filteredExcluded = searchItem
    ? excludedSkus.filter(s => s.name.toLowerCase().includes(searchItem.toLowerCase()))
    : excludedSkus;
  // Merge all customers with detailed profiles where available
  const allVendors = useMemo(() => {
    const profileMap = new Map(retailerProfiles.map(r => [r.name, r]));
    return (allCustomers as Customer[]).map(c => ({
      ...c,
      profile: profileMap.get(c.name) ?? null,
    }));
  }, []);

  const filteredVendors = useMemo(() => {
    const q = searchVendor.toLowerCase();
    const list = q
      ? allVendors.filter(v => v.name.toLowerCase().includes(q) || v.area.toLowerCase().includes(q) || v.zone.toLowerCase().includes(q))
      : allVendors;
    return list.sort((a, b) => {
      if (a.profile && !b.profile) return -1;
      if (!a.profile && b.profile) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [searchVendor, allVendors]);

  const totalVendorPages = Math.ceil(filteredVendors.length / VENDORS_PER_PAGE);
  const paginatedVendors = filteredVendors.slice((vendorPage - 1) * VENDORS_PER_PAGE, vendorPage * VENDORS_PER_PAGE);

  const nextDelta = nextTw ? (((nextTw.total - tw.total) / tw.total) * 100) : 0;
  const twDate = parseISO(tw.week.split("/")[0]);
  const startOfTw = startOfWeek(twDate, { weekStartsOn: 1 });
  const endOfTw = endOfWeek(twDate, { weekStartsOn: 1 });

  const timelineDates = timeline.map(t => parseISO(t.week.split("/")[0]));

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const closest = closestTo(date, timelineDates);
    if (closest) {
      const idx = timeline.findIndex(t => t.week.split("/")[0] === format(closest, "yyyy-MM-dd"));
      if (idx !== -1) setSelectedIdx(idx);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Header banner ──────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-br from-white via-white to-green-50/60 border border-black/[0.04] p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Demand Forecast</h1>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              Weekly predictions across <span className="font-bold text-primary">{stats.uniqueSkus} SKUs</span> &middot; {(stats.totalOrders / 1000).toFixed(0)}K orders
            </p>
          </div>
          <div className="flex gap-6 sm:gap-8">
            <div className="text-right">
              <p className="text-2xl font-black tracking-tight num text-primary">{tw.total.toLocaleString()}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">kg this week</p>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div className="text-right">
              <p className="text-2xl font-black tracking-tight num">{activeSkus.length}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">active SKUs</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Week Selector (horizontal scroll) ─────────────────── */}
      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <button className="shrink-0 h-9 w-9 rounded-lg border border-black/[0.06] bg-card flex items-center justify-center hover:bg-accent transition-colors shadow-sm">
              <CalendarIcon className="h-4 w-4 text-primary" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={twDate}
              onSelect={handleDateSelect}
              defaultMonth={twDate}
              autoFocus
              modifiers={{
                weekRange: (date) => {
                  return date >= startOfTw && date <= endOfTw;
                },
              }}
              modifiersClassNames={{
                weekRange: "bg-primary/10 text-primary font-bold",
              }}
              disabled={(date) => {
                const start = parseISO(timeline[0].week.split("/")[0]);
                const end = parseISO(timeline[timeline.length - 1].week.split("/")[0]);
                return date < start || date > endOfWeek(end, { weekStartsOn: 1 });
              }}
            />
          </PopoverContent>
        </Popover>

        <div className="flex-1 overflow-hidden relative">
          <div ref={weekScrollRef} className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory">
            {timeline.slice(-20).map((t, i) => {
              const realIdx = timeline.length - 20 + i;
              const isSelected = realIdx === selectedIdx;
              const tTotal = t.total;
              const dateStr = weekLabel(t.week);
              return (
                <button
                  key={t.week}
                  data-selected={isSelected || undefined}
                  onClick={() => setSelectedIdx(realIdx)}
                  className={cn(
                    "shrink-0 snap-center flex flex-col items-center px-3 py-2 rounded-xl border text-center transition-all min-w-[72px]",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-card border-black/[0.04] hover:bg-accent hover:border-primary/20"
                  )}
                >
                  <span className="text-[11px] font-bold">{dateStr}</span>
                  <span className={cn("text-[10px] font-semibold num mt-0.5", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                    {(tTotal / 1000).toFixed(0)}K kg
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Badge variant="outline" className={cn(
          "px-3 py-1.5 font-bold tracking-wider uppercase text-[10px] rounded-lg shrink-0",
          tw.dispatchedData
            ? "bg-muted text-muted-foreground border-border"
            : "bg-primary/10 text-primary border-primary/20"
        )}>
          {tw.dispatchedData ? "Historical" : "Predicted"}
        </Badge>
      </div>

      {/* ── Summary KPIs ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Week of", value: weekDate(tw.week), sub: `${tw.total.toLocaleString()} kg`, icon: CalendarIcon, color: "text-primary", bg: "bg-primary/10" },
          { label: "Active SKUs", value: activeSkus.length.toString(), sub: `of ${stats.uniqueSkus} total`, icon: Layers, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Confidence", value: "±18%", sub: "prediction band", icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "vs Next Week", value: `${nextDelta > 0 ? "+" : ""}${nextDelta.toFixed(1)}%`, sub: nextDelta > 0 ? "volume increase" : nextDelta < 0 ? "volume decrease" : "no change", icon: TrendingUp, color: nextDelta > 0 ? "text-green-600" : nextDelta < 0 ? "text-red-500" : "text-muted-foreground", bg: nextDelta > 0 ? "bg-green-50" : nextDelta < 0 ? "bg-red-50" : "bg-muted" },
        ].map((kpi) => (
          <Card key={kpi.label} className="transition-all duration-300 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`rounded-xl p-2.5 ${kpi.bg}`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} strokeWidth={2.5} />
                </div>
              </div>
              <p className={`text-2xl font-black tracking-tight num ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{kpi.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs: Forecast / Allocation / Trends ────────────────── */}
      <Tabs defaultValue="allocation" className="space-y-5">
        <TabsList variant="line">
          <TabsTrigger value="allocation" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Allocation</TabsTrigger>
          <TabsTrigger value="forecast" className="gap-1.5"><Package className="h-3.5 w-3.5" /> Forecast</TabsTrigger>
          <TabsTrigger value="trends" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Trends</TabsTrigger>
        </TabsList>

        {/* ════ TAB: Forecast ═══════════════════════════════════ */}
        <TabsContent value="forecast" className="space-y-5">
          {/* Search + filter bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative max-w-sm flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search SKUs…"
                value={searchItem}
                onChange={(e) => setSearchItem(e.target.value)}
                className="pl-10 h-10 rounded-xl bg-white border-black/[0.06] shadow-sm focus:shadow-md focus:border-primary/30 transition-all"
              />
              {searchItem && (
                <button
                  onClick={() => setSearchItem("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
            {searchItem && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold rounded-lg">
                {filteredSkus.length} result{filteredSkus.length !== 1 ? "s" : ""}
              </Badge>
            )}
            <div className="flex gap-2 ml-auto">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold rounded-lg">
                {activeSkus.length} active
              </Badge>
              {excludedSkus.length > 0 && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold rounded-lg">
                  {excludedSkus.length} excluded
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
            {/* SKU list */}
            <div className="xl:col-span-3 space-y-2.5">
              {filteredSkus.map((s, idx) => {
                const prevSrc = prevTw?.predictedData ?? prevTw?.dispatchedData;
                const prevQty = prevSrc ? ((prevSrc as WeekRow)[s.sku] as number) ?? 0 : s.qty;
                const change = prevQty > 0 ? ((s.qty - prevQty) / prevQty) * 100 : 0;
                const detail = getSkuDetail(s.sku);
                const quality = detail ? { A: detail.A, B: detail.B, C: detail.C } : null;
                const price = SUGGESTED_PRICES[s.sku] ?? 80;
                const color = SKU_COLORS[s.sku] ?? "#6b7280";
                const TrendIcon = change > 2 ? TrendingUp : change < -2 ? TrendingDown : Minus;
                const tColor = change > 2 ? "text-green-600" : change < -2 ? "text-red-500" : "text-muted-foreground";
                const tBg = change > 2 ? "bg-green-50" : change < -2 ? "bg-red-50" : "bg-muted";
                const sharePercent = ((s.qty / tw.total) * 100);

                return (
                  <Card key={s.sku} className="group transition-all duration-200 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.1)] hover:-translate-y-px">
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        {/* Color accent bar */}
                        <div className="w-1.5 shrink-0 rounded-l-2xl" style={{ backgroundColor: color }} />
                        <div className="flex-1 px-4 py-3.5">
                          <div className="flex items-center gap-4">
                            {/* Rank circle */}
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-black" style={{ backgroundColor: `${color}15`, color }}>
                              {idx + 1}
                            </span>
                            {/* Name + quality */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold tracking-tight">{s.sku}</p>
                                <span className="text-[10px] font-bold num hidden sm:inline" style={{ color: `${color}cc` }}>
                                  ₹{price}/kg
                                </span>
                              </div>
                              {quality && (
                                <div className="flex items-center gap-1 mt-1">
                                  {[
                                    { label: "A", value: quality.A, cls: "bg-green-50 text-green-700 ring-green-200" },
                                    { label: "B", value: quality.B, cls: "bg-amber-50 text-amber-700 ring-amber-200" },
                                    { label: "C", value: quality.C, cls: "bg-muted text-muted-foreground ring-border" },
                                  ].filter(g => g.value && g.value !== "-").map((g) => (
                                    <span key={g.label} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ring-1 ring-inset ${g.cls}`}>{g.label}: {g.value}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            {/* Trend pill */}
                            <div className={`flex items-center gap-1 shrink-0 px-2 py-1 rounded-lg ${tBg}`}>
                              <TrendIcon className={`h-3 w-3 ${tColor}`} strokeWidth={2.5} />
                              <span className={`text-[11px] font-bold num ${tColor}`}>{Math.abs(change).toFixed(1)}%</span>
                            </div>
                            {/* Quantity */}
                            <div className="text-right shrink-0 pl-2">
                              <p className="text-lg font-black num tracking-tight">{s.qty.toLocaleString()}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">kg</p>
                            </div>
                          </div>
                          {/* Confidence band */}
                          <div className="mt-3 pt-3 border-t border-black/[0.04]">
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="relative h-2 rounded-full bg-muted/80 overflow-hidden">
                                  <div className="absolute h-full rounded-full opacity-15" style={{ backgroundColor: color, width: "100%" }} />
                                  <div className="absolute h-full rounded-full" style={{ left: "18%", width: "64%", backgroundColor: color, opacity: 0.5 }} />
                                  <div className="absolute top-0 bottom-0 w-0.5 bg-foreground/50 rounded-full" style={{ left: "50%" }} />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] num text-muted-foreground font-semibold">{Math.round(s.qty * 0.82).toLocaleString()}</span>
                                <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/50" />
                                <span className="text-[10px] num text-muted-foreground font-semibold">{Math.round(s.qty * 1.18).toLocaleString()}</span>
                              </div>
                              <span className="text-[10px] font-bold num px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">{sharePercent.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Excluded SKUs */}
              {filteredExcluded.length > 0 && (
                <div className="mt-8 pt-6 border-t border-dashed border-border/60">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Not included this week ({filteredExcluded.length})
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredExcluded.map((s) => (
                      <div key={s.name} className="flex items-center justify-between rounded-xl border border-dashed border-border/80 px-3.5 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Leaf className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                          <span className="text-xs font-semibold text-muted-foreground truncate">{s.name}</span>
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground/70 ml-2 shrink-0 max-w-[140px] truncate">{s.exclusionReason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: charts */}
            <div className="xl:col-span-2 space-y-5">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold">Predicted vs Dispatched</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5"><div className="h-2 w-5 rounded-full" style={{ backgroundColor: "#16a34a" }} /><span className="text-[10px] font-semibold text-muted-foreground">Predicted</span></div>
                      <div className="flex items-center gap-1.5"><div className="h-2 w-5 rounded-full" style={{ backgroundColor: "#1e293b" }} /><span className="text-[10px] font-semibold text-muted-foreground">Dispatched</span></div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={comparisonData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#6b7280", fontWeight: 500 }} angle={-45} textAnchor="end" height={40} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#6b7280", fontWeight: 500 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} width={35} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v: number, name: string) => [`${v.toLocaleString()} kg`, name === "predicted" ? "Predicted" : "Dispatched"]}
                        contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "11px", background: "#fff", boxShadow: "0 4px 12px -4px rgba(0,0,0,0.1)", fontWeight: 600 }} />
                      <Line type="monotone" dataKey="dispatched" stroke="#1e293b" strokeWidth={2.5} dot={{ r: 3, fill: "#1e293b", strokeWidth: 0 }} connectNulls={false} />
                      <Line type="monotone" dataKey="predicted" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3, fill: "#16a34a", strokeWidth: 0 }} strokeDasharray="6 3" connectNulls={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* SKU share breakdown */}
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm font-bold mb-4">Volume Share</p>
                  <div className="flex rounded-full overflow-hidden h-3.5 mb-4 shadow-inner">
                    {activeSkus.slice(0, 8).map(s => (
                      <div key={s.sku} className="transition-all duration-300" style={{ width: `${(s.qty / tw.total) * 100}%`, backgroundColor: SKU_COLORS[s.sku] ?? "#6b7280" }} title={`${s.sku}: ${((s.qty / tw.total) * 100).toFixed(1)}%`} />
                    ))}
                  </div>
                  <div className="space-y-2">
                    {activeSkus.slice(0, 6).map(s => {
                      const pct = ((s.qty / tw.total) * 100);
                      return (
                        <div key={s.sku} className="flex items-center justify-between text-xs group/item">
                          <div className="flex items-center gap-2.5">
                            <div className="h-3 w-3 rounded shrink-0 shadow-sm" style={{ backgroundColor: SKU_COLORS[s.sku] ?? "#6b7280" }} />
                            <span className="font-semibold">{s.sku}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden hidden sm:block">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: SKU_COLORS[s.sku] ?? "#6b7280" }} />
                            </div>
                            <span className="num font-bold text-muted-foreground w-12 text-right">{pct.toFixed(1)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ════ TAB: Allocation ═════════════════════════════════ */}
        <TabsContent value="allocation" className="space-y-5">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">Who Gets This Stock?</h2>
            <p className="text-xs text-muted-foreground font-medium mt-1">Expand each retailer to see full profile + SKU indent</p>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative max-w-sm flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors, areas, or zones…"
                value={searchVendor}
                onChange={(e) => { setSearchVendor(e.target.value); setVendorPage(1); }}
                className="pl-10 h-10 rounded-xl bg-white border-black/[0.06] shadow-sm focus:shadow-md focus:border-primary/30 transition-all"
              />
              {searchVendor && (
                <button
                  onClick={() => { setSearchVendor(""); setVendorPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {searchVendor && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold rounded-lg">
                  {filteredVendors.length} result{filteredVendors.length !== 1 ? "s" : ""}
                </Badge>
              )}
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-bold rounded-lg">
                {allVendors.length} retailers
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-bold rounded-lg">
                {retailerProfiles.length} profiled
              </Badge>
            </div>
          </div>

          <div className="space-y-2.5">
            {paginatedVendors.map((v, idx) => {
              const i = (vendorPage - 1) * VENDORS_PER_PAGE + idx;
              const r = v.profile;
              const isExpanded = expandedRetailer === v.name;

              // Profiled retailer — full card
              if (r) {
                const weeklyKg = Math.round(r.avgDailyKg * 7);
                const sColor = r.score >= 85 ? "text-green-600" : r.score >= 70 ? "text-amber-600" : "text-red-500";
                const sBg = r.score >= 85 ? "bg-green-50" : r.score >= 70 ? "bg-amber-50" : "bg-red-50";
                const tierCls = r.tier === "Priority" ? "bg-green-50 text-green-700 border-green-200"
                  : r.tier === "Secondary" ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-red-50 text-red-700 border-red-200";
                const accentColor = r.tier === "Priority" ? "#16a34a" : r.tier === "Secondary" ? "#f59e0b" : "#ef4444";

                return (
                  <Card key={v.cid} className={`transition-all duration-200 overflow-hidden ${isExpanded ? "shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] ring-1 ring-primary/20" : "hover:shadow-[0_4px_16px_-6px_rgba(0,0,0,0.08)]"}`}>
                    <CardContent className="p-0">
                      <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />
                      <button className="w-full text-left px-5 py-4" onClick={() => setExpandedRetailer(isExpanded ? null : v.name)}>
                        <div className="flex items-center gap-3.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-xs font-black shadow-sm bg-primary text-primary-foreground">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold">{r.name}</p>
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-bold ${tierCls}`}>{r.tier}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">{r.area} · {r.shopType}</p>
                          </div>
                          <div className="text-center shrink-0 hidden sm:block">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${sBg}`}>
                              <p className={`text-base font-black num ${sColor}`}>{r.score}</p>
                              <p className={`text-[9px] font-bold uppercase tracking-wider ${sColor}`}>score</p>
                            </div>
                          </div>
                          <Separator orientation="vertical" className="h-8 hidden sm:block" />
                          <div className="text-right shrink-0">
                            <p className="text-base font-black num text-primary">{(weeklyKg / 1000).toFixed(1)}K</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">kg/wk</p>
                          </div>
                          <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isExpanded ? "bg-primary/10" : "bg-muted"}`}>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-primary" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <>
                          <Separator />
                          <div className="px-5 py-5 bg-accent/30">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                              <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Profile</p>
                                <div className="space-y-3">
                                  {[
                                    { icon: CreditCard, label: "Credit Score", value: `${r.creditScore}/100`, color: r.creditScore >= 80 ? "text-green-600" : "text-amber-600", bg: r.creditScore >= 80 ? "bg-green-50" : "bg-amber-50" },
                                    { icon: Clock, label: "Payment", value: `Net ${r.paymentDays}d`, color: r.paymentDays <= 10 ? "text-green-600" : r.paymentDays <= 18 ? "text-amber-600" : "text-red-500", bg: r.paymentDays <= 10 ? "bg-green-50" : r.paymentDays <= 18 ? "bg-amber-50" : "bg-red-50" },
                                    { icon: Store, label: "Type", value: r.shopType, color: "text-foreground", bg: "bg-muted" },
                                  ].map((m) => (
                                    <div key={m.label} className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${m.bg}`}>
                                          <m.icon className={`h-3 w-3 ${m.color}`} />
                                        </div>
                                        <span className="text-xs text-muted-foreground font-medium">{m.label}</span>
                                      </div>
                                      <span className={`text-xs font-bold ${m.color}`}>{m.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">SKU Indent This Week</p>
                                <div className="space-y-2.5">
                                  {Object.entries(r.skuAllocation).map(([sku, pct]) => {
                                    const pctNum = pct as number;
                                    const kg = Math.round(weeklyKg * pctNum / 100);
                                    const detail = getSkuDetail(sku);
                                    const price = SUGGESTED_PRICES[sku];
                                    return (
                                      <div key={sku}>
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center gap-2">
                                            <div className="h-2.5 w-2.5 rounded shrink-0 shadow-sm" style={{ backgroundColor: SKU_COLORS[sku] ?? "#6b7280" }} />
                                            <span className="text-xs font-semibold">{sku}</span>
                                            {detail?.A && <span className="text-[9px] bg-muted px-1 py-0.5 rounded font-medium text-muted-foreground">{detail.A}</span>}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold num">{kg.toLocaleString()} kg</span>
                                            {price && <span className="text-[10px] font-bold num text-primary">₹{price}</span>}
                                          </div>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pctNum}%`, backgroundColor: SKU_COLORS[sku] ?? "#6b7280" }} />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Performance</p>
                                <ResponsiveContainer width="100%" height={150}>
                                  <RadarChart data={r.radarMetrics}>
                                    <PolarGrid stroke="#e5e7eb" />
                                    <PolarAngleAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 600 }} />
                                    <Radar dataKey="value" stroke={r.color} fill={r.color} fillOpacity={0.15} strokeWidth={2} />
                                  </RadarChart>
                                </ResponsiveContainer>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {r.radarMetrics.map((m: { label: string; value: number }) => (
                                    <div key={m.label} className="flex items-center justify-between rounded-lg bg-muted/50 px-2 py-1">
                                      <span className="text-[10px] text-muted-foreground font-medium">{m.label}</span>
                                      <span className="text-[10px] font-black num">{m.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              }

              // Basic customer — compact card
              return (
                <Card key={v.cid} className="transition-all duration-200 hover:shadow-[0_4px_16px_-6px_rgba(0,0,0,0.08)]">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3.5 px-5 py-3.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-xs font-black bg-muted text-muted-foreground">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{v.name}</p>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">{v.area} · {v.zone}</p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-bold shrink-0 ${v.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-muted text-muted-foreground border-border"}`}>
                        {v.status}
                      </Badge>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">{v.cid}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {totalVendorPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-border/60">
                <p className="text-xs text-muted-foreground font-medium">
                  {(vendorPage - 1) * VENDORS_PER_PAGE + 1}–{Math.min(vendorPage * VENDORS_PER_PAGE, filteredVendors.length)} of {filteredVendors.length} retailers
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs font-bold rounded-lg"
                    disabled={vendorPage <= 1}
                    onClick={() => setVendorPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(totalVendorPages, 5) }, (_, pi) => {
                    let page: number;
                    if (totalVendorPages <= 5) {
                      page = pi + 1;
                    } else if (vendorPage <= 3) {
                      page = pi + 1;
                    } else if (vendorPage >= totalVendorPages - 2) {
                      page = totalVendorPages - 4 + pi;
                    } else {
                      page = vendorPage - 2 + pi;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setVendorPage(page)}
                        className={cn(
                          "h-8 w-8 rounded-lg text-xs font-bold transition-colors",
                          vendorPage === page
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs font-bold rounded-lg"
                    disabled={vendorPage >= totalVendorPages}
                    onClick={() => setVendorPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ════ TAB: Trends ═════════════════════════════════════ */}
        <TabsContent value="trends" className="space-y-5">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <div>
                  <p className="text-base font-bold">Predicted vs Dispatched</p>
                  <p className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wider">Weekly Volume</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5"><div className="h-2 w-6 rounded-full" style={{ backgroundColor: "#16a34a" }} /><span className="text-[11px] font-semibold text-muted-foreground">Predicted</span></div>
                  <div className="flex items-center gap-1.5"><div className="h-2 w-6 rounded-full" style={{ backgroundColor: "#1e293b" }} /><span className="text-[11px] font-semibold text-muted-foreground">Dispatched</span></div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={comparisonData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gPred" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6b7280", fontWeight: 500 }} angle={-45} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280", fontWeight: 500 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} width={40} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number, name: string) => [`${v.toLocaleString()} kg`, name === "predicted" ? "Predicted" : "Dispatched"]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "12px", background: "#fff", boxShadow: "0 4px 12px -4px rgba(0,0,0,0.1)", fontWeight: 600 }} />
                  <Area type="monotone" dataKey="predicted" stroke="#16a34a" strokeWidth={2.5} fill="url(#gPred)" dot={{ r: 3, fill: "#16a34a", strokeWidth: 0 }} connectNulls={false} />
                  <Line type="monotone" dataKey="dispatched" stroke="#1e293b" strokeWidth={2} dot={{ r: 3, fill: "#1e293b", strokeWidth: 0 }} connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Volume", value: `${(stats.totalQty / 1000000).toFixed(1)}M kg`, icon: Package, color: "text-green-600", bg: "bg-green-50" },
              { label: "Total Orders", value: `${(stats.totalOrders / 1000).toFixed(0)}K`, icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Retailers", value: stats.uniqueRetailers.toString(), icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
              { label: "Growth", value: `${stats.monthlyGrowth}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
            ].map((kpi) => (
              <Card key={kpi.label} className="transition-all duration-300 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`rounded-xl p-2.5 ${kpi.bg}`}>
                      <kpi.icon className={`h-4 w-4 ${kpi.color}`} strokeWidth={2.5} />
                    </div>
                  </div>
                  <p className="text-xl font-black num tracking-tight">{kpi.value}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{kpi.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
