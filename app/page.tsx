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
      <div className="mb-6 rounded-xl bg-gradient-to-r from-green-700 to-green-500 p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-2xl font-bold">
              {(realData.stats.totalOrders / 1000).toFixed(0)}K orders &middot; {(realData.stats.totalQty / 1000000).toFixed(1)}M kg delivered &middot; {realData.stats.uniqueRetailers} retailers
            </p>
            <p className="text-sm text-green-100 mt-1">Sep 2023 → {currentMonthLabel} &mdash; volume grew <span className="font-bold text-white">{realData.stats.monthlyGrowth}%</span></p>
          </div>
          <div className="flex gap-4">
            {[
              { label: "Unique SKUs", value: realData.stats.uniqueSkus },
              { label: "Data Points", value: `${(realData.stats.totalOrders / 1000).toFixed(0)}K` },
              { label: "Coverage", value: `${coverageMonths} mo.` },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-green-100">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        {[
          { label: "Weekly Volume", value: `${(latestWeek.total / 1000).toFixed(1)}K kg`, change: `${weekGrowth}%`, icon: Package, color: "bg-green-600" },
          { label: "Active Retailers", value: realData.stats.uniqueRetailers, change: "+12 this month", icon: Users, color: "bg-emerald-500" },
          { label: "SKUs Tracked", value: realData.stats.uniqueSkus, change: "48 varieties", icon: Database, color: "bg-green-700" },
          { label: "Monthly Growth", value: `${realData.stats.monthlyGrowth}%`, change: "since Sep 2023", icon: TrendingUp, color: "bg-teal-600" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`rounded-lg p-2 ${kpi.color}`}>
                  <kpi.icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
              <p className="text-xs text-green-600 mt-1 font-medium">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        {/* Monthly growth area chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Volume Growth — Real Data</h3>
                  <p className="text-sm text-muted-foreground">Monthly kg delivered across all SKUs</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                  Sep 2023 → {currentMonthLabel}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} angle={-30} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}K`} />
                  <Tooltip formatter={(v: number) => [`${v}K kg`, "Volume"]} contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                  <Area type="monotone" dataKey="qtyK" stroke="#16a34a" strokeWidth={2.5} fill="url(#volGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Weekly recent bar chart */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-1">Last 8 Weeks</h3>
            <p className="text-sm text-muted-foreground mb-4">Total kg per week</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={last8weeks}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => [`${v.toLocaleString()} kg`, "Volume"]} contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                <Bar dataKey="total" fill="#16a34a" radius={[4, 4, 0, 0]} />
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Top Retailers — Delhi NCR</h3>
              <Link href="/retailers" className="text-xs text-green-600 font-medium flex items-center gap-1 hover:underline">
                View map <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {topRetailers.map((r, i) => (
                <div key={r.name} className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      <p className="text-sm font-semibold text-green-700 ml-2 shrink-0">
                        {(r.totalQty / 1000).toFixed(1)}K kg
                      </p>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full mt-1">
                      <div
                        className="h-full rounded-full bg-green-500"
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
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">How the AI Engine Works</h3>
            <div className="space-y-3">
              {[
                { step: "01", title: "Proprietary Data", desc: "999K orders since Sep 2023 — every SKU, every retailer, every quantity" },
                { step: "02", title: "Pattern Recognition", desc: "ML model learns weekly, seasonal, and event-driven demand cycles" },
                { step: "03", title: "External Signals", desc: "Weather, mandi arrivals, and supply alerts adjust the forecast bands" },
                { step: "04", title: "Self-Learning", desc: "Every new order improves accuracy — model retrains nightly" },
              ].map((s) => (
                <div key={s.step} className="flex gap-3">
                  <span className="text-xs font-bold text-green-600 mt-0.5 w-5 shrink-0">{s.step}</span>
                  <div>
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/demand" className="mt-4 flex items-center gap-2 text-sm font-medium text-green-700 hover:underline">
              See demand forecast <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
