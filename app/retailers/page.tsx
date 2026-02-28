"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import realData from "@/lib/real-data.json";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { MapPin, Package, TrendingUp } from "lucide-react";

// Dynamically import map to avoid SSR issues
const RetailerMap = dynamic(
  () => import("@/components/retailer-map").then((m) => m.RetailerMap),
  { ssr: false, loading: () => <div className="w-full h-full rounded-xl bg-muted animate-pulse flex items-center justify-center"><p className="text-muted-foreground text-sm">Loading map...</p></div> }
);

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

// Simulated vendor allocation per retailer
const VENDOR_ALLOCATION: Record<string, { vendor: string; pct: number; color: string }[]> = {
  "RAJKUMAR FRUIT VASANT VIHAR": [
    { vendor: "Agri Fresh Co.", pct: 55, color: "#16a34a" },
    { vendor: "Green Valley", pct: 30, color: "#22c55e" },
    { vendor: "Deccan Produce", pct: 15, color: "#4ade80" },
  ],
  "RAHUL FRUIT 1 VASANT VIHAR": [
    { vendor: "Green Valley", pct: 60, color: "#22c55e" },
    { vendor: "Indo Farm", pct: 40, color: "#16a34a" },
  ],
  DEFAULT: [
    { vendor: "Agri Fresh Co.", pct: 50, color: "#16a34a" },
    { vendor: "Southern Harvest", pct: 50, color: "#4ade80" },
  ],
};

type Retailer = typeof realData.retailers[number];

export default function RetailersPage() {
  const retailers = realData.retailers;
  const [selected, setSelected] = useState<Retailer>(retailers[0]);

  const vendorAlloc = VENDOR_ALLOCATION[selected.name] ?? VENDOR_ALLOCATION.DEFAULT;
  const latestWeekQty = realData.weekly[realData.weekly.length - 2]?.total ?? 0;
  const weeklyEstimate = Math.round((selected.totalQty / realData.stats.totalQty) * latestWeekQty);

  return (
    <div>
      <PageHeader
        title="Retailers & Route Intelligence"
        description={`${realData.stats.uniqueRetailers} retailers across Delhi NCR — click a pin to see allocation`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3" style={{ minHeight: "70vh" }}>
        {/* Map — 2/3 width */}
        <div className="lg:col-span-2 h-[520px]">
          <RetailerMap
            retailers={retailers}
            selectedRetailer={selected}
            onSelectRetailer={setSelected}
          />
        </div>

        {/* Right panel — retailer detail */}
        <div className="space-y-4 overflow-y-auto max-h-[520px] pr-1">
          {/* Selected retailer card */}
          <Card className="border-green-300 bg-green-50/50 sticky top-0">
            <CardContent className="p-4">
              <div className="flex items-start gap-2 mb-3">
                <MapPin className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm leading-tight">{selected.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    #{retailers.indexOf(selected) + 1} retailer by volume
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="rounded-lg bg-white border p-2.5 text-center">
                  <p className="text-lg font-bold text-green-700">{(selected.totalQty / 1000).toFixed(1)}K</p>
                  <p className="text-[10px] text-muted-foreground">kg all time</p>
                </div>
                <div className="rounded-lg bg-white border p-2.5 text-center">
                  <p className="text-lg font-bold text-green-700">{weeklyEstimate.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">kg this week</p>
                </div>
              </div>

              {/* Top SKUs bar chart */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top SKUs</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={selected.topSkus.slice(0, 5).map((s) => ({ name: s.sku.split(" ")[0], qty: s.qty }))} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={65} />
                  <Tooltip formatter={(v: number) => [`${v.toLocaleString()} kg`, ""]} contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                  <Bar dataKey="qty" radius={[0, 4, 4, 0]}>
                    {selected.topSkus.slice(0, 5).map((s) => (
                      <Cell key={s.sku} fill={SKU_COLORS[s.sku] ?? "#22c55e"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Vendor allocation */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-2">Vendor Allocation</p>
              <div className="flex rounded-full overflow-hidden h-3 mb-2">
                {vendorAlloc.map((v) => (
                  <div key={v.vendor} style={{ width: `${v.pct}%`, backgroundColor: v.color }} title={v.vendor} />
                ))}
              </div>
              <div className="space-y-1">
                {vendorAlloc.map((v) => (
                  <div key={v.vendor} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: v.color }} />
                      <span className="text-xs text-muted-foreground">{v.vendor}</span>
                    </div>
                    <span className="text-xs font-medium">{v.pct}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Retailer list */}
          <div className="space-y-2">
            {retailers.map((r, i) => (
              <button
                key={r.name}
                className={`w-full text-left rounded-lg border p-3 transition-all hover:border-green-400 hover:bg-green-50/50 ${
                  selected.name === r.name ? "border-green-400 bg-green-50 shadow-sm" : "border-border bg-card"
                }`}
                onClick={() => setSelected(r)}
              >
                <div className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{r.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Package className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{(r.totalQty / 1000).toFixed(1)}K kg</span>
                      <div className="flex gap-0.5">
                        {r.topSkus.slice(0, 3).map((s) => (
                          <div key={s.sku} className="h-2 w-2 rounded-full" style={{ backgroundColor: SKU_COLORS[s.sku] ?? "#6b7280" }} title={s.sku} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mt-6">
        {[
          { label: "Total Retailers", value: realData.stats.uniqueRetailers, icon: MapPin },
          { label: "Top Area", value: "Gurgaon Sec-69", icon: TrendingUp },
          { label: "Avg Weekly/Retailer", value: `${Math.round(latestWeekQty / realData.stats.uniqueRetailers)} kg`, icon: Package },
          { label: "Route Coverage", value: "Delhi NCR", icon: MapPin },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <s.icon className="h-4 w-4 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-semibold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
