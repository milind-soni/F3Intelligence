"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { riskAlerts, riskRoutes, cityWeather, riskTimeline } from "@/lib/mock-data";
import { AlertTriangle, AlertCircle, Info, CloudRain, Thermometer, Droplets } from "lucide-react";

export default function RisksPage() {
  const alertIcon = { Critical: AlertTriangle, Warning: AlertCircle, Info: Info };
  const alertStyles = {
    Critical: { card: "border-red-200 shadow-sm", badge: "bg-red-50 text-red-700 border-red-200", icon: "text-red-600 bg-red-100" },
    Warning: { card: "border-amber-200 shadow-sm", badge: "bg-amber-50 text-amber-700 border-amber-200", icon: "text-amber-600 bg-amber-100" },
    Info: { card: "border-blue-200 shadow-sm", badge: "bg-blue-50 text-blue-700 border-blue-200", icon: "text-blue-600 bg-blue-100" },
  };
  const riskBadge = (l: string) =>
    l === "Critical" ? "bg-red-50 text-red-700 border-red-200" :
    l === "Warning" ? "bg-amber-50 text-amber-700 border-amber-200" :
    "bg-blue-50 text-blue-700 border-blue-200";

  return (
    <div>
      <PageHeader title="Risk Alerts" description="Supply disruption monitoring and early warning system" />

      <div className="flex flex-wrap gap-4 mb-8">
        {[
          { type: "Critical", count: riskAlerts.filter(a => a.type === "Critical").length, Icon: AlertTriangle, cls: "bg-red-50 border-red-200 text-red-700" },
          { type: "Warning", count: riskAlerts.filter(a => a.type === "Warning").length, Icon: AlertCircle, cls: "bg-amber-50 border-amber-200 text-amber-700" },
          { type: "Info", count: riskAlerts.filter(a => a.type === "Info").length, Icon: Info, cls: "bg-blue-50 border-blue-200 text-blue-700" },
        ].map(({ type, count, Icon, cls }) => (
          <div key={type} className={`flex items-center gap-3 rounded-xl border px-5 py-3 shadow-sm ${cls}`}>
            <Icon className="h-5 w-5" />
            <span className="text-sm font-bold uppercase tracking-wider">{count} {type}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-2 space-y-4">
          {riskAlerts.map((alert) => {
            const style = alertStyles[alert.type];
            const Icon = alertIcon[alert.type];
            return (
              <Card key={alert.id} className={`overflow-hidden transition-all duration-300 hover:shadow-md ${style.card}`}>
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className={`w-1.5 shrink-0 ${alert.type === 'Critical' ? 'bg-red-500' : alert.type === 'Warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                    <div className="flex-1 p-5 flex items-start gap-4">
                      <div className={`p-2 rounded-lg shrink-0 ${style.icon}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <h3 className="text-base font-bold text-foreground truncate">{alert.title}</h3>
                          <Badge variant="outline" className={`shrink-0 text-[10px] font-bold uppercase tracking-wider ${style.badge}`}>{alert.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{alert.description}</p>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-muted-foreground bg-accent/50 p-2.5 rounded-lg border border-border/50">
                          <span className="flex items-center gap-1.5"><span className="text-foreground">Route:</span> {alert.route}</span>
                          <span className="flex items-center gap-1.5"><span className="text-foreground">Impact:</span> <span className={alert.type === 'Critical' ? 'text-red-600' : alert.type === 'Warning' ? 'text-amber-600' : 'text-blue-600'}>{alert.impact}</span></span>
                          <span className="ml-auto text-foreground/70">{alert.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm border-border">
            <CardContent className="p-5">
              <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" /> Risk Timeline — 7 Days
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={riskTimeline} margin={{ left: -25, right: 0, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)", fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)", fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "var(--color-muted)", opacity: 0.3 }} contentStyle={{ borderRadius: "12px", border: "1px solid var(--color-border)", fontSize: "12px", fontWeight: 600, boxShadow: "0 4px 12px -4px rgba(0,0,0,0.1)" }} />
                  <Bar dataKey="critical" stackId="a" fill="#ef4444" name="Critical" />
                  <Bar dataKey="warning" stackId="a" fill="#f59e0b" name="Warning" />
                  <Bar dataKey="info" stackId="a" fill="#3b82f6" name="Info" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardContent className="p-5">
              <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" /> Weather & Conditions
              </h3>
              <div className="space-y-3">
                {cityWeather.map((w) => (
                  <div key={w.city} className={`rounded-xl p-4 border transition-colors ${w.severity === "Warning" ? "border-amber-200 bg-amber-50/50 hover:bg-amber-50" : "border-border bg-card hover:bg-accent/50"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-foreground">{w.city}</span>
                      <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider ${riskBadge(w.severity)}`}>{w.alert}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs font-semibold">
                      <div className="flex items-center gap-1.5"><Thermometer className="h-4 w-4 text-orange-500" /><span className="text-foreground">{w.temp}°C</span></div>
                      <div className="flex items-center gap-1.5"><CloudRain className="h-4 w-4 text-blue-500" /><span className="text-foreground">{w.rain}mm</span></div>
                      <div className="flex items-center gap-1.5"><Droplets className="h-4 w-4 text-cyan-500" /><span className="text-foreground">{w.humidity}%</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-sm border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="p-5 border-b border-border/50 bg-accent/30">
            <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" /> Route Risk Assessment
            </h3>
          </div>
          <div className="p-2 w-full overflow-x-auto">
            <div className="min-w-[600px]">
              {riskRoutes.map((r, i) => (
                <div key={r.route} className={`flex items-center gap-6 p-4 rounded-xl transition-colors hover:bg-accent/50 ${i % 2 === 0 ? "bg-card" : "bg-transparent"}`}>
                  <div className="w-48 shrink-0">
                    <span className="text-sm font-bold text-foreground truncate block">{r.route}</span>
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1 h-3 rounded-full bg-accent overflow-hidden shadow-inner">
                      <div className={`h-full rounded-full transition-all duration-500 ${r.delayProb >= 60 ? "bg-red-500" : r.delayProb >= 30 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${r.delayProb}%` }} />
                    </div>
                    <span className="text-xs font-black text-muted-foreground w-10 text-right">{r.delayProb}%</span>
                  </div>
                  <div className="w-24 shrink-0 px-2 py-1 rounded bg-amber-50/50 border border-amber-200/50 flex items-center justify-center">
                    <span className="text-xs font-bold text-amber-600">{r.priceImpact}</span>
                  </div>
                  <div className="w-28 shrink-0 flex justify-end">
                    <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider ${riskBadge(r.riskLevel)}`}>{r.riskLevel}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
