"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import realData from "@/lib/real-data.json";
import customersGeo from "@/lib/customers-geo.json";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { MapPin, Package, CreditCard, Clock } from "lucide-react";
import { retailerProfiles } from "@/lib/retailer-profiles";
import { cn } from "@/lib/utils";

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
  MAUSAMI: "#a78bfa", "TURKEY APPLE": "#f43f5e", PAPAYA: "#fb7185", "SHIMLA APPLE": "#f97316",
};

interface MapRetailer {
  name: string;
  totalQty: number;
  lng: number;
  lat: number;
  topSkus: { sku: string; qty: number }[];
  zone?: string;
}

export default function RetailersPage() {
  // Merge 20 detailed retailers with all 531 geocoded ones
  const allMapRetailers = useMemo(() => {
    const detailedMap = new Map(realData.retailers.map(r => [r.name, r]));
    const merged: MapRetailer[] = [];

    // Add all 20 detailed retailers first (they have volume data)
    for (const r of realData.retailers) {
      merged.push({ ...r, zone: undefined });
    }

    // Add remaining geocoded retailers (without volume data)
    for (const c of customersGeo as { name: string; lat: number; lng: number; zone?: string }[]) {
      if (!detailedMap.has(c.name)) {
        merged.push({
          name: c.name,
          totalQty: 0,
          lng: c.lng,
          lat: c.lat,
          topSkus: [],
          zone: c.zone,
        });
      }
    }
    return merged;
  }, []);

  const retailers = realData.retailers;
  const [selected, setSelected] = useState<typeof retailers[number]>(retailers[0]);

  const profile = retailerProfiles.find((p) => p.name === selected.name);
  const latestWeekQty = realData.weekly[realData.weekly.length - 2]?.total ?? 0;
  const weeklyKg = profile ? Math.round(profile.avgDailyKg * 7) : Math.round((selected.totalQty / realData.stats.totalQty) * latestWeekQty);

  const tierStyle = profile?.tier === "Priority" ? "bg-green-100 text-green-700 border-green-200"
    : profile?.tier === "Secondary" ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-muted text-muted-foreground";

  return (
    <div>
      <PageHeader
        title="Retailers & Route Map"
        description={`${allMapRetailers.length} retailers · Delhi NCR · click a pin to inspect`}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3 xl:h-[calc(100vh-200px)] xl:min-h-[560px]">

        {/* Map — 2/3 width on desktop, fixed height on mobile */}
        <div className="xl:col-span-2 rounded-xl overflow-hidden border h-[52vw] min-h-[280px] max-h-[480px] xl:h-auto xl:max-h-none">
          <RetailerMap
            retailers={allMapRetailers}
            selectedRetailer={selected}
            onSelectRetailer={(r) => {
              const detailed = retailers.find(d => d.name === r.name);
              if (detailed) setSelected(detailed);
            }}
          />
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4 xl:overflow-y-auto">

          {/* Header card */}
          <Card className="border-border shadow-sm shrink-0 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-transform duration-500 group-hover:scale-110" />
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between gap-2 mb-5">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="bg-primary/10 p-2 rounded-xl text-primary shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 mt-0.5">
                    <p className="font-extrabold text-foreground leading-tight truncate">{selected.name}</p>
                    {profile && (
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 ${tierStyle}`}>{profile.tier}</Badge>
                        <span className="text-xs font-medium text-muted-foreground">{profile.area}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-xl bg-accent/40 border border-border/50 p-3 flex flex-col items-center justify-center">
                  <p className="text-2xl font-black text-primary leading-none mb-1">{weeklyKg.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">kg / week</p>
                </div>
                <div className="rounded-xl bg-accent/40 border border-border/50 p-3 flex flex-col items-center justify-center">
                  <p className="text-2xl font-black text-foreground leading-none mb-1">{profile?.score ?? "—"}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">AI Score</p>
                </div>
              </div>

              {profile && (
                <div className="space-y-2">
                  {[
                    { icon: CreditCard, label: "Credit Score", value: `${profile.creditScore}/100`, color: profile.creditScore >= 80 ? "text-green-600" : "text-amber-600" },
                    { icon: Clock, label: "Payment Terms", value: `Net ${profile.paymentDays}d`, color: profile.paymentDays <= 10 ? "text-green-600" : "text-amber-600" },
                    { icon: Package, label: "Facility Type", value: profile.shopType, color: "text-foreground" },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
                      </div>
                      <span className={`text-xs font-bold ${m.color}`}>{m.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top SKUs with quality grades */}
          <Card className="shrink-0 shadow-sm">
            <CardContent className="p-5">
              <p className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" /> Top SKUs (All Time)
              </p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={selected.topSkus.slice(0, 5).map((s) => ({ name: s.sku.split(" ")[0], qty: s.qty }))} layout="vertical" margin={{ left: -20, right: 10, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)", fontWeight: 600 }} width={75} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => [`${v.toLocaleString()} kg`, "Total"]} cursor={{ fill: "var(--color-muted)", opacity: 0.3 }} contentStyle={{ borderRadius: "12px", border: "1px solid var(--color-border)", fontSize: "12px", fontWeight: 600, boxShadow: "0 4px 12px -4px rgba(0,0,0,0.1)" }} />
                  <Bar dataKey="qty" radius={[0, 4, 4, 0]} barSize={12}>
                    {selected.topSkus.slice(0, 5).map((s) => (
                      <Cell key={s.sku} fill={SKU_COLORS[s.sku] ?? "var(--color-primary)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Quality grades */}
              <div className="mt-4 space-y-2 border-t border-border/50 pt-3">
                {selected.topSkus.slice(0, 3).map((s) => {
                  const q = (realData.skuQuality as Record<string, Record<string, string | null>>)[s.sku];
                  if (!q?.A) return null;
                  return (
                    <div key={s.sku} className="flex items-center gap-2.5 text-xs">
                      <div className="h-2 w-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: SKU_COLORS[s.sku] ?? "var(--color-muted)" }} />
                      <span className="font-semibold text-foreground truncate max-w-[100px]">{s.sku.split(" ")[0]}</span>
                      <div className="flex gap-1.5 ml-auto shrink-0">
                        {q.A && <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-primary/20">A: {q.A}</span>}
                        {q.B && q.B !== q.A && <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-border">B: {q.B}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* SKU split bar */}
          {profile?.skuAllocation && (
            <Card className="shrink-0 shadow-sm">
              <CardContent className="p-5">
                <p className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Order Mix Overview
                </p>
                <div className="flex rounded-full overflow-hidden h-2.5 shadow-inner bg-accent">
                  {Object.entries(profile.skuAllocation).map(([sku, pct]) => (
                    <div key={sku} style={{ width: `${pct}%`, backgroundColor: SKU_COLORS[sku] ?? "var(--color-primary)" }}
                      title={`${sku}: ${pct}%`} className="hover:opacity-80 transition-opacity cursor-help" />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-4">
                  {Object.entries(profile.skuAllocation).map(([sku, pct]) => (
                    <div key={sku} className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-sm shadow-sm" style={{ backgroundColor: SKU_COLORS[sku] ?? "var(--color-primary)" }} />
                      <span className="text-[10px] font-medium text-foreground">{sku.split(" ")[0]} <span className="text-muted-foreground ml-0.5">{pct}%</span></span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick switcher */}
          <Card className="shrink-0 shadow-sm border-border bg-card">
            <CardContent className="p-4">
              <p className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-3 px-1">All Retailers</p>
              <div className="space-y-1">
                {retailers.map((r, i) => {
                  const isSelected = selected.name === r.name;
                  return (
                    <button key={r.name}
                      className={cn(
                        "w-full text-left rounded-lg px-3 py-2.5 flex items-center gap-3 transition-all duration-200 text-xs font-semibold",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                          : "hover:bg-accent text-foreground hover:text-foreground"
                      )}
                      onClick={() => setSelected(r)}>
                      <span className={cn(
                        "h-6 w-6 shrink-0 flex items-center justify-center rounded-[8px] text-[10px] font-black shadow-sm transition-colors",
                         isSelected
                           ? "bg-white text-primary"
                           : i < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>{i + 1}</span>
                      <span className="truncate flex-1">{r.name.split(" ").slice(0, 3).join(" ")}</span>
                      <span className={cn(
                        "shrink-0 font-bold",
                        isSelected ? "text-primary-foreground/90" : "text-muted-foreground"
                      )}>{(r.totalQty / 1000).toFixed(1)}K</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
