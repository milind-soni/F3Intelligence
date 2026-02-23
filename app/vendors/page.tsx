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
import { Progress } from "@/components/ui/progress";
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
import { vendors, vendorAllocations, vendorSkuAllocation } from "@/lib/mock-data";

const SKU_COLORS: Record<string, string> = {
  Banana: "#16a34a",
  Apple: "#ef4444",
  Mango: "#f59e0b",
  Papaya: "#f97316",
  Guava: "#8b5cf6",
};

export default function VendorsPage() {
  const reliabilityLeaderboard = [...vendors].sort(
    (a, b) => b.reliability - a.reliability
  );

  return (
    <div>
      <PageHeader
        title="Vendor Allocation"
        description="Optimized vendor distribution and reliability tracking"
      />

      {/* Top: Stacked Bar + Reliability */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        {/* Stacked Bar Chart */}
        <div className="lg:col-span-2">
          <ChartCard
            title="SKU Allocation by Vendor"
            subtitle="Today's distribution plan"
          >
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={vendorSkuAllocation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="vendor" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="Banana"
                  stackId="a"
                  fill={SKU_COLORS.Banana}
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="Apple"
                  stackId="a"
                  fill={SKU_COLORS.Apple}
                />
                <Bar
                  dataKey="Mango"
                  stackId="a"
                  fill={SKU_COLORS.Mango}
                />
                <Bar
                  dataKey="Papaya"
                  stackId="a"
                  fill={SKU_COLORS.Papaya}
                />
                <Bar
                  dataKey="Guava"
                  stackId="a"
                  fill={SKU_COLORS.Guava}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Reliability Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Reliability Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reliabilityLeaderboard.map((v, i) => (
              <div key={v.id} className="flex items-center gap-3">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    i < 3
                      ? "bg-green-600 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">
                      {v.name}
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      {v.reliability}%
                    </span>
                  </div>
                  <Progress
                    value={v.reliability}
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Capacity Utilization Gauges */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        {vendors.slice(0, 4).map((v) => {
          const pct = Math.round((v.utilized / v.capacity) * 100);
          return (
            <Card key={v.id}>
              <CardContent className="p-4 text-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-24 h-24 -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="none"
                      stroke={pct > 80 ? "#16a34a" : pct > 60 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="8"
                      strokeDasharray={`${(pct / 100) * 251.2} 251.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-lg font-bold">{pct}%</span>
                </div>
                <p className="mt-2 text-sm font-medium truncate">{v.name}</p>
                <p className="text-xs text-muted-foreground">
                  {v.utilized}/{v.capacity} kg
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Allocation Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Today&apos;s Allocation Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="text-right">Quantity (kg)</TableHead>
                <TableHead className="text-center">Sell-Through Prob.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendorAllocations.map((a, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{a.vendor}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            SKU_COLORS[a.sku] || "#6b7280",
                        }}
                      />
                      {a.sku}
                    </div>
                  </TableCell>
                  <TableCell>{a.city}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {a.qty}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={
                        a.sellThrough >= 90
                          ? "bg-green-50 text-green-700 border-green-200"
                          : a.sellThrough >= 80
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }
                    >
                      {a.sellThrough}%
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
