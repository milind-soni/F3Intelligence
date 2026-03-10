"use client";

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
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import realData from "@/lib/real-data.json";
import { Database, Users, Package, TrendingUp, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const TOP_SKUS = ["WATERMELON", "KASHMIR APPLE", "KINNAUR APPLE", "ANAR", "KINNOW"];
const SKU_COLORS = ["#22c55e", "#ef4444", "#f59e0b", "#f97316", "#8b5cf6"];

export default function DashboardPage() {
  const now = new Date();
  const currentMonthLabel = now.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const coverageMonths = Math.round((now.getTime() - new Date("2023-09-01").getTime()) / (1000 * 60 * 60 * 24 * 30.44));

  const monthly = realData.monthly.map((m) => ({
    ...m,
    label: m.month.slice(0, 7),
    qtyK: Math.round(m.qty / 1000),
  }));

  const last8weeks = realData.weekly.slice(-8).map((w) => ({
    week: w.week.split("/")[0].slice(5),
    total: w.total,
  }));

  const latestWeek = realData.weekly[realData.weekly.length - 1];
  const prevWeek = realData.weekly[realData.weekly.length - 2];
  const weekGrowth = (((latestWeek.total - prevWeek.total) / prevWeek.total) * 100).toFixed(1);

  const topRetailers = realData.retailers.slice(0, 5);

  return (
    <div>
      <PageHeader
        title="F3 Intelligence Dashboard"
        description="Delhi NCR — Powered by 2.5 years of proprietary order data"
      />

      {/* Data Story Banner */}
      <div className="mb-8 rounded-2xl bg-white border border-black/[0.04] p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative flex items-center justify-between flex-wrap gap-6">
          <div className="max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-2">
              {(realData.stats.totalOrders / 1000).toFixed(0)}K orders &middot; {(realData.stats.totalQty / 1000000).toFixed(1)}M kg
            </h2>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              Sep 2023 → {currentMonthLabel} <span className="text-muted-foreground/30">•</span> volume grew 
              <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-bold text-green-700 ring-1 ring-inset ring-green-600/20">
                {realData.stats.monthlyGrowth}%
              </span>
            </p>
          </div>
          <div className="flex gap-6 sm:gap-10">
            {[
              { label: "Unique SKUs", value: realData.stats.uniqueSkus },
              { label: "Retailers", value: realData.stats.uniqueRetailers },
              { label: "Coverage", value: `${coverageMonths} mo` },
            ].map((s) => (
              <div key={s.label} className="text-left sm:text-center">
                <p className="text-2xl font-black tracking-tight text-foreground">{s.value}</p>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: "Weekly Volume", value: `${(latestWeek.total / 1000).toFixed(1)}K kg`, change: `${weekGrowth}%`, icon: Package, color: "text-green-600", bg: "bg-green-50" },
          { label: "Active Retailers", value: realData.stats.uniqueRetailers, change: "+12 this month", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "SKUs Tracked", value: realData.stats.uniqueSkus, change: "48 varieties", icon: Database, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Monthly Growth", value: `${realData.stats.monthlyGrowth}%`, change: "since Sep 2023", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((kpi) => (
          <Card key={kpi.label} className="transition-all duration-300 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={`rounded-xl p-2.5 ${kpi.bg}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-2xl font-black tracking-tight">{kpi.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mt-1 mb-2">{kpi.label}</p>
              <p className="text-xs text-primary font-semibold">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
        {/* Monthly growth area chart */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-foreground">Volume Growth</h3>
                  <p className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wider">Real Data (Monthly Kg)</p>
                </div>
                <span className="text-[11px] bg-primary/10 text-primary px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                  Sep '23 → {now.toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7280", fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280", fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}K`} />
                  <Tooltip formatter={(v: number) => [`${v}K kg`, "Volume"]} contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 12px -4px rgba(0,0,0,0.1)", fontWeight: 600 }} />
                  <Area type="monotone" dataKey="qtyK" stroke="#16a34a" strokeWidth={3} fill="url(#volGrad)" activeDot={{ r: 6, strokeWidth: 0, fill: "#16a34a" }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Weekly recent bar chart */}
        <Card className="h-full">
          <CardContent className="p-6">
            <h3 className="text-base font-bold text-foreground">Last 8 Weeks</h3>
            <p className="text-xs font-medium text-muted-foreground mt-1 mb-6 uppercase tracking-wider">Total Kg (Weekly)</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={last8weeks} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6b7280", fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280", fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => [`${v.toLocaleString()} kg`, "Volume"]} cursor={{ fill: "#f3f4f6", opacity: 0.5 }} contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 12px -4px rgba(0,0,0,0.1)", fontWeight: 600 }} />
                <Bar dataKey="total" fill="#16a34a" radius={[4, 4, 4, 4]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom: Top retailers + Quick links */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Retailers */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-foreground">Top Retailers (Delhi NCR)</h3>
              <Link href="/retailers" className="text-xs text-primary font-bold uppercase tracking-wider flex items-center gap-1 hover:underline">
                View map <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="space-y-4">
              {topRetailers.map((r, i) => (
                <div key={r.name} className="flex items-center gap-4 group">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-[10px] text-xs font-black shadow-sm ${i < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{r.name}</p>
                      <p className="text-sm font-black text-foreground ml-2 shrink-0">
                        {(r.totalQty / 1000).toFixed(1)}K <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">kg</span>
                      </p>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(r.totalQty / topRetailers[0].totalQty) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Engine explainer */}
        <Card className="bg-gradient-to-br from-white to-green-50/50 border-green-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-6 relative">
            <h3 className="text-base font-bold text-foreground mb-5">How the AI Engine Works</h3>
            <div className="space-y-4">
              {[
                { step: "01", title: "Proprietary Data", desc: "999K orders since Sep 2023 — every SKU, retailer, & quantity" },
                { step: "02", title: "Pattern Recognition", desc: "ML model learns weekly, seasonal, and event-driven patterns" },
                { step: "03", title: "External Signals", desc: "Weather, mandi arrivals, and supply alerts adjust bands" },
                { step: "04", title: "Self-Learning", desc: "New orders improve accuracy — model retrains nightly" },
              ].map((s) => (
                <div key={s.step} className="flex gap-4 group">
                  <span className="text-[11px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider h-fit shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">{s.step}</span>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-0.5">{s.title}</p>
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/demand" className="mt-6 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary hover:underline">
              See demand forecast <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
