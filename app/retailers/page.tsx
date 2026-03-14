"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import realData from "@/lib/real-data.json";
import customersGeo from "@/lib/customers-geo.json";
import vehicleRoutes from "@/lib/vehicle-routes.json";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { MapPin, Package, CreditCard, Clock, Download, Navigation, Loader2, CheckCircle2, Truck } from "lucide-react";
import { retailerProfiles } from "@/lib/retailer-profiles";
import { cn } from "@/lib/utils";

const RoutePlanMap = dynamic(
  () => import("@/components/route-plan-map").then((m) => m.RoutePlanMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full rounded-xl bg-muted flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading map...</p>
      </div>
    ),
  }
);

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

// Route colors for the 42 vehicles
const ROUTE_COLORS = [
  "#22c55e","#ef4444","#f97316","#ec4899","#f59e0b","#8b5cf6","#0ea5e9","#14b8a6",
  "#84cc16","#f43f5e","#6366f1","#fb923c","#a16207","#059669","#dc2626","#4c1d95",
  "#be185d","#166534","#1d4ed8","#92400e","#0369a1","#eab308","#78716c","#d946ef",
  "#65a30d","#b91c1c","#4ade80","#fbbf24","#c026d3","#0284c7","#16a34a","#7c3aed",
  "#db2777","#ea580c","#15803d","#1e40af","#9333ea","#e11d48","#d97706","#047857",
  "#7e22ce","#be123c",
];

type RouteRetailer = { name: string; area: string; zone: string; address: string; lat: number; lng: number; cid: string; status: string };
type VehicleRoute = { routeId: number; vehicleId: string; zone: string; centLat: number; centLng: number; retailers: RouteRetailer[]; count: number };
type RouteStatus = { loading: boolean; done: boolean; distance?: number; duration?: number };

interface MapRetailer {
  name: string;
  totalQty: number;
  lng: number;
  lat: number;
  topSkus: { sku: string; qty: number }[];
  zone?: string;
}

const HUB = { lat: 28.4989, lng: 77.1639, name: "Chattarpur Facility" };

function exportRouteCSV(route: VehicleRoute) {
  const rows = [
    ["Vehicle", "Route ID", "Stop #", "Retailer Name", "Area", "Zone", "Address", "Status", "Lat", "Lng"],
    ...route.retailers.map((r, i) => [
      route.vehicleId,
      String(route.routeId),
      String(i + 1),
      r.name,
      r.area,
      r.zone,
      r.address || "",
      r.status,
      String(r.lat),
      String(r.lng),
    ])
  ];
  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  a.download = `route-${route.vehicleId}-${route.zone.toLowerCase().replace(/\s+/g, "-")}.csv`;
  a.click();
}

function exportAllRoutesCSV(routes: VehicleRoute[]) {
  const rows = [["Vehicle", "Route ID", "Stop #", "Retailer Name", "Area", "Zone", "Address", "Status", "Lat", "Lng"]];
  for (const route of routes) {
    for (let i = 0; i < route.retailers.length; i++) {
      const r = route.retailers[i];
      rows.push([route.vehicleId, String(route.routeId), String(i + 1), r.name, r.area, r.zone, r.address || "", r.status, String(r.lat), String(r.lng)]);
    }
  }
  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  a.download = `all-routes-chattarpur.csv`;
  a.click();
}

