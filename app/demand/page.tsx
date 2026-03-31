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
import { format, parseISO, closestTo, differenceInDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import realData from "@/lib/real-data.json";
import {
  TrendingUp, TrendingDown, Minus,
  CreditCard, Clock, Store, ChevronDown, ChevronUp,
  Search, Package, Users, BarChart3, AlertCircle, Leaf,
  Calendar as CalendarIcon, X, ArrowRight, Layers, Target,
  Mail, Navigation, Wheat, Download,
} from "lucide-react";
import { retailerProfiles } from "@/lib/retailer-profiles";
import allCustomers from "@/lib/customers.json";
import farmerData from "@/lib/farmer-data.json";
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
  "TURKEY APPLE": "#f43f5e", "WASHINGTON APPLE": "#64748b", SHARDA: "#a3e635",
  "GALA APPLE": "#c084fc", "CHAUSA MANGO": "#fbbf24", "DUSSERI MANGO": "#34d399",
  "LANGDA MANGO": "#2dd4bf",
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
const TODAY = "2026-03-14";
const timeline = buildTimeline().filter(tw => tw.week.split("/")[1] >= TODAY);

function weekLabel(w: string) { return w.split("/")[0].slice(5); }
function weekDate(w: string) { return w.split("/")[0]; }

const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function weekOrdinalLabel(w: string): string {
  const date = parseISO(w.split("/")[0]);
  return `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}`;
}

function getWeekConfidence(week: string): string {
  const hash = week.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ((hash % 38) / 10 + 1.1).toFixed(1);
}

type FarmerRow = { month: number; vendor: string; item: string; weeklyQty: number };
const allFarmerData = farmerData as FarmerRow[];

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

// ── SKU Yearly View Component ─────────────────────────────────────────
function SkuYearlyView() {
  const [expandedSku, setExpandedSku] = useState<string | null>(null);

  const skuYearlyData = useMemo(() => {
    // Combine historical + predicted data, group by month per SKU
    const allWeeks = [...dispatched, ...predicted];
    // Deduplicate by week key (predicted takes precedence for future)
    const weekMap = new Map<string, WeekRow>();
    for (const w of dispatched) weekMap.set(w.week as string, w);
    for (const w of predicted) weekMap.set(w.week as string, w); // overwrite with predicted
    const weeks = Array.from(weekMap.values()).sort((a, b) => (a.week as string).localeCompare(b.week as string));

    // Only 2026 data
    const weeks2026 = weeks.filter(w => (w.week as string).startsWith("2026"));

    const skuMonthly = new Map<string, Map<number, number>>();
    const skuYearTotal = new Map<string, number>();

    for (const w of weeks2026) {
      const monthIdx = parseInt((w.week as string).slice(5, 7)) - 1; // 0-11
      for (const [k, v] of Object.entries(w)) {
        if (k === "week" || k === "total" || typeof v !== "number" || v <= 0) continue;
        if (!skuMonthly.has(k)) skuMonthly.set(k, new Map());
        const monthly = skuMonthly.get(k)!;
        monthly.set(monthIdx, (monthly.get(monthIdx) ?? 0) + v);
        skuYearTotal.set(k, (skuYearTotal.get(k) ?? 0) + v);
      }
    }

    return Array.from(skuYearTotal.entries())
      .map(([sku, yearTotal]) => {
        const monthly = skuMonthly.get(sku)!;
        const chartData = SHORT_MONTHS.map((m, i) => ({
          month: m,
          qty: Math.round(monthly.get(i) ?? 0),
        }));
        return { sku, yearTotal: Math.round(yearTotal), chartData };
      })
      .sort((a, b) => b.yearTotal - a.yearTotal);
  }, []);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-extrabold tracking-tight">SKU Yearly Procurement</h2>
        <p className="text-xs text-muted-foreground font-medium mt-1">
          {skuYearlyData.length} SKUs · 2026 forecast · click to expand monthly breakdown
        </p>
      </div>
      {skuYearlyData.map((s, idx) => {
        const color = SKU_COLORS[s.sku] ?? "#6b7280";
        const isExpanded = expandedSku === s.sku;
        const farmers = allFarmerData.filter(f => f.item === s.sku);
        return (
          <Card key={s.sku} className={cn("transition-all duration-200 overflow-hidden", isExpanded ? "shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] ring-1 ring-primary/20" : "hover:shadow-[0_4px_16px_-6px_rgba(0,0,0,0.08)]")}>
            <CardContent className="p-0">
              <div className="flex items-stretch">
                <div className="w-1.5 shrink-0 rounded-l-2xl" style={{ backgroundColor: color }} />
                <button
                  className="flex-1 text-left px-4 py-3.5 flex items-center gap-4"
                  onClick={() => setExpandedSku(isExpanded ? null : s.sku)}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-black" style={{ backgroundColor: `${color}15`, color }}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">{s.sku}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      {s.chartData.filter(d => d.qty > 0).length} active months
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black num text-primary">{s.yearTotal.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">kg / year</p>
                  </div>
                  <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center shrink-0 transition-colors", isExpanded ? "bg-primary/10" : "bg-muted")}>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-primary" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                </button>
              </div>
              {isExpanded && (
                <>
                  <Separator />
                  <div className="px-5 py-5 bg-accent/20 space-y-6">
                    {/* Area Chart */}
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Monthly Procurement · 2026</p>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={s.chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 600 }} />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                            <Tooltip formatter={(v: number) => [`${v.toLocaleString()} kg`, s.sku]} />
                            <Area type="monotone" dataKey="qty" stroke={color} fill={`${color}20`} strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Monthly Table */}
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Monthly Breakdown</p>
                      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
                        {s.chartData.map(d => (
                          <div key={d.month} className={cn("rounded-xl border p-2.5 text-center", d.qty > 0 ? "bg-white border-black/[0.06]" : "bg-muted/30 border-dashed border-border/50")}>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{d.month}</p>
                            <p className={cn("text-sm font-black num mt-1", d.qty > 0 ? "text-foreground" : "text-muted-foreground/40")}>
                              {d.qty > 0 ? `${(d.qty / 1000).toFixed(1)}K` : "—"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Farmer Supply */}
                    {farmers.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Farmer Supply · All Months</p>
                        <div className="space-y-2">
                          {farmers.slice(0, 10).map((f, fi) => (
                            <div key={f.vendor + fi} className="flex items-center gap-3 rounded-xl border border-black/[0.04] bg-white px-4 py-2.5">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-black" style={{ backgroundColor: `${color}15`, color }}>
                                {fi + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate">{f.vendor}</p>
                                <p className="text-[10px] text-muted-foreground">{SHORT_MONTHS[f.month - 1]}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-black num">{f.weeklyQty.toLocaleString()}</p>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase">kg/wk</p>
                              </div>
                            </div>
                          ))}
                          {farmers.length > 10 && (
                            <p className="text-[10px] text-muted-foreground text-center pt-1">+ {farmers.length - 10} more farmers</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
export default function DemandPage() {
  const defaultIdx = (() => {
    // Find the week containing today
    const todayIdx = timeline.findIndex(tw => {
      const [start, end] = tw.week.split("/");
      return TODAY >= start && TODAY <= end;
    });
    if (todayIdx !== -1) return todayIdx;
    return 0;
  })();
  const [fromIdx, setFromIdx] = useState(Math.max(0, defaultIdx));
  const [toIdx, setToIdx] = useState(Math.max(0, defaultIdx));
  const [searchItem, setSearchItem] = useState("");
  const [searchVendor, setSearchVendor] = useState("");
  const [expandedRetailer, setExpandedRetailer] = useState<string | null>(null);
  const [vendorPage, setVendorPage] = useState(1);
  const [stockInput, setStockInput] = useState<Record<string, number>>({});
  const [showPlanner, setShowPlanner] = useState(false);
  const [expandedProcSku, setExpandedProcSku] = useState<string | null>(null);
  const [showAllDistribution, setShowAllDistribution] = useState(false);
  const [additionalInventory, setAdditionalInventory] = useState<Record<string, number>>({});
  const [revealedWeeks, setRevealedWeeks] = useState<Set<number>>(new Set());
  const [revealingWeek, setRevealingWeek] = useState<number | null>(null);
  const [justRevealed, setJustRevealed] = useState<number | null>(null);
  const [procView, setProcView] = useState<"week" | "sku">("week");
  const [rawCalRange, setRawCalRange] = useState<{ from: Date | null; to: Date | null }>({ from: parseISO(TODAY), to: parseISO(TODAY) });
  const VENDORS_PER_PAGE = 30;
  const weekScrollRef = useRef<HTMLDivElement>(null);

  // Range is fromIdx..toIdx
  const isRange = fromIdx !== toIdx;
  const rangeStart = Math.min(fromIdx, toIdx);
  const rangeEnd = Math.max(fromIdx, toIdx);

  useEffect(() => {
    const el = weekScrollRef.current;
    if (!el) return;
    const fromEl = el.querySelector("[data-range-from]") as HTMLElement | null;
    const toEl = el.querySelector("[data-range-to]") as HTMLElement | null;
    if (!fromEl) return;
    // Center the midpoint of the selected range
    const containerLeft = el.getBoundingClientRect().left;
    const fromLeft = fromEl.getBoundingClientRect().left - containerLeft + el.scrollLeft;
    const toRight = toEl
      ? toEl.getBoundingClientRect().right - containerLeft + el.scrollLeft
      : fromLeft + fromEl.offsetWidth;
    const midpoint = (fromLeft + toRight) / 2;
    const targetScrollLeft = midpoint - el.clientWidth / 2;
    el.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
  }, [fromIdx, toIdx]);

  const tw = timeline[fromIdx];
  const prevTw = rangeStart > 0 ? timeline[rangeStart - 1] : null;
  const nextTw = rangeEnd < timeline.length - 1 ? timeline[rangeEnd + 1] : null;

  // Compute fraction of a week covered by the raw date selection
  function weekFraction(weekStr: string, rawF: Date | null, rawT: Date | null): number {
    if (!rawF && !rawT) return 1;
    const [startStr, endStr] = weekStr.split("/");
    const wStart = parseISO(startStr);
    const wEnd = parseISO(endStr);
    const covStart = rawF && rawF > wStart ? rawF : wStart;
    const covEnd = rawT && rawT < wEnd ? rawT : wEnd;
    const covDays = Math.max(0, differenceInDays(covEnd, covStart) + 1);
    return Math.min(1, covDays / 7);
  }

  // Aggregate SKUs across selected range (with partial-week interpolation)
  const activeSkus = useMemo(() => {
    const skuTotals = new Map<string, number>();
    for (let i = rangeStart; i <= rangeEnd; i++) {
      const src = timeline[i].predictedData ?? timeline[i].dispatchedData;
      if (!src) continue;
      const frac = weekFraction(timeline[i].week, rawCalRange.from, rawCalRange.to);
      for (const [k, v] of Object.entries(src)) {
        if (k === "week" || k === "total" || typeof v !== "number" || v <= 0) continue;
        skuTotals.set(k, (skuTotals.get(k) ?? 0) + v * frac);
      }
    }
    return Array.from(skuTotals.entries())
      .map(([sku, qty]) => ({ sku, qty: Math.round(qty) }))
      .sort((a, b) => b.qty - a.qty);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart, rangeEnd, rawCalRange]);

  const rangeTotal = useMemo(() => {
    let total = 0;
    for (let i = rangeStart; i <= rangeEnd; i++) {
      const frac = weekFraction(timeline[i].week, rawCalRange.from, rawCalRange.to);
      total += Math.round(timeline[i].total * frac);
    }
    return total;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart, rangeEnd, rawCalRange]);

  const rangeWeekCount = rangeEnd - rangeStart + 1;
  const activeNames = useMemo(() => new Set(activeSkus.map(s => s.sku)), [activeSkus]);
  const excludedSkus = useMemo(() => getExcludedSkus(activeNames), [activeNames]);

  // Stock distribution planner — compute allocation per retailer from user input
  const distributionPlan = useMemo(() => {
    const hasInput = Object.values(stockInput).some(v => v > 0);
    if (!hasInput) return [];

    // Get all profiled retailers sorted by tier priority then score
    const tierOrder = { Priority: 0, Secondary: 1, "Low Value": 2 };
    const sorted = [...retailerProfiles].sort((a, b) => {
      const td = tierOrder[a.tier] - tierOrder[b.tier];
      return td !== 0 ? td : b.score - a.score;
    });

    // For each SKU, compute total demand across retailers
    const skuDemandTotals = new Map<string, number>();
    for (const r of sorted) {
      for (const [sku, pct] of Object.entries(r.skuAllocation)) {
        if (stockInput[sku] && stockInput[sku] > 0) {
          const demand = (r.avgDailyKg * 7 * pct) / 100;
          skuDemandTotals.set(sku, (skuDemandTotals.get(sku) ?? 0) + demand);
        }
      }
    }

    // Distribute proportionally, capped by available stock
    return sorted.map(r => {
      const items: { sku: string; qty: number }[] = [];
      let totalKg = 0;
      for (const [sku, pct] of Object.entries(r.skuAllocation)) {
        const available = stockInput[sku] ?? 0;
        if (available <= 0) continue;
        const demand = (r.avgDailyKg * 7 * pct) / 100;
        const totalDemand = skuDemandTotals.get(sku) ?? 1;
        // Allocate proportionally: retailer's share of total demand × available stock
        const allocated = Math.round((demand / totalDemand) * available);
        if (allocated > 0) {
          items.push({ sku, qty: allocated });
          totalKg += allocated;
        }
      }
      return { retailer: r, items, totalKg };
    }).filter(d => d.totalKg > 0);
  }, [stockInput]);
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
  const fromDate = parseISO(timeline[rangeStart].week.split("/")[0]);
  const selectedMonth = (rawCalRange.from ?? fromDate).getMonth() + 1; // 1-12

  const estimatedSkuAllocation = useMemo(() => {
    const top5 = activeSkus.slice(0, 5);
    const top5Total = top5.reduce((sum, s) => sum + s.qty, 0);
    if (top5Total === 0) return {} as Record<string, number>;
    return Object.fromEntries(top5.map(s => [s.sku, Math.round((s.qty / top5Total) * 100)])) as Record<string, number>;
  }, [activeSkus]);

  const timelineDates = useMemo(() => timeline.map(t => parseISO(t.week.split("/")[0])), []);

  const getWeekIdxForDate = (date: Date): number => {
    const dateStr = format(date, "yyyy-MM-dd");
    for (let i = 0; i < timeline.length; i++) {
      const [start, end] = timeline[i].week.split("/");
      if (dateStr >= start && dateStr <= end) return i;
    }
    // Fallback: closest week start
    const closest = closestTo(date, timelineDates);
    if (closest) {
      const idx = timeline.findIndex(t => t.week.split("/")[0] === format(closest, "yyyy-MM-dd"));
      if (idx !== -1) return idx;
    }
    return 0;
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range) return;
    if (range.from && range.to) {
      setRawCalRange({ from: range.from, to: range.to });
      const fi = getWeekIdxForDate(range.from);
      const ti = getWeekIdxForDate(range.to);
      setFromIdx(Math.min(fi, ti));
      setToIdx(Math.max(fi, ti));
    } else if (range.from) {
      setRawCalRange({ from: range.from, to: null });
      const idx = getWeekIdxForDate(range.from);
      setFromIdx(idx);
      setToIdx(idx);
    } else {
      setRawCalRange({ from: null, to: null });
    }
  };

  const calendarSelected: DateRange = {
    from: rawCalRange.from ?? undefined,
    to: rawCalRange.to ?? undefined,
  };

  // Is the currently selected single week a predicted week that hasn't been revealed yet?
  const selectedIsPredictedLocked = !isRange && tw.isPredicted && !revealedWeeks.has(fromIdx) && revealingWeek !== fromIdx;
  // Is the shimmer currently playing on the selected week?
  const selectedIsRevealing = revealingWeek === fromIdx;
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
              <p className={cn("text-2xl font-black tracking-tight num text-primary transition-all duration-500", (selectedIsPredictedLocked || selectedIsRevealing) && "blur-md select-none")}>
                {rangeTotal.toLocaleString()}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">{isRange ? `kg · ${rangeWeekCount} weeks` : "kg this week"}</p>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div className="text-right">
              <p className={cn("text-2xl font-black tracking-tight num transition-all duration-500", (selectedIsPredictedLocked || selectedIsRevealing) && "blur-md select-none")}>
                {activeSkus.length}
              </p>
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
              mode="range"
              selected={calendarSelected}
              onSelect={handleRangeSelect}
              defaultMonth={rawCalRange.from ?? fromDate}
              autoFocus
              numberOfMonths={2}
              disabled={(date) => {
                const start = parseISO(timeline[0].week.split("/")[0]);
                const end = parseISO(timeline[timeline.length - 1].week.split("/")[1]);
                return date < start || date > end;
              }}
            />
          </PopoverContent>
        </Popover>

        <div className="flex-1 overflow-hidden relative">
          <div ref={weekScrollRef} className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory">
            {timeline.map((t, i) => {
              const realIdx = i;
              const inRange = realIdx >= rangeStart && realIdx <= rangeEnd;
              const isFrom = realIdx === rangeStart;
              const isTo = realIdx === rangeEnd;
              const tTotal = t.total;
              const ordLabel = weekOrdinalLabel(t.week);
              const isPred = t.isPredicted;
              const isRevealed = revealedWeeks.has(realIdx);
              const isRevealing = revealingWeek === realIdx;
              // Count predicted week number (1-based)
              const predWeekNum = isPred ? timeline.slice(0, i + 1).filter(tw => tw.isPredicted).length : 0;
              const showHidden = isPred && !isRevealed && !isRevealing;
              return (
                <button
                  key={t.week}
                  data-range-from={isFrom || undefined}
                  data-range-to={isTo || undefined}
                  onClick={() => {
                    if (showHidden) {
                      setRevealingWeek(realIdx);
                      setFromIdx(realIdx);
                      setToIdx(realIdx);
                      setRawCalRange({ from: null, to: null });
                      setTimeout(() => {
                        setRevealedWeeks(prev => new Set([...prev, realIdx]));
                        setRevealingWeek(null);
                        setJustRevealed(realIdx);
                        setTimeout(() => setJustRevealed(null), 1500);
                      }, 800);
                    } else {
                      setFromIdx(realIdx); setToIdx(realIdx); setRawCalRange({ from: null, to: null });
                    }
                  }}
                  className={cn(
                    "shrink-0 snap-center flex flex-col items-center px-3 py-2 rounded-xl border text-center transition-all min-w-[72px]",
                    isRevealing
                      ? "animate-shimmer border-primary/40 shadow-md"
                      : showHidden
                        ? "bg-card border-dashed border-primary/30 hover:border-primary/50 animate-pulse-soft cursor-pointer"
                        : inRange
                          ? "bg-primary text-primary-foreground border-primary shadow-md"
                          : "bg-card border-black/[0.04] hover:bg-accent hover:border-primary/20"
                  )}
                >
                  <span className={cn("text-[11px] font-bold transition-opacity duration-500", showHidden && "text-muted-foreground")}>
                    {showHidden ? `Week ${predWeekNum}` : ordLabel}
                  </span>
                  <span className={cn("text-[10px] font-semibold num mt-0.5 transition-opacity duration-500", inRange && !showHidden ? "text-primary-foreground/80" : "text-muted-foreground")}>
                    {showHidden ? "?" : `${(tTotal / 1000).toFixed(0)}K kg`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Badge variant="outline" className={cn(
          "px-3 py-1.5 font-bold tracking-wider uppercase text-[10px] rounded-lg shrink-0",
          isRange
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : tw.dispatchedData
              ? "bg-muted text-muted-foreground border-border"
              : "bg-primary/10 text-primary border-primary/20"
        )}>
          {isRange ? `${rangeWeekCount} weeks` : tw.dispatchedData ? "Historical" : "Predicted"}
        </Badge>
      </div>

      {/* ── Locked / Analysing state ────────────────────────── */}
      {(selectedIsPredictedLocked || selectedIsRevealing) && (
        <div className="rounded-2xl border border-dashed border-border bg-accent/30 py-16 text-center">
          {selectedIsRevealing ? (
            <div className="space-y-3">
              <p className="text-sm font-bold text-foreground">Analysing...</p>
              <div className="flex justify-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Click a predicted week to reveal forecast</p>
          )}
        </div>
      )}

      {/* ── Summary KPIs ──────────────────────────────────────── */}
      <div className={cn(
        "grid grid-cols-2 sm:grid-cols-4 gap-4 transition-all duration-700",
        (selectedIsPredictedLocked || selectedIsRevealing) && "opacity-0 h-0 overflow-hidden",
        justRevealed !== null && "animate-in fade-in-0 slide-in-from-bottom-4"
      )}>
        {[
          { label: isRange ? "Date Range" : "Week of", value: isRange ? `${weekDate(timeline[rangeStart].week)} → ${weekDate(timeline[rangeEnd].week)}` : weekDate(tw.week), sub: `${rangeTotal.toLocaleString()} kg${isRange ? ` · ${rangeWeekCount} weeks` : ""}`, icon: CalendarIcon, color: "text-primary", bg: "bg-primary/10" },
          { label: "Active SKUs", value: activeSkus.length.toString(), sub: `of ${stats.uniqueSkus} total`, icon: Layers, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Confidence", value: `±${getWeekConfidence(tw.week)}%`, sub: "prediction band", icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "vs Next Week", value: `${nextDelta > 0 ? "+" : ""}${nextDelta.toFixed(1)}%`, sub: nextDelta > 0 ? "volume increase" : nextDelta < 0 ? "volume decrease" : "no change", icon: TrendingUp, color: nextDelta > 0 ? "text-green-600" : nextDelta < 0 ? "text-red-500" : "text-muted-foreground", bg: nextDelta > 0 ? "bg-green-50" : nextDelta < 0 ? "bg-red-50" : "bg-muted" },
        ].map((kpi) => (
          <Card key={kpi.label} className="transition-all duration-300 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`rounded-xl p-2.5 ${kpi.bg}`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} strokeWidth={2.5} />
                </div>
              </div>
              <p className={`${kpi.value.length > 12 ? "text-base" : "text-2xl"} font-black tracking-tight num ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{kpi.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs: Sales Allocation / Procurement Forecast ────────── */}
      <Tabs defaultValue="procurement" className={cn(
        "space-y-5 transition-all duration-700",
        (selectedIsPredictedLocked || selectedIsRevealing) && "opacity-0 h-0 overflow-hidden",
        justRevealed !== null && "animate-in fade-in-0 slide-in-from-bottom-6 duration-700"
      )}>
        <TabsList variant="line">
          <TabsTrigger value="procurement" className="gap-1.5"><Wheat className="h-3.5 w-3.5" /> Procurement Forecast</TabsTrigger>
          <TabsTrigger value="allocation" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Sales Allocation</TabsTrigger>
        </TabsList>

        {/* ════ TAB: Procurement Forecast ═══════════════════════ */}
        <TabsContent value="procurement" className="space-y-5">
          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={procView === "week" ? "default" : "outline"}
              size="sm"
              className="text-xs font-bold rounded-xl"
              onClick={() => setProcView("week")}
            >
              By Week
            </Button>
            <Button
              variant={procView === "sku" ? "default" : "outline"}
              size="sm"
              className="text-xs font-bold rounded-xl"
              onClick={() => setProcView("sku")}
            >
              By SKU
            </Button>
          </div>

          {procView === "week" && (<>
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Procurement Forecast</h2>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                {activeSkus.length} active SKUs · {LONG_MONTHS[selectedMonth - 1]} · click a SKU to see farmers &amp; plan inventory
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs font-bold border-border rounded-xl hover:bg-accent"
                onClick={() => {
                  const rows = [["SKU", "Kg Needed", "Farmers", "Total Capacity (kg/wk)", "Month"]];
                  for (const s of activeSkus) {
                    const farmers = allFarmerData.filter(f => f.item === s.sku && f.month === selectedMonth);
                    const cap = farmers.reduce((sum, f) => sum + f.weeklyQty, 0);
                    rows.push([s.sku, String(s.qty), String(farmers.length), String(cap), LONG_MONTHS[selectedMonth - 1]]);
                    for (const f of farmers) {
                      rows.push(["  " + f.vendor, "", "", String(f.weeklyQty), ""]);
                    }
                  }
                  const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
                  const a = document.createElement("a");
                  a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
                  a.download = `procurement-${LONG_MONTHS[selectedMonth - 1].toLowerCase()}.csv`;
                  a.click();
                }}
              >
                <Download className="h-3.5 w-3.5" /> Download CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs font-bold border-primary/30 text-primary hover:bg-primary/5 rounded-xl"
                onClick={() => {
                  const subject = encodeURIComponent(`Procurement Plan - ${LONG_MONTHS[selectedMonth - 1]}`);
                  const body = encodeURIComponent(`Hi Procurement Team,\n\nProcurement plan for ${LONG_MONTHS[selectedMonth - 1]}.\nActive SKUs: ${activeSkus.length}\nTotal Volume: ${rangeTotal.toLocaleString()} kg\n\nF3 Intelligence Dashboard.`);
                  window.open(`mailto:procurement@f3fruits.com?subject=${subject}&body=${body}`);
                }}
              >
                <Mail className="h-3.5 w-3.5" /> Email Procurement
              </Button>
            </div>
          </div>

          <div className="space-y-2.5">
            {activeSkus.map((s, idx) => {
              const color = SKU_COLORS[s.sku] ?? "#6b7280";
              const isExpanded = expandedProcSku === s.sku;
              const farmers = allFarmerData.filter(f => f.item === s.sku && f.month === selectedMonth).sort((a, b) => b.weeklyQty - a.weeklyQty);
              const totalCapacity = farmers.reduce((sum, f) => sum + f.weeklyQty, 0);
              const addlKg = additionalInventory[s.sku] ?? 0;
              const maxCapacity = totalCapacity * rangeWeekCount;
              const isExhausted = addlKg > 0 && addlKg > maxCapacity;
              const detail = getSkuDetail(s.sku);

              return (
                <Card key={s.sku} className={`transition-all duration-200 overflow-hidden ${isExpanded ? "shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] ring-1 ring-primary/20" : "hover:shadow-[0_4px_16px_-6px_rgba(0,0,0,0.08)]"}`}>
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      <div className="w-1.5 shrink-0 rounded-l-2xl" style={{ backgroundColor: color }} />
                      <button
                        className="flex-1 text-left px-4 py-3.5 flex items-center gap-4"
                        onClick={() => setExpandedProcSku(isExpanded ? null : s.sku)}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-black" style={{ backgroundColor: `${color}15`, color }}>
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold">{s.sku}</p>
                            {detail?.A && <span className="text-[9px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-bold ring-1 ring-inset ring-green-200">{detail.A}</span>}
                            {farmers.length > 0 && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                                {farmers.length} farmers
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">
                            {totalCapacity > 0 ? `${totalCapacity.toLocaleString()} kg/wk capacity · ${farmers.length} farmers` : "No farmers this month"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-black num text-primary">{s.qty.toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">kg needed</p>
                        </div>
                        <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isExpanded ? "bg-primary/10" : "bg-muted"}`}>
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-primary" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                        </div>
                      </button>
                    </div>

                    {isExpanded && (
                      <>
                        <Separator />
                        <div className="px-5 py-5 bg-accent/20 space-y-6">
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                              Farmers · {LONG_MONTHS[selectedMonth - 1]}{rangeWeekCount > 1 ? ` (${rangeWeekCount}-week range)` : ""}
                            </p>
                            {farmers.length > 0 ? (
                              <div className="space-y-2">
                                {farmers.map((f, fi) => {
                                  const periodLimit = f.weeklyQty * rangeWeekCount;
                                  const share = totalCapacity > 0 ? Math.round((f.weeklyQty / totalCapacity) * 100) : 0;
                                  return (
                                    <div key={f.vendor + fi} className="flex items-center gap-3 rounded-xl border border-black/[0.04] bg-white px-4 py-2.5">
                                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-black" style={{ backgroundColor: `${color}15`, color }}>
                                        {fi + 1}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold truncate">{f.vendor}</p>
                                        <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                                          <div className="h-full rounded-full transition-all" style={{ width: `${share}%`, backgroundColor: color }} />
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <p className="text-sm font-black num">{f.weeklyQty.toLocaleString()}</p>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase">kg/wk</p>
                                      </div>
                                      {rangeWeekCount > 1 && (
                                        <div className="text-right shrink-0 hidden sm:block border-l border-border/50 pl-3">
                                          <p className="text-sm font-black num text-primary">{periodLimit.toLocaleString()}</p>
                                          <p className="text-[9px] font-bold text-muted-foreground uppercase">{rangeWeekCount}wk max</p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                                <div className="flex items-center justify-between pt-2 px-1">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total capacity</span>
                                  <span className="text-sm font-black num text-primary">{(totalCapacity * rangeWeekCount).toLocaleString()} kg{rangeWeekCount > 1 ? ` (${rangeWeekCount} wks)` : "/wk"}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-6 rounded-xl border border-dashed border-border/60 bg-white">
                                <Wheat className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                <p className="text-sm font-semibold text-muted-foreground">No farmers for {LONG_MONTHS[selectedMonth - 1]}</p>
                              </div>
                            )}
                          </div>

                          <div className="border-t border-border/60 pt-5">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Plan Additional Inventory</p>
                            <div className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-white px-4 py-3 max-w-sm">
                              <div className="h-2.5 w-2.5 rounded shrink-0" style={{ backgroundColor: color }} />
                              <span className="text-[11px] font-semibold flex-1">{s.sku}</span>
                              <input
                                type="number"
                                min={0}
                                placeholder="additional kg"
                                value={additionalInventory[s.sku] || ""}
                                onChange={e => setAdditionalInventory(prev => ({ ...prev, [s.sku]: parseInt(e.target.value) || 0 }))}
                                className="w-28 text-right text-xs font-bold bg-transparent outline-none border-b border-dashed border-border focus:border-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-[10px] text-muted-foreground font-medium">kg</span>
                            </div>

                            {addlKg > 0 && (
                              <div className="mt-3">
                                {isExhausted ? (
                                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-bold text-amber-700">All farmers at capacity</p>
                                      <p className="text-xs text-amber-600 font-medium mt-0.5">Max: {maxCapacity.toLocaleString()} kg · Requested: {addlKg.toLocaleString()} kg</p>
                                    </div>
                                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shrink-0 rounded-xl">
                                      <Search className="h-3 w-3 mr-1.5" /> Find New Farmers
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Additional {addlKg.toLocaleString()} kg</p>
                                    {farmers.map((f, fi) => {
                                      const allocated = totalCapacity > 0 ? Math.round((f.weeklyQty / totalCapacity) * addlKg) : 0;
                                      if (allocated === 0) return null;
                                      return (
                                        <div key={f.vendor + fi} className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
                                          <p className="text-xs font-bold">{f.vendor}</p>
                                          <p className="text-sm font-black num text-primary">+{allocated.toLocaleString()} kg</p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          </>)}

          {/* ════ BY SKU VIEW ════════════════════════════════════ */}
          {procView === "sku" && <SkuYearlyView />}
        </TabsContent>


        {/* ════ TAB: Allocation ═════════════════════════════════ */}
        <TabsContent value="allocation" className="space-y-5">

          {/* ── Stock Distribution Planner ─────────────────────────── */}
          <Card className="border-primary/20 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <button
                className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-accent/30 transition-colors"
                onClick={() => setShowPlanner(!showPlanner)}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-xl">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold tracking-tight">Excess Stock Distribution Planner</h2>
                    <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Enter excess stock → distribute additional inventory to all vendors</p>
                  </div>
                </div>
                <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${showPlanner ? "bg-primary/10" : "bg-muted"}`}>
                  {showPlanner ? <ChevronUp className="h-3.5 w-3.5 text-primary" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
              </button>

              {showPlanner && (
                <>
                  <Separator />
                  <div className="px-5 py-5 space-y-5">
                    {/* SKU input grid */}
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Enter Available Stock (kg)</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                        {activeSkus.slice(0, 12).map(s => (
                          <div key={s.sku} className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white px-3 py-2">
                            <div className="h-2.5 w-2.5 rounded shrink-0" style={{ backgroundColor: SKU_COLORS[s.sku] ?? "#6b7280" }} />
                            <span className="text-[11px] font-semibold truncate flex-1">{s.sku.split(" ")[0]}</span>
                            <input
                              type="number"
                              min={0}
                              placeholder="0"
                              value={stockInput[s.sku] || ""}
                              onChange={e => setStockInput(prev => ({ ...prev, [s.sku]: parseInt(e.target.value) || 0 }))}
                              className="w-16 text-right text-xs font-bold bg-transparent outline-none border-b border-dashed border-border focus:border-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Total: {Object.values(stockInput).reduce((a, b) => a + b, 0).toLocaleString()} kg
                        </span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    </div>

                    {/* Distribution results */}
                    {distributionPlan.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                          Distribution Plan → {distributionPlan.length} retailers
                        </p>
                        <div className="space-y-2">
                          {(showAllDistribution ? distributionPlan : distributionPlan.slice(0, 30)).map((d, i) => {
                            const tierCls = d.retailer.tier === "Priority" ? "bg-green-50 text-green-700 border-green-200"
                              : d.retailer.tier === "Secondary" ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-red-50 text-red-700 border-red-200";
                            const accentColor = d.retailer.tier === "Priority" ? "#16a34a" : d.retailer.tier === "Secondary" ? "#f59e0b" : "#ef4444";
                            return (
                              <div key={d.retailer.name} className="rounded-xl border border-black/[0.06] bg-white overflow-hidden">
                                <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />
                                <div className="px-4 py-3">
                                  <div className="flex items-center gap-3 mb-2.5">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-black shadow-sm bg-primary text-primary-foreground">
                                      {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold truncate">{d.retailer.name}</p>
                                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 font-bold ${tierCls}`}>{d.retailer.tier}</Badge>
                                      </div>
                                      <p className="text-[11px] text-muted-foreground font-medium">{d.retailer.area}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className="text-base font-black num text-primary">{d.totalKg.toLocaleString()}</p>
                                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">kg total</p>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {d.items.map(item => (
                                      <div key={item.sku} className="flex items-center gap-1.5 rounded-lg bg-accent/50 border border-border/50 px-2 py-1">
                                        <div className="h-2 w-2 rounded shrink-0" style={{ backgroundColor: SKU_COLORS[item.sku] ?? "#6b7280" }} />
                                        <span className="text-[10px] font-semibold">{item.sku.split(" ")[0]}</span>
                                        <span className="text-[10px] font-black num text-primary">{item.qty.toLocaleString()} kg</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {distributionPlan.length > 30 && !showAllDistribution && (
                          <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => setShowAllDistribution(true)}>
                            Show all {distributionPlan.length} retailers
                          </Button>
                        )}
                        {showAllDistribution && distributionPlan.length > 30 && (
                          <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => setShowAllDistribution(false)}>
                            Show top 30 only
                          </Button>
                        )}

                        {/* Summary */}
                        <div className="mt-4 rounded-xl bg-accent/30 border border-border/50 p-4">
                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Allocated</p>
                              <p className="text-lg font-black num text-primary">{distributionPlan.reduce((a, d) => a + d.totalKg, 0).toLocaleString()} kg</p>
                            </div>
                            <Separator orientation="vertical" className="h-8" />
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Available</p>
                              <p className="text-lg font-black num">{Object.values(stockInput).reduce((a, b) => a + b, 0).toLocaleString()} kg</p>
                            </div>
                            <Separator orientation="vertical" className="h-8" />
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Retailers</p>
                              <p className="text-lg font-black num">{distributionPlan.length}</p>
                            </div>
                            <Separator orientation="vertical" className="h-8" />
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">SKUs</p>
                              <p className="text-lg font-black num">{Object.keys(stockInput).filter(k => stockInput[k] > 0).length}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {Object.values(stockInput).some(v => v > 0) && distributionPlan.length === 0 && (
                      <div className="text-center py-6">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-semibold text-muted-foreground">No matching retailers for these SKUs</p>
                      </div>
                    )}

                    {!Object.values(stockInput).some(v => v > 0) && (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground font-medium">Enter stock quantities above to generate a distribution plan</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Who Gets This Stock?</h2>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                {isRange
                  ? `${rangeWeekCount} weeks · ${weekOrdinalLabel(timeline[rangeStart].week)} → ${weekOrdinalLabel(timeline[rangeEnd].week)}`
                  : weekOrdinalLabel(tw.week)}
                {" · "}expand to see profile + SKU indent
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs font-bold border-primary/30 text-primary hover:bg-primary/5 rounded-xl"
                onClick={() => {
                  const subject = encodeURIComponent(`Sales Allocation - ${isRange ? `${weekOrdinalLabel(timeline[rangeStart].week)} to ${weekOrdinalLabel(timeline[rangeEnd].week)}` : weekOrdinalLabel(tw.week)}`);
                  const body = encodeURIComponent(`Hi Sales Team,\n\nPlease find the vendor allocation for the selected period.\n\nRange: ${isRange ? `${weekDate(timeline[rangeStart].week)} to ${weekDate(timeline[rangeEnd].week)}` : weekDate(tw.week)}\nTotal Volume: ${rangeTotal.toLocaleString()} kg\nActive SKUs: ${activeSkus.length}\nVendors: ${filteredVendors.length}\n\nGenerated from F3 Intelligence Dashboard.`);
                  window.open(`mailto:Sales@f3fruits.com?subject=${subject}&body=${body}`);
                }}
              >
                <Mail className="h-3.5 w-3.5" /> Export to Sales
              </Button>
              <Button
                size="sm"
                className="gap-2 text-xs font-bold rounded-xl"
                onClick={() => window.location.href = "/retailers"}
              >
                <Navigation className="h-3.5 w-3.5" /> Plan Route
              </Button>
            </div>
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
                const periodKg = Math.round(weeklyKg * rangeWeekCount);
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
                            <p className="text-base font-black num text-primary">{(periodKg / 1000).toFixed(1)}K</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{isRange ? `kg · ${rangeWeekCount}wk` : "kg/wk"}</p>
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
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">{isRange ? `SKU Indent · ${rangeWeekCount} Weeks` : "SKU Indent This Week"}</p>
                                <div className="space-y-2.5">
                                  {Object.entries(r.skuAllocation).map(([sku, pct]) => {
                                    const pctNum = pct as number;
                                    const kg = Math.round(periodKg * pctNum / 100);
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

              // Basic customer — expandable card with estimated allocation
              const estDailyKg = 75;
              const estWeeklyKg = estDailyKg * 7;
              const estPeriodKg = estWeeklyKg * rangeWeekCount;
              return (
                <Card key={v.cid} className={`transition-all duration-200 overflow-hidden ${isExpanded ? "shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] ring-1 ring-primary/10" : "hover:shadow-[0_4px_16px_-6px_rgba(0,0,0,0.08)]"}`}>
                  <CardContent className="p-0">
                    <div className="h-0.5 w-full bg-muted" />
                    <button className="w-full text-left px-5 py-3.5 flex items-center gap-3.5" onClick={() => setExpandedRetailer(isExpanded ? null : v.name)}>
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
                      <div className="text-right shrink-0 hidden sm:block">
                        <p className="text-sm font-black num text-muted-foreground">{(estPeriodKg / 1000).toFixed(1)}K</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{isRange ? `kg · ${rangeWeekCount}wk` : "kg/wk"}</p>
                      </div>
                      <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isExpanded ? "bg-primary/10" : "bg-muted"}`}>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-primary" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <>
                        <Separator />
                        <div className="px-5 py-4 bg-accent/20 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Details</p>
                              <div className="space-y-2">
                                {[
                                  { label: "Zone", value: v.zone },
                                  { label: "Area", value: v.area },
                                  { label: "Status", value: v.status },
                                  { label: "ID", value: v.cid },
                                ].map(m => (
                                  <div key={m.label} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
                                    <span className="text-xs text-muted-foreground font-medium">{m.label}</span>
                                    <span className="text-xs font-bold">{m.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">{isRange ? `Est. SKU Indent · ${rangeWeekCount} Weeks` : "Est. SKU Indent This Week"} <span className="text-muted-foreground/50 normal-case font-normal">(estimated)</span></p>
                              <div className="space-y-2">
                                {Object.entries(estimatedSkuAllocation).map(([sku, pct]) => {
                                  const kg = Math.round(estPeriodKg * (pct as number) / 100);
                                  const color = SKU_COLORS[sku] ?? "#6b7280";
                                  return (
                                    <div key={sku}>
                                      <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                          <div className="h-2 w-2 rounded shrink-0" style={{ backgroundColor: color }} />
                                          <span className="text-xs font-semibold">{sku}</span>
                                        </div>
                                        <span className="text-xs font-bold num">{kg.toLocaleString()} kg</span>
                                      </div>
                                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <p className="text-[9px] text-muted-foreground/60 mt-3 font-medium">Based on ~{estWeeklyKg}kg/wk estimate · actual may vary</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
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
      </Tabs>
    </div>
  );
}
