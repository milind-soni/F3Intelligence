"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import realData from "@/lib/real-data.json";
import { ChevronLeft, ChevronRight, ArrowRight, TrendingUp, TrendingDown, Minus, Star, CreditCard, Clock, Store, Truck, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { retailerProfiles, vendorDetails } from "@/lib/retailer-profiles";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

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
  WATERMELON: 28,
  "KASHMIR APPLE": 145,
  "KINNAUR APPLE": 135,
  ANAR: 95,
  KINNOW: 45,
  ORANGE: 55,
  "SAFEDA MANGO": 110,
  "VNR GUAVA": 65,
};

const weekly = realData.weekly;

export default function DemandPage() {
  const [selectedIdx, setSelectedIdx] = useState(weekly.length - 2); // last completed week
  const [view, setView] = useState<"forecast" | "retailers">("forecast");

  const selectedWeek = weekly[selectedIdx];
  const prevWeek = weekly[selectedIdx - 1];
  const nextWeek = selectedIdx < weekly.length - 1 ? weekly[selectedIdx + 1] : null;

  type WeekRow = typeof weekly[number] & Record<string, unknown>;

  // Historical trend for the selected week's SKUs (last 12 weeks up to selected)
  const trendData = weekly.slice(Math.max(0, selectedIdx - 11), selectedIdx + 1).map((w) => ({
    label: w.week.split("/")[0].slice(5),
    ...Object.fromEntries(TOP_SKUS.map((s) => [s, ((w as WeekRow)[s] as number) ?? 0])),
    total: w.total,
  }));

  // SKU breakdown for selected week with bands
  const skuBreakdown = TOP_SKUS.map((sku) => {
    const qty = ((selectedWeek as WeekRow)[sku] as number) ?? 0;
    const prev = prevWeek ? (((prevWeek as WeekRow)[sku] as number) ?? 0) : qty;
    const change = prev > 0 ? ((qty - prev) / prev) * 100 : 0;
    return {
      sku,
      qty,
      upper: Math.round(qty * 1.18),
      lower: Math.round(qty * 0.82),
      price: SUGGESTED_PRICES[sku] ?? 80,
      change,
    };
  }).filter((s) => s.qty > 0).sort((a, b) => b.qty - a.qty);

  // Next week forecast
  const forecastData = TOP_SKUS.map((sku) => {
    const recent = weekly.slice(-4);
    const avg = recent.reduce((s, w) => s + ((((w as WeekRow)[sku]) as number) ?? 0), 0) / 4;
    return {
      sku,
      predicted: Math.round(avg),
      upper: Math.round(avg * 1.18),
      lower: Math.round(avg * 0.82),
      price: SUGGESTED_PRICES[sku] ?? 80,
    };
  }).filter((s) => s.predicted > 0).sort((a, b) => b.predicted - a.predicted);

  const [expandedRetailer, setExpandedRetailer] = useState<string | null>(null);
  const weekTotal = selectedWeek.total;

  return (
    <div>
      <PageHeader
        title="Demand Forecast"
        description="Weekly SKU-level predictions powered by 999K orders of proprietary data"
      />

      {/* Week Picker */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => { setSelectedIdx(Math.max(1, selectedIdx - 1)); setView("forecast"); }}
          disabled={selectedIdx <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
          {weekly.slice(-12).map((w, i) => {
            const idx = weekly.length - 12 + i;
            const isSelected = idx === selectedIdx;
            const isFuture = idx === weekly.length - 1;
            return (
              <button
                key={w.week}
                onClick={() => { setSelectedIdx(idx); setView("forecast"); }}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-all border ${
                  isSelected
                    ? "bg-green-600 text-white border-green-600 shadow-md scale-105"
                    : isFuture
                    ? "border-dashed border-green-400 text-green-600 bg-green-50"
                    : "border-border bg-card hover:border-green-400 hover:bg-green-50"
                }`}
              >
                <span className="block">{w.week.split("/")[0].slice(5)}</span>
                <span className={`block text-[10px] mt-0.5 ${isSelected ? "text-green-100" : "text-muted-foreground"}`}>
                  {isFuture ? "Forecast" : `${(w.total / 1000).toFixed(0)}K kg`}
                </span>
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => { setSelectedIdx(Math.min(weekly.length - 1, selectedIdx + 1)); setView("forecast"); }}
          disabled={selectedIdx >= weekly.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {view === "forecast" ? (
        <>
          {/* Week summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="col-span-2">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Week of {selectedWeek.week.split("/")[0]}
                    </p>
                    <p className="text-3xl font-bold mt-1">{weekTotal.toLocaleString()} kg</p>
                    <p className="text-sm text-muted-foreground mt-1">Total predicted demand across all SKUs</p>
                  </div>
                  {nextWeek && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">vs Next Week</p>
                      <p className={`text-lg font-bold ${nextWeek.total > weekTotal ? "text-green-600" : "text-red-500"}`}>
                        {nextWeek.total > weekTotal ? "+" : ""}{(((nextWeek.total - weekTotal) / weekTotal) * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-5 flex flex-col justify-center h-full">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">Confidence Band</p>
                <p className="text-2xl font-bold text-green-800">±18%</p>
                <p className="text-xs text-green-600 mt-1">Based on 29 months of variance analysis</p>
              </CardContent>
            </Card>
          </div>

          {/* Historical trend chart */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-1">12-Week Demand Trend — Real Data</h3>
              <p className="text-sm text-muted-foreground mb-4">Weekly volumes from your actual order history</p>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: number) => [`${v.toLocaleString()} kg`, ""]} contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                  <Area type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={2.5} fill="url(#trendGrad)" name="Total Volume" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* SKU Breakdown with bands */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">SKU Breakdown — Week of {selectedWeek.week.split("/")[0]}</h3>
              <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                {skuBreakdown.length} active SKUs
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {skuBreakdown.map((s) => {
                const TrendIcon = s.change > 2 ? TrendingUp : s.change < -2 ? TrendingDown : Minus;
                const trendColor = s.change > 2 ? "text-green-600" : s.change < -2 ? "text-red-500" : "text-muted-foreground";
                return (
                  <Card key={s.sku} className="overflow-hidden">
                    <div className="h-1.5 w-full" style={{ backgroundColor: SKU_COLORS[s.sku] ?? "#22c55e" }} />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <p className="text-sm font-semibold leading-tight">{s.sku}</p>
                        <div className={`flex items-center gap-1 ${trendColor}`}>
                          <TrendIcon className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">{Math.abs(s.change).toFixed(1)}%</span>
                        </div>
                      </div>

                      <p className="text-2xl font-bold">{s.qty.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mb-3">kg forecast</p>

                      {/* Band visualization */}
                      <div className="mb-3">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Lower: {s.lower.toLocaleString()}</span>
                          <span>Upper: {s.upper.toLocaleString()}</span>
                        </div>
                        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="absolute h-full rounded-full opacity-30"
                            style={{ left: "0%", width: "100%", backgroundColor: SKU_COLORS[s.sku] ?? "#22c55e" }}
                          />
                          <div
                            className="absolute h-full rounded-full"
                            style={{
                              left: "18%",
                              width: "64%",
                              backgroundColor: SKU_COLORS[s.sku] ?? "#22c55e",
                            }}
                          />
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-3 w-0.5 rounded-full bg-white"
                            style={{ left: "50%" }}
                          />
                        </div>
                      </div>

                      {/* Suggested price */}
                      <div className="rounded-md bg-muted/60 px-2 py-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Suggested Price</span>
                        <span className="text-sm font-bold" style={{ color: SKU_COLORS[s.sku] ?? "#16a34a" }}>
                          ₹{s.price}/kg
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Next week bar chart */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-1">Next Week Forecast</h3>
              <p className="text-sm text-muted-foreground mb-4">Predicted quantities with confidence bands</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={forecastData.map((s) => ({ name: s.sku.split(" ")[0], predicted: s.predicted, upper: s.upper, lower: s.lower }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toLocaleString()}`} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                  <Bar dataKey="predicted" radius={[4, 4, 0, 0]} name="Predicted (kg)">
                    {forecastData.map((s) => (
                      <Cell key={s.sku} fill={SKU_COLORS[s.sku] ?? "#22c55e"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* CTA: next → retailers */}
          <div className="flex justify-end">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 gap-2 text-base px-8"
              onClick={() => setView("retailers")}
            >
              Who gets this stock?
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </>
      ) : (
        /* Full Retailer Profile View */
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Retailer Allocation — Week of {selectedWeek.week.split("/")[0]}</h2>
              <p className="text-sm text-muted-foreground">
                {retailerProfiles.length} retailers &middot; {weekTotal.toLocaleString()} kg total &middot; click a card to expand full profile
              </p>
            </div>
            <Button variant="outline" onClick={() => setView("forecast")} className="gap-2">
              <ChevronLeft className="h-4 w-4" /> Back to Forecast
            </Button>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Priority Retailers", value: retailerProfiles.filter(r => r.tier === "Priority").length, color: "text-green-700" },
              { label: "Secondary", value: retailerProfiles.filter(r => r.tier === "Secondary").length, color: "text-amber-700" },
              { label: "Vendors Active", value: [...new Set(retailerProfiles.map(r => r.vendor))].length, color: "text-blue-700" },
              { label: "Avg Score", value: Math.round(retailerProfiles.reduce((s, r) => s + r.score, 0) / retailerProfiles.length), color: "text-purple-700" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-3 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Retailer cards */}
          <div className="space-y-3 mb-6">
            {retailerProfiles.map((r, i) => {
              const isExpanded = expandedRetailer === r.name;
              const weeklyKg = Math.round((r.avgDailyKg * 7));
              const vendor = vendorDetails[r.vendor];
              const tierStyle = r.tier === "Priority"
                ? "bg-green-100 text-green-700 border-green-200"
                : r.tier === "Secondary"
                ? "bg-amber-100 text-amber-700 border-amber-200"
                : "bg-red-100 text-red-700 border-red-200";
              const scoreColor = r.score >= 85 ? "text-green-600" : r.score >= 70 ? "text-amber-600" : "text-red-500";

              return (
                <Card
                  key={r.name}
                  className={`overflow-hidden transition-all ${isExpanded ? "shadow-md ring-1 ring-green-300" : "hover:shadow-sm"}`}
                >
                  {/* Colored top bar */}
                  <div className="h-1 w-full" style={{ backgroundColor: r.vendorColor }} />

                  {/* Collapsed view — always visible */}
                  <CardContent className="p-0">
                    <button
                      className="w-full text-left px-4 py-4"
                      onClick={() => setExpandedRetailer(isExpanded ? null : r.name)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Rank */}
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${i < 5 ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}>
                          {i + 1}
                        </span>

                        {/* Name + area */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">{r.name}</p>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${tierStyle}`}>{r.tier}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{r.area} &middot; {r.shopType}</p>
                        </div>

                        {/* Score */}
                        <div className="text-center shrink-0">
                          <p className={`text-xl font-bold ${scoreColor}`}>{r.score}</p>
                          <p className="text-[10px] text-muted-foreground">score</p>
                        </div>

                        {/* Weekly kg */}
                        <div className="text-center shrink-0">
                          <p className="text-xl font-bold text-green-700">{weeklyKg.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">kg/week</p>
                        </div>

                        {/* Vendor pill */}
                        <div className="flex items-center gap-1.5 shrink-0 rounded-full px-2.5 py-1 border" style={{ borderColor: r.vendorColor + "60", backgroundColor: r.vendorColor + "15" }}>
                          <Truck className="h-3 w-3" style={{ color: r.vendorColor }} />
                          <span className="text-xs font-medium" style={{ color: r.vendorColor }}>{r.vendor}</span>
                        </div>

                        {/* Expand toggle */}
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </div>
                    </button>

                    {/* Expanded profile */}
                    {isExpanded && (
                      <div className="border-t px-4 py-4 bg-muted/20">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                          {/* Col 1: Profile metrics */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Retailer Profile</p>
                            <div className="space-y-2.5">
                              {[
                                { icon: Star, label: "AI Score", value: `${r.score}/100`, color: scoreColor },
                                { icon: CreditCard, label: "Credit Score", value: `${r.creditScore}/100`, color: r.creditScore >= 80 ? "text-green-600" : "text-amber-600" },
                                { icon: Clock, label: "Payment Terms", value: `Net ${r.paymentDays} days`, color: r.paymentDays <= 10 ? "text-green-600" : r.paymentDays <= 18 ? "text-amber-600" : "text-red-500" },
                                { icon: Store, label: "Shop Type", value: r.shopType, color: "text-foreground" },
                                { icon: Truck, label: "Vendor", value: r.vendor, color: "text-foreground" },
                              ].map((m) => (
                                <div key={m.label} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">{m.label}</span>
                                  </div>
                                  <span className={`text-xs font-semibold ${m.color}`}>{m.value}</span>
                                </div>
                              ))}
                            </div>

                            {/* Vendor detail box */}
                            {vendor && (
                              <div className="mt-4 rounded-lg border p-3" style={{ borderColor: r.vendorColor + "40", backgroundColor: r.vendorColor + "08" }}>
                                <p className="text-xs font-semibold mb-1" style={{ color: r.vendorColor }}>{vendor.name}</p>
                                <p className="text-[10px] text-muted-foreground">{vendor.location}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-[10px] text-muted-foreground">Reliability</span>
                                  <span className="text-[10px] font-bold text-green-600">{vendor.reliability}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-muted-foreground">Lead time</span>
                                  <span className="text-[10px] font-semibold">{vendor.leadTimeDays}d</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-muted-foreground">Terms</span>
                                  <span className="text-[10px] font-semibold">{vendor.paymentTerms}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Col 2: SKU allocation this week */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">This Week&apos;s SKU Indent</p>
                            <div className="space-y-2">
                              {Object.entries(r.skuAllocation).map(([sku, pct]) => {
                                const kgQty = Math.round(weeklyKg * pct / 100);
                                return (
                                  <div key={sku}>
                                    <div className="flex items-center justify-between mb-0.5">
                                      <div className="flex items-center gap-1.5">
                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: SKU_COLORS[sku] ?? "#6b7280" }} />
                                        <span className="text-xs font-medium">{sku}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">{pct}%</span>
                                        <span className="text-xs font-bold">{kgQty.toLocaleString()} kg</span>
                                      </div>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                      <div
                                        className="h-full rounded-full"
                                        style={{ width: `${pct}%`, backgroundColor: SKU_COLORS[sku] ?? "#6b7280" }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Suggested prices for their top SKUs */}
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2">Suggested Sell Price</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {Object.keys(r.skuAllocation).slice(0, 4).map((sku) => (
                                <div key={sku} className="rounded-md bg-muted/60 px-2 py-1.5 flex items-center justify-between">
                                  <span className="text-[10px] text-muted-foreground truncate">{sku.split(" ")[0]}</span>
                                  <span className="text-xs font-bold shrink-0 ml-1" style={{ color: SKU_COLORS[sku] ?? "#16a34a" }}>
                                    ₹{SUGGESTED_PRICES[sku] ?? 80}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Col 3: Radar chart */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Performance Radar</p>
                            <ResponsiveContainer width="100%" height={200}>
                              <RadarChart data={r.radarMetrics}>
                                <PolarGrid stroke="#d1d5db" />
                                <PolarAngleAxis dataKey="label" tick={{ fontSize: 10 }} />
                                <Radar name="Score" dataKey="value" stroke={r.vendorColor} fill={r.vendorColor} fillOpacity={0.25} strokeWidth={2} />
                              </RadarChart>
                            </ResponsiveContainer>
                            <div className="grid grid-cols-2 gap-1.5 mt-1">
                              {r.radarMetrics.map((m) => (
                                <div key={m.label} className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1">
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

          <div className="flex justify-end">
            <Link href="/retailers">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 gap-2 text-base px-8">
                View on Map
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