export default function RetailersPage() {
  const allMapRetailers = useMemo(() => {
    const detailedMap = new Map(realData.retailers.map(r => [r.name, r]));
    const merged: MapRetailer[] = [];
    for (const r of realData.retailers) merged.push({ ...r, zone: undefined });
    for (const c of customersGeo as { name: string; lat: number; lng: number; zone?: string }[]) {
      if (!detailedMap.has(c.name)) merged.push({ name: c.name, totalQty: 0, lng: c.lng, lat: c.lat, topSkus: [], zone: c.zone });
    }
    return merged;
  }, []);

  const retailers = realData.retailers;
  const routes = vehicleRoutes as VehicleRoute[];
  const [selected, setSelected] = useState<typeof retailers[number]>(retailers[0]);
  const [selectedRoute, setSelectedRoute] = useState<VehicleRoute | null>(null);
  const [routeStatuses, setRouteStatuses] = useState<Record<number, RouteStatus>>({});
  const [routePolylines, setRoutePolylines] = useState<Record<number, [number, number][]>>({});

  const profile = retailerProfiles.find((p) => p.name === selected.name);
  const latestWeekQty = realData.weekly[realData.weekly.length - 2]?.total ?? 0;
  const weeklyKg = profile ? Math.round(profile.avgDailyKg * 7) : Math.round((selected.totalQty / realData.stats.totalQty) * latestWeekQty);
  const tierStyle = profile?.tier === "Priority" ? "bg-green-100 text-green-700 border-green-200"
    : profile?.tier === "Secondary" ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-muted text-muted-foreground";

  async function computeRoute(route: VehicleRoute) {
    setRouteStatuses(prev => ({ ...prev, [route.routeId]: { loading: true, done: false } }));
    try {
      const coords = [
        `${HUB.lng},${HUB.lat}`,
        ...route.retailers.map(r => `${r.lng},${r.lat}`),
      ].join(";");
      const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?roundtrip=true&source=first&destination=last&overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === "Ok" && data.trips?.[0]) {
        const trip = data.trips[0];
        setRouteStatuses(prev => ({
          ...prev,
          [route.routeId]: {
            loading: false,
            done: true,
            distance: Math.round(trip.distance / 1000),
            duration: Math.round(trip.duration / 60),
          }
        }));
        // Store polyline [lng, lat] pairs for map rendering
        const polyCoords: [number, number][] = trip.geometry?.coordinates ?? [];
        if (polyCoords.length > 0) {
          setRoutePolylines(prev => ({ ...prev, [route.routeId]: polyCoords }));
        }
      } else {
        throw new Error("OSRM failed");
      }
    } catch {
      // Fallback: straight-line estimate, no polyline
      const estKm = route.retailers.reduce((sum, r) => {
        const dlat = r.lat - HUB.lat;
        const dlng = r.lng - HUB.lng;
        return sum + Math.sqrt(dlat * dlat + dlng * dlng) * 111 * 2;
      }, 0) / route.retailers.length * route.retailers.length;
      setRouteStatuses(prev => ({
        ...prev,
        [route.routeId]: {
          loading: false,
          done: true,
          distance: Math.round(estKm),
          duration: Math.round(estKm * 3),
        }
      }));
    }
  }

  return (
    <div>
      <PageHeader
        title="Retailers & Route Map"
        description={`${allMapRetailers.length} retailers · Delhi NCR · 42 vehicles from Chattarpur`}
      />

      <Tabs defaultValue="map" className="space-y-5">
        <TabsList variant="line">
          <TabsTrigger value="map" className="gap-1.5"><MapPin className="h-3.5 w-3.5" /> Retailer Map</TabsTrigger>
          <TabsTrigger value="routes" className="gap-1.5"><Truck className="h-3.5 w-3.5" /> Route Planning</TabsTrigger>
        </TabsList>

        {/* ════ TAB: Map ════ */}
        <TabsContent value="map">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3 xl:h-[calc(100vh-260px)] xl:min-h-[560px]">
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

            <div className="flex flex-col gap-4 xl:overflow-y-auto">
              <Card className="border-border shadow-sm shrink-0 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <CardContent className="p-5 relative">
                  <div className="flex items-start gap-3 mb-5">
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
                        <div key={m.label} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
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

              <Card className="shrink-0 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" /> Top SKUs (All Time)
                  </p>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={selected.topSkus.slice(0, 5).map((s) => ({ name: s.sku.split(" ")[0], qty: s.qty }))} layout="vertical" margin={{ left: -20, right: 10, top: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#6b7280", fontWeight: 600 }} width={75} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v: number) => [`${v.toLocaleString()} kg`, "Total"]} cursor={{ fill: "#f3f4f6", opacity: 0.5 }} contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "12px", fontWeight: 600 }} />
                      <Bar dataKey="qty" radius={[0, 4, 4, 0]} barSize={12}>
                        {selected.topSkus.slice(0, 5).map((s) => (
                          <Cell key={s.sku} fill={SKU_COLORS[s.sku] ?? "#22c55e"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shrink-0 shadow-sm border-border bg-card">
                <CardContent className="p-4">
                  <p className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-3 px-1">Top Retailers</p>
                  <div className="space-y-1">
                    {retailers.map((r, i) => {
                      const isSelected = selected.name === r.name;
                      return (
                        <button key={r.name}
                          className={cn("w-full text-left rounded-lg px-3 py-2.5 flex items-center gap-3 transition-all duration-200 text-xs font-semibold",
                            isSelected ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]" : "hover:bg-accent text-foreground")}
                          onClick={() => setSelected(r)}>
                          <span className={cn("h-6 w-6 shrink-0 flex items-center justify-center rounded-[8px] text-[10px] font-black shadow-sm transition-colors",
                            isSelected ? "bg-white text-primary" : i < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>{i + 1}</span>
                          <span className="truncate flex-1">{r.name.split(" ").slice(0, 3).join(" ")}</span>
                          <span className={cn("shrink-0 font-bold", isSelected ? "text-primary-foreground/90" : "text-muted-foreground")}>
                            {(r.totalQty / 1000).toFixed(1)}K
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ════ TAB: Route Planning ════ */}
        <TabsContent value="routes" className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Route Planning — Chattarpur Facility</h2>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                {routes.length} vehicles · {routes.reduce((s, r) => s + r.count, 0)} retailers · click a route to inspect, then compute drive order
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs font-bold rounded-xl"
              onClick={() => exportAllRoutesCSV(routes)}
            >
              <Download className="h-3.5 w-3.5" /> Export All Routes
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* Route list */}
            <div className="xl:col-span-1 space-y-2 xl:overflow-y-auto xl:max-h-[calc(100vh-300px)]">
              {routes.map((route, ri) => {
                const color = ROUTE_COLORS[ri % ROUTE_COLORS.length];
                const isSelected = selectedRoute?.routeId === route.routeId;
                const status = routeStatuses[route.routeId];
                return (
                  <button
                    key={route.routeId}
                    className={cn(
                      "w-full text-left rounded-xl border px-4 py-3 flex items-center gap-3 transition-all duration-200",
                      isSelected
                        ? "ring-2 ring-primary/30 border-primary/20 bg-primary/5 shadow-sm"
                        : "border-black/[0.04] bg-white hover:bg-accent/50 hover:border-primary/10"
                    )}
                    onClick={() => setSelectedRoute(isSelected ? null : route)}
                  >
                    <div className="h-8 w-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-black text-white" style={{ backgroundColor: color }}>
                      {route.routeId}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold truncate">{route.vehicleId}</p>
                        <span className="text-[10px] font-medium text-muted-foreground truncate">{route.zone}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{route.count} stops</p>
                    </div>
                    {status?.done && (
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold text-primary">{status.distance} km</p>
                        <p className="text-[9px] text-muted-foreground">{Math.round((status.duration ?? 0) / 60)}h {(status.duration ?? 0) % 60}m</p>
                      </div>
                    )}
                    {status?.loading && <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Route detail */}
            <div className="xl:col-span-2 space-y-4">
              {/* Map always visible — shows selected route stops or empty state */}
              <div className="rounded-xl overflow-hidden border h-[320px] xl:h-[380px]">
                {selectedRoute ? (
                  <RoutePlanMap
                    key={selectedRoute.routeId}
                    hub={HUB}
                    stops={selectedRoute.retailers}
                    routeColor={ROUTE_COLORS[(selectedRoute.routeId - 1) % ROUTE_COLORS.length]}
                    routeId={selectedRoute.routeId}
                    polyline={routePolylines[selectedRoute.routeId]}
                  />
                ) : (
                  <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center gap-2">
                    <Truck className="h-10 w-10 text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground font-medium">Select a route to preview on map</p>
                  </div>
                )}
              </div>

              {selectedRoute ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-black/[0.04] bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                          style={{ backgroundColor: ROUTE_COLORS[(selectedRoute.routeId - 1) % ROUTE_COLORS.length] }}>
                          {selectedRoute.routeId}
                        </div>
                        <div>
                          <p className="font-extrabold tracking-tight">{selectedRoute.vehicleId} — {selectedRoute.zone}</p>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">{selectedRoute.count} stops · departs from Chattarpur Facility</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {routeStatuses[selectedRoute.routeId]?.done ? (
                          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-xs font-bold text-green-700">{routeStatuses[selectedRoute.routeId].distance} km</p>
                              <p className="text-[10px] text-green-600">{Math.round((routeStatuses[selectedRoute.routeId].duration ?? 0) / 60)}h {(routeStatuses[selectedRoute.routeId].duration ?? 0) % 60}m est.</p>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="gap-2 text-xs font-bold rounded-xl"
                            disabled={routeStatuses[selectedRoute.routeId]?.loading}
                            onClick={() => computeRoute(selectedRoute)}
                          >
                            {routeStatuses[selectedRoute.routeId]?.loading ? (
                              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Computing...</>
                            ) : (
                              <><Navigation className="h-3.5 w-3.5" /> Compute Route</>
                            )}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-xs font-bold rounded-xl"
                          onClick={() => exportRouteCSV(selectedRoute)}
                        >
                          <Download className="h-3.5 w-3.5" /> Export CSV
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Stop list */}
                  <div className="rounded-2xl border border-black/[0.04] bg-white overflow-hidden">
                    <div className="px-5 py-3 border-b border-border/50 bg-muted/20">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Stops in order · {selectedRoute.count} retailers
                      </p>
                    </div>
                    <div className="divide-y divide-border/40 max-h-[480px] overflow-y-auto">
                      {/* Hub start */}
                      <div className="flex items-center gap-3 px-5 py-3 bg-primary/5">
                        <div className="h-7 w-7 shrink-0 rounded-lg bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center">▶</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-primary">START: Chattarpur Facility</p>
                          <p className="text-[10px] text-muted-foreground">Delhi, India · Hub</p>
                        </div>
                      </div>
                      {selectedRoute.retailers.map((r, i) => (
                        <div key={r.cid + i} className="flex items-center gap-3 px-5 py-3 hover:bg-accent/30 transition-colors">
                          <div className="h-7 w-7 shrink-0 rounded-lg text-[10px] font-black flex items-center justify-center text-white"
                            style={{ backgroundColor: ROUTE_COLORS[(selectedRoute.routeId - 1) % ROUTE_COLORS.length] }}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{r.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{r.area} · {r.zone}</p>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 font-bold ${r.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-muted text-muted-foreground border-border"}`}>
                              {r.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {/* Hub end */}
                      <div className="flex items-center gap-3 px-5 py-3 bg-primary/5">
                        <div className="h-7 w-7 shrink-0 rounded-lg bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center">■</div>
                        <p className="text-xs font-bold text-primary">END: Return to Chattarpur Facility</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
