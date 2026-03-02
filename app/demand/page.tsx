"use client";

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
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
} from "lucide-react";
import { retailerProfiles } from "@/lib/retailer-profiles";

const TOP_SKUS = ["WATERMELON", "KASHMIR APPLE", "KINNAUR APPLE", "ANAR", "KINNOW", "ORANGE", "SAFEDA MANGO", "VNR GUAVA"];

const SKU_COLORS: Record<string, string> = {
  WATERMELON: "#22c55e",
  "KASHMIR APPLE": "#ef4444",
  "KINNAUR APPLE": "#f97316",
  ANAR: "#ec4899",
  KINNOW: "#f59e0b",
  ORANGE: "#fb923c",
  "SAFEDA MANGO": "#84cc16",
  "VNR GUAVA": "#8b5cf6",
};

const SUGGESTED_PRICES: Record<string, number> = {
  WATERMELON: 28, "KASHMIR APPLE": 145, "KINNAUR APPLE": 135,
  ANAR: 95, KINNOW: 45, ORANGE: 55, "SAFEDA MANGO": 110, "VNR GUAVA": 65,
};

const weekly = realData.weekly;
type WeekRow = typeof weekly[number] & Record<string, unknown>;

export default function DemandPage() {
  const [selectedIdx, setSelectedIdx] = useState(weekly.length - 2);
  const [expandedRetailer, setExpandedRetailer] = useState<string | null>(null);

  const selectedWeek = weekly[selectedIdx];
  const prevWeek = weekly[selectedIdx - 1];
  const nextWeek = selectedIdx < weekly.length - 1 ? weekly[selectedIdx + 1] : null;
  const weekTotal = selectedWeek.total;

  const trendData = weekly.slice(Math.max(0, selectedIdx - 11), selectedIdx + 1).map((w) => ({
    label: w.week.split("/")[0].slice(5),
    total: w.total,
  }));

  const skuQuality = realData.skuQuality as Record<string, { A: string | null; B: string | null; C: string | null }>;

  const skuBreakdown = TOP_SKUS.map((sku) => {
    const qty = ((selectedWeek as WeekRow)[sku] as number) ?? 0;
    const prev = prevWeek ? (((prevWeek as WeekRow)[sku] as number) ?? 0) : qty;
    const change = prev > 0 ? ((qty - prev) / prev) * 100 : 0;
    const quality = skuQuality[sku] ?? null;
    return { sku, qty, upper: Math.round(qty * 1.18), lower: Math.round(qty * 0.82), price: SUGGESTED_PRICES[sku] ?? 80, change, quality };
  }).filter((s) => s.qty > 0).sort((a, b) => b.qty - a.qty);

  const tierStyle = (tier: string) =>
    tier === "Priority" ? "bg-green-100 text-green-700 border-green-200"
    : tier === "Secondary" ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-red-100 text-red-700 border-red-200";

  const scoreColor = (s: number) => s >= 85 ? "text-green-600" : s >= 70 ? "text-amber-600" : "text-red-500";

  return (
    <div>
      <PageHeader
        title="Demand Forecast"
        description="Weekly SKU predictions + retailer allocation — powered by 999K real orders"
      />

      {/* Week Picker */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="icon"
          onClick={() => setSelectedIdx(Math.max(1, selectedIdx - 1))}
          disabled={selectedIdx <= 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
          {weekly.slice(-12).map((w, i) => {
            const idx = weekly.length - 12 + i;
            const isSelected = idx === selectedIdx;
            const isFuture = idx === weekly.length - 1;
            return (
              <button key={w.week}
                onClick={() => setSelectedIdx(idx)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-all border ${
                  isSelected ? "bg-green-600 text-white border-green-600 shadow-md scale-105"
                  : isFuture ? "border-dashed border-green-400 text-green-600 bg-green-50"
                  : "border-border bg-card hover:border-green-400 hover:bg-green-50"
                }`}>
                <span className="block">{w.week.split("/")[0].slice(5)}</span>
                <span className={`block text-[10px] mt-0.5 ${isSelected ? "text-green-100" : "text-muted-foreground"}`}>
                  {isFuture ? "Forecast" : `${(w.total / 1000).toFixed(0)}K kg`}
                </span>
              </button>
            );
          })}
        </div>
        <Button variant="outline" size="icon"
          onClick={() => setSelectedIdx(Math.min(weekly.length - 1, selectedIdx + 1))}
          disabled={selectedIdx >= weekly.length - 1}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* === MAIN: Two-column layout === */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">

        {/* LEFT: SKU breakdown (2/5) */}
        <div className="xl:col-span-2 space-y-4">

          {/* Week summary */}
          <Card className="bg-gradient-to-br from-green-600 to-green-500 text-white">
            <CardContent className="p-5">
              <p className="text-sm text-green-100 font-medium">Week of {selectedWeek.week.split("/")[0]}</p>
              <p className="text-4xl font-bold mt-1">{weekTotal.toLocaleString()} kg</p>
              <p className="text-sm text-green-100 mt-1">Total demand across {skuBreakdown.length} SKUs</p>
              <div className="flex items-center gap-4 mt-3">
                <div>
                  <p className="text-xs text-green-100">Confidence</p>
                  <p className="text-lg font-bold">±18%</p>
                </div>
                {nextWeek && (
                  <div>
                    <p className="text-xs text-green-100">vs Next Week</p>
                    <p className={`text-lg font-bold ${nextWeek.total > weekTotal ? "text-white" : "text-red-200"}`}>
                      {nextWeek.total > weekTotal ? "+" : ""}{(((nextWeek.total - weekTotal) / weekTotal) * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Trend chart */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-1">12-Week Trend</p>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="tG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                  <YAxis hide />
                  <Tooltip formatter={(v: number) => [`${v.toLocaleString()} kg`, ""]} contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "11px" }} />
                  <Area type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={2} fill="url(#tG)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* SKU cards */}
          <div className="space-y-2">
            {skuBreakdown.map((s) => {
              const TrendIcon = s.change > 2 ? TrendingUp : s.change < -2 ? TrendingDown : Minus;
              const tColor = s.change > 2 ? "text-green-600" : s.change < -2 ? "text-red-500" : "text-muted-foreground";
              return (
                <Card key={s.sku} className="overflow-hidden">
                  <div className="h-1 w-full" style={{ backgroundColor: SKU_COLORS[s.sku] }} />
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-semibold">{s.sku}</p>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1 ${tColor}`}>
                          <TrendIcon className="h-3 w-3" />
                          <span className="text-xs">{Math.abs(s.change).toFixed(1)}%</span>
                        </div>
                        <span className="text-base font-bold">{s.qty.toLocaleString()} kg</span>
                      </div>
                    </div>
                    {/* Band bar */}
                    <div className="relative h-2 rounded-full bg-muted overflow-hidden mb-1.5">
                      <div className="absolute h-full rounded-full opacity-25 w-full" style={{ backgroundColor: SKU_COLORS[s.sku] }} />
                      <div className="absolute h-full rounded-full" style={{ left: "18%", width: "64%", backgroundColor: SKU_COLORS[s.sku] }} />
                      <div className="absolute top-1/2 -translate-y-1/2 h-3 w-0.5 rounded-full bg-white" style={{ left: "50%" }} />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-muted-foreground">{s.lower.toLocaleString()} – {s.upper.toLocaleString()} kg</span>
                      <span className="text-xs font-bold" style={{ color: SKU_COLORS[s.sku] }}>₹{s.price}/kg</span>
                    </div>
                    {s.quality && (
                      <div className="flex items-center gap-1.5">
                        {[
                          { label: "A", value: s.quality.A, bg: "bg-green-100 text-green-700" },
                          { label: "B", value: s.quality.B, bg: "bg-amber-100 text-amber-700" },
                          { label: "C", value: s.quality.C, bg: "bg-muted text-muted-foreground" },
                        ].filter(g => g.value).map((g) => (
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

          {/* Next week bar */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-3">Next Week Forecast</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={skuBreakdown.map((s) => ({ name: s.sku.split(" ")[0], qty: Math.round(s.qty * 1.03) }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "11px" }} />
                  <Bar dataKey="qty" radius={[4, 4, 0, 0]} name="Forecast (kg)">
                    {skuBreakdown.map((s) => <Cell key={s.sku} fill={SKU_COLORS[s.sku] ?? "#22c55e"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Retailer allocation — main focus (3/5) */}
        <div className="xl:col-span-3">
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
            {retailerProfiles.map((r, i) => {
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
                                const quality = (realData.skuQuality as Record<string, Record<string, string | null>>)[sku];
                                return (
                                  <div key={sku}>
                                    <div className="flex items-center justify-between mb-0.5">
                                      <div className="flex items-center gap-1">
                                        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: SKU_COLORS[sku] ?? "#6b7280" }} />
                                        <span className="text-xs">{sku.split(" ")[0]}</span>
                                        {quality?.A && (
                                          <span className="text-[9px] bg-muted px-1 rounded text-muted-foreground">{quality.A}</span>
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
      </div>
    </div>
  );
}
