"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import realData from "@/lib/real-data.json";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { MapPin, Package, Truck, CreditCard, Clock } from "lucide-react";
import { retailerProfiles, vendorDetails } from "@/lib/retailer-profiles";

const RetailerMap = dynamic(
  () => import("@/components/retailer-map").then((m) => m.RetailerMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full rounded-xl bg-muted flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading map...</p>
      </div>
    ),
  }
);

const SKU_COLORS: Record<string, string> = {
  WATERMELON: "#22c55e", "KASHMIR APPLE": "#ef4444", "KINNAUR APPLE": "#f97316",
  ANAR: "#ec4899", KINNOW: "#f59e0b", ORANGE: "#fb923c", "SAFEDA MANGO": "#84cc16", "VNR GUAVA": "#8b5cf6",
};

type Retailer = typeof realData.retailers[number];

export default function RetailersPage() {
  const retailers = realData.retailers;
  const [selected, setSelected] = useState<Retailer>(retailers[0]);

  const profile = retailerProfiles.find((p) => p.name === selected.name);
  const vendor = profile ? vendorDetails[profile.vendor] : null;
  const latestWeekQty = realData.weekly[realData.weekly.length - 2]?.total ?? 0;
  const weeklyKg = profile ? Math.round(profile.avgDailyKg * 7) : Math.round((selected.totalQty / realData.stats.totalQty) * latestWeekQty);

  const tierStyle = profile?.tier === "Priority" ? "bg-green-100 text-green-700 border-green-200"
    : profile?.tier === "Secondary" ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-muted text-muted-foreground";

  return (
    <div>
      <PageHeader
        title="Retailers & Route Map"
        description={`${realData.stats.uniqueRetailers} retailers · Delhi NCR · click a pin to inspect`}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3" style={{ height: "calc(100vh - 200px)", minHeight: "560px" }}>

        {/* Map — 2/3 */}
        <div className="xl:col-span-2 rounded-xl overflow-hidden border">
          <RetailerMap
            retailers={retailers}
            selectedRetailer={selected}
            onSelectRetailer={setSelected}
          />
        </div>

        {/* Right panel — selected retailer only */}
        <div className="flex flex-col gap-4 overflow-y-auto">

          {/* Header card */}
          <Card className="border-green-300 bg-green-50/40 shrink-0">
            <CardContent className="p-4">
              <div className="flex items-start gap-2 mb-3">
                <MapPin className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-snug">{selected.name}</p>
                  {profile && (
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${tierStyle}`}>{profile.tier}</Badge>
                      <span className="text-xs text-muted-foreground">{profile.area}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Volume */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-lg bg-white border p-2.5 text-center">
                  <p className="text-xl font-bold text-green-700">{weeklyKg.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">kg this week</p>
                </div>
                <div className="rounded-lg bg-white border p-2.5 text-center">
                  <p className="text-xl font-bold">{profile?.score ?? "—"}</p>
                  <p className="text-[10px] text-muted-foreground">AI score</p>
                </div>
              </div>

              {/* Profile stats */}
              {profile && (
                <div className="space-y-1.5">
                  {[
                    { icon: CreditCard, label: "Credit", value: `${profile.creditScore}/100`, color: profile.creditScore >= 80 ? "text-green-600" : "text-amber-600" },
                    { icon: Clock, label: "Payment", value: `Net ${profile.paymentDays}d`, color: profile.paymentDays <= 10 ? "text-green-600" : "text-amber-600" },
                    { icon: Package, label: "Shop type", value: profile.shopType, color: "text-foreground" },
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
              )}
            </CardContent>
          </Card>

          {/* Top SKUs */}
          <Card className="shrink-0">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Top SKUs (all time)</p>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={selected.topSkus.slice(0, 5).map((s) => ({ name: s.sku.split(" ")[0], qty: s.qty }))} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
                  <Tooltip formatter={(v: number) => [`${v.toLocaleString()} kg`, ""]} contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                  <Bar dataKey="qty" radius={[0, 4, 4, 0]}>
                    {selected.topSkus.slice(0, 5).map((s) => (
                      <Cell key={s.sku} fill={SKU_COLORS[s.sku] ?? "#22c55e"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Vendor assignment */}
          {profile && vendor && (
            <Card className="shrink-0" style={{ borderColor: profile.vendorColor + "50" }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="h-4 w-4" style={{ color: profile.vendorColor }} />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned Vendor</p>
                </div>
                <p className="font-semibold text-sm mb-0.5" style={{ color: profile.vendorColor }}>{vendor.name}</p>
                <p className="text-xs text-muted-foreground mb-3">{vendor.location}</p>
                <div className="space-y-1.5">
                  {[
                    { label: "Reliability", value: `${vendor.reliability}%`, color: "text-green-600" },
                    { label: "Lead time", value: `${vendor.leadTimeDays} days`, color: "text-foreground" },
                    { label: "Terms", value: vendor.paymentTerms, color: "text-foreground" },
                  ].map((v) => (
                    <div key={v.label} className="flex justify-between">
                      <span className="text-xs text-muted-foreground">{v.label}</span>
                      <span className={`text-xs font-semibold ${v.color}`}>{v.value}</span>
                    </div>
                  ))}
                </div>
                {/* Vendor allocation bar */}
                {profile.skuAllocation && (
                  <div className="mt-3">
                    <p className="text-[10px] text-muted-foreground mb-1">Weekly SKU split</p>
                    <div className="flex rounded-full overflow-hidden h-2.5">
                      {Object.entries(profile.skuAllocation).map(([sku, pct]) => (
                        <div key={sku} style={{ width: `${pct}%`, backgroundColor: SKU_COLORS[sku] ?? "#6b7280" }}
                          title={`${sku}: ${pct}%`} />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1.5">
                      {Object.entries(profile.skuAllocation).map(([sku, pct]) => (
                        <div key={sku} className="flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: SKU_COLORS[sku] }} />
                          <span className="text-[10px] text-muted-foreground">{sku.split(" ")[0]} {pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick switcher */}
          <Card className="shrink-0">
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">All Retailers</p>
              <div className="space-y-1">
                {retailers.map((r, i) => (
                  <button key={r.name}
                    className={`w-full text-left rounded-md px-2 py-1.5 flex items-center gap-2 transition-colors text-xs ${
                      selected.name === r.name ? "bg-green-100 text-green-800" : "hover:bg-muted"
                    }`}
                    onClick={() => setSelected(r)}>
                    <span className={`h-5 w-5 shrink-0 flex items-center justify-center rounded-full text-[10px] font-bold ${
                      i < 3 ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"
                    }`}>{i + 1}</span>
                    <span className="truncate">{r.name.split(" ").slice(0, 3).join(" ")}</span>
                    <span className="ml-auto text-muted-foreground shrink-0">{(r.totalQty / 1000).toFixed(1)}K</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
