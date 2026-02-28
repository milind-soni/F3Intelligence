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
    Critical: { card: "border-red-200 bg-red-50/30", badge: "bg-red-100 text-red-700 border-red-200", icon: "text-red-500" },
    Warning: { card: "border-amber-200 bg-amber-50/30", badge: "bg-amber-100 text-amber-700 border-amber-200", icon: "text-amber-500" },
    Info: { card: "border-blue-200 bg-blue-50/30", badge: "bg-blue-100 text-blue-700 border-blue-200", icon: "text-blue-500" },
  };
  const riskBadge = (l: string) =>
    l === "Critical" ? "bg-red-100 text-red-700 border-red-200" :
    l === "Warning" ? "bg-amber-100 text-amber-700 border-amber-200" :
    "bg-blue-100 text-blue-700 border-blue-200";

  return (
    <div>
      <PageHeader title="Risk Alerts" description="Supply disruption monitoring and early warning system" />

      <div className="flex gap-3 mb-6">
        {[
          { type: "Critical", count: riskAlerts.filter(a => a.type === "Critical").length, Icon: AlertTriangle, cls: "bg-red-50 border-red-200 text-red-700" },
          { type: "Warning", count: riskAlerts.filter(a => a.type === "Warning").length, Icon: AlertCircle, cls: "bg-amber-50 border-amber-200 text-amber-700" },
          { type: "Info", count: riskAlerts.filter(a => a.type === "Info").length, Icon: Info, cls: "bg-blue-50 border-blue-200 text-blue-700" },
        ].map(({ type, count, Icon, cls }) => (
          <div key={type} className={`flex items-center gap-2 rounded-lg border px-4 py-2 ${cls}`}>
            <Icon className="h-4 w-4" />
            <span className="text-sm font-semibold">{count} {type}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        <div className="lg:col-span-2 space-y-3">
          {riskAlerts.map((alert) => {
            const style = alertStyles[alert.type];
            const Icon = alertIcon[alert.type];
            return (
              <Card key={alert.id} className={style.card}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 ${style.icon}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold">{alert.title}</h3>
                        <Badge variant="outline" className={style.badge}>{alert.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Route: {alert.route}</span>
                        <span>Impact: {alert.impact}</span>
                        <span>{alert.time}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-3">Risk Timeline — 7 Days</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={riskTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                  <Bar dataKey="critical" stackId="a" fill="#ef4444" name="Critical" />
                  <Bar dataKey="warning" stackId="a" fill="#f59e0b" name="Warning" />
                  <Bar dataKey="info" stackId="a" fill="#3b82f6" name="Info" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-3">Weather — Delhi NCR</h3>
              <div className="space-y-3">
                {cityWeather.map((w) => (
                  <div key={w.city} className={`rounded-lg p-3 border ${w.severity === "Warning" ? "border-amber-200 bg-amber-50/50" : "border-green-200 bg-green-50/50"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">{w.city}</span>
                      <Badge variant="outline" className={riskBadge(w.severity)}>{w.alert}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-1"><Thermometer className="h-3 w-3 text-red-400" /><span>{w.temp}°C</span></div>
                      <div className="flex items-center gap-1"><CloudRain className="h-3 w-3 text-blue-400" /><span>{w.rain}mm</span></div>
                      <div className="flex items-center gap-1"><Droplets className="h-3 w-3 text-cyan-400" /><span>{w.humidity}%</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold mb-4">Route Risk Assessment</h3>
          <div className="space-y-3">
            {riskRoutes.map((r) => (
              <div key={r.route} className="flex items-center gap-4">
                <span className="text-sm font-medium w-52 shrink-0">{r.route}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${r.delayProb >= 60 ? "bg-red-500" : r.delayProb >= 30 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${r.delayProb}%` }} />
                  </div>
                  <span className="text-sm font-medium w-8">{r.delayProb}%</span>
                </div>
                <span className="text-sm font-medium text-amber-600 w-12">{r.priceImpact}</span>
                <Badge variant="outline" className={riskBadge(r.riskLevel)}>{r.riskLevel}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
