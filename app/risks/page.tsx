"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChartCard } from "@/components/chart-card";
import { PageHeader } from "@/components/page-header";
import {
  riskAlerts,
  riskRoutes,
  cityWeather,
  riskTimeline,
} from "@/lib/mock-data";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
} from "lucide-react";

export default function RisksPage() {
  const alertIcon = {
    Critical: AlertTriangle,
    Warning: AlertCircle,
    Info: Info,
  };

  const alertStyles = {
    Critical: {
      card: "border-red-200 bg-red-50/30",
      badge: "bg-red-100 text-red-700 border-red-200",
      icon: "text-red-500",
    },
    Warning: {
      card: "border-amber-200 bg-amber-50/30",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      icon: "text-amber-500",
    },
    Info: {
      card: "border-blue-200 bg-blue-50/30",
      badge: "bg-blue-100 text-blue-700 border-blue-200",
      icon: "text-blue-500",
    },
  };

  const riskLevelBadge = (level: string) => {
    if (level === "Critical") return "bg-red-100 text-red-700 border-red-200";
    if (level === "Warning") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-blue-100 text-blue-700 border-blue-200";
  };

  const criticalCount = riskAlerts.filter((a) => a.type === "Critical").length;
  const warningCount = riskAlerts.filter((a) => a.type === "Warning").length;
  const infoCount = riskAlerts.filter((a) => a.type === "Info").length;

  return (
    <div>
      <PageHeader
        title="Risk Alerts"
        description="Supply disruption monitoring and early warning system"
      />

      {/* Summary Badges */}
      <div className="flex gap-3 mb-6">
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-sm font-semibold text-red-700">{criticalCount} Critical</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold text-amber-700">{warningCount} Warnings</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2">
          <Info className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-semibold text-blue-700">{infoCount} Info</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        {/* Alert Feed */}
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
                        <Badge variant="outline" className={style.badge}>
                          {alert.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {alert.description}
                      </p>
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

        {/* Right Column */}
        <div className="space-y-6">
          {/* Risk Timeline */}
          <ChartCard title="Risk Timeline" subtitle="Last 7 days">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={riskTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Legend />
                <Bar dataKey="critical" stackId="a" fill="#ef4444" name="Critical" />
                <Bar dataKey="warning" stackId="a" fill="#f59e0b" name="Warning" />
                <Bar dataKey="info" stackId="a" fill="#3b82f6" name="Info" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Weather Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Weather Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cityWeather.map((w) => (
                <div
                  key={w.city}
                  className={`rounded-lg p-3 border ${
                    w.severity === "Warning"
                      ? "border-amber-200 bg-amber-50/50"
                      : "border-green-200 bg-green-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{w.city}</span>
                    <Badge
                      variant="outline"
                      className={riskLevelBadge(w.severity)}
                    >
                      {w.alert}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Thermometer className="h-3 w-3 text-red-400" />
                      <span>{w.temp}°C</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CloudRain className="h-3 w-3 text-blue-400" />
                      <span>{w.rain}mm</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Droplets className="h-3 w-3 text-cyan-400" />
                      <span>{w.humidity}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Risk Routes Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Route Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead className="text-center">Delay Probability</TableHead>
                <TableHead className="text-center">Price Impact</TableHead>
                <TableHead className="text-center">Risk Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riskRoutes.map((r) => (
                <TableRow key={r.route}>
                  <TableCell className="font-medium">{r.route}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            r.delayProb >= 60
                              ? "bg-red-500"
                              : r.delayProb >= 30
                              ? "bg-amber-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${r.delayProb}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{r.delayProb}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium text-amber-600">
                    {r.priceImpact}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={riskLevelBadge(r.riskLevel)}>
                      {r.riskLevel}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
