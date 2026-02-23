"use client";

import {
  Package,
  Trash2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart,
  Line,
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
import { KpiCard } from "@/components/kpi-card";
import { ChartCard } from "@/components/chart-card";
import { PageHeader } from "@/components/page-header";
import {
  kpiData,
  dailyDemandData,
  cityDemandData,
  riskAlerts,
  procurementRecs,
} from "@/lib/mock-data";

export default function DashboardPage() {
  const alertColors = {
    Critical: "bg-red-100 text-red-700 border-red-200",
    Warning: "bg-amber-100 text-amber-700 border-amber-200",
    Info: "bg-blue-100 text-blue-700 border-blue-200",
  };

  const buyMore = procurementRecs.filter((r) => r.action === "Buy More");
  const hold = procurementRecs.filter((r) => r.action === "Hold");
  const buyLess = procurementRecs.filter((r) => r.action === "Buy Less");

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Real-time overview of your fresh produce intelligence"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiCard
          title="Total Demand"
          value={kpiData.totalDemand.value.toLocaleString()}
          unit="kg"
          change={kpiData.totalDemand.change}
          period={kpiData.totalDemand.period}
          icon={Package}
          color="bg-green-600"
        />
        <KpiCard
          title="Wastage Rate"
          value={kpiData.wastage.value}
          unit="%"
          change={kpiData.wastage.change}
          period={kpiData.wastage.period}
          icon={Trash2}
          color="bg-amber-500"
        />
        <KpiCard
          title="Sell-Through"
          value={kpiData.sellThrough.value}
          unit="%"
          change={kpiData.sellThrough.change}
          period={kpiData.sellThrough.period}
          icon={CheckCircle}
          color="bg-emerald-500"
        />
        <KpiCard
          title="Active Alerts"
          value={kpiData.activeAlerts.value}
          change={kpiData.activeAlerts.change}
          period={kpiData.activeAlerts.period}
          icon={AlertTriangle}
          color="bg-red-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        {/* Demand vs Actual */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Demand: Predicted vs Actual"
            subtitle="Last 30 days — all SKUs aggregated"
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyDemandData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  interval={4}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  dot={false}
                  name="Predicted"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#f97316"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Actual"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* City Breakdown */}
        <ChartCard title="City-wise Demand" subtitle="Today's distribution">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cityDemandData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="city"
                type="category"
                tick={{ fontSize: 12 }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
              />
              <Bar
                dataKey="demand"
                fill="#16a34a"
                radius={[0, 4, 4, 0]}
                name="Demand"
              />
              <Bar
                dataKey="fulfilled"
                fill="#86efac"
                radius={[0, 4, 4, 0]}
                name="Fulfilled"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {riskAlerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <Badge
                  variant="outline"
                  className={alertColors[alert.type]}
                >
                  {alert.type}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{alert.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {alert.impact} &middot; {alert.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Procurement Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Today&apos;s Procurement Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="rounded-lg bg-green-50 p-4 text-center border border-green-200">
                <p className="text-2xl font-bold text-green-700">
                  {buyMore.length}
                </p>
                <p className="text-xs font-medium text-green-600">Buy More</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-4 text-center border border-amber-200">
                <p className="text-2xl font-bold text-amber-700">
                  {hold.length}
                </p>
                <p className="text-xs font-medium text-amber-600">Hold</p>
              </div>
              <div className="rounded-lg bg-red-50 p-4 text-center border border-red-200">
                <p className="text-2xl font-bold text-red-700">
                  {buyLess.length}
                </p>
                <p className="text-xs font-medium text-red-600">Buy Less</p>
              </div>
            </div>
            <div className="space-y-2">
              {buyMore.slice(0, 3).map((rec) => (
                <div
                  key={`${rec.sku}-${rec.city}`}
                  className="flex items-center justify-between rounded-md bg-green-50 px-3 py-2 border border-green-100"
                >
                  <div>
                    <span className="text-sm font-medium">{rec.sku}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {rec.city}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-green-700">
                    +{rec.procureQty} kg
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
