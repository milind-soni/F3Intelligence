"use client";

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
  procurementRecs,
  costProjection,
  aiVsActual,
} from "@/lib/mock-data";
import {
  ArrowUpCircle,
  MinusCircle,
  ArrowDownCircle,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default function ProcurementPage() {
  const buyMore = procurementRecs.filter((r) => r.action === "Buy More");
  const hold = procurementRecs.filter((r) => r.action === "Hold");
  const buyLess = procurementRecs.filter((r) => r.action === "Buy Less");

  const actionStyles = {
    "Buy More": {
      bg: "bg-green-50 border-green-200",
      text: "text-green-700",
      icon: ArrowUpCircle,
      iconColor: "text-green-500",
    },
    Hold: {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-700",
      icon: MinusCircle,
      iconColor: "text-amber-500",
    },
    "Buy Less": {
      bg: "bg-red-50 border-red-200",
      text: "text-red-700",
      icon: ArrowDownCircle,
      iconColor: "text-red-500",
    },
  };

  return (
    <div>
      <PageHeader
        title="Procurement Recommendations"
        description="AI-optimized procurement decisions for today"
      />

      {/* Action Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        {([
          { label: "Buy More", items: buyMore, color: "green" },
          { label: "Hold", items: hold, color: "amber" },
          { label: "Buy Less", items: buyLess, color: "red" },
        ] as const).map(({ label, items, color }) => {
          const style = actionStyles[label];
          const Icon = style.icon;
          const totalQty = items.reduce((s, r) => s + r.procureQty, 0);
          return (
            <Card key={label} className={style.bg}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Icon className={`h-6 w-6 ${style.iconColor}`} />
                  <div>
                    <p className={`text-lg font-bold ${style.text}`}>
                      {items.length} SKU-Cities
                    </p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Total: <span className="font-semibold">{totalQty.toLocaleString()} kg</span>
                </p>
                <div className="mt-3 space-y-1.5">
                  {items.slice(0, 3).map((r) => (
                    <div
                      key={`${r.sku}-${r.city}`}
                      className="flex items-center justify-between text-xs"
                    >
                      <span>
                        {r.sku} — {r.city}
                      </span>
                      <span className="font-medium">{r.procureQty} kg</span>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{items.length - 3} more...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        {/* Cost Projection */}
        <ChartCard
          title="Cost Projection"
          subtitle="Actual spend (7d) + AI forecast (7d) in Lakhs"
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={costProjection}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[6, 10]} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
                formatter={(value: number) => [`₹${value}L`, ""]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#16a34a"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                name="Actual"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="projected"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
                name="AI Projected"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* AI vs Actual */}
        <ChartCard
          title="AI Recommendation vs Last Week"
          subtitle="Comparing AI suggestion to actual orders + wastage"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={aiVsActual}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="sku" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
              />
              <Legend />
              <Bar
                dataKey="aiRecommended"
                fill="#16a34a"
                radius={[4, 4, 0, 0]}
                name="AI Recommended"
              />
              <Bar
                dataKey="actualOrdered"
                fill="#94a3b8"
                radius={[4, 4, 0, 0]}
                name="Actually Ordered"
              />
            </BarChart>
          </ResponsiveContainer>
          {/* Wastage comparison below chart */}
          <div className="mt-3 grid grid-cols-5 gap-2">
            {aiVsActual.map((row) => (
              <div key={row.sku} className="text-center">
                <p className="text-xs text-muted-foreground">{row.sku}</p>
                <p className="text-xs">
                  <span className="text-green-600 font-medium">{row.aiWastage}%</span>
                  {" vs "}
                  <span className="text-red-500 font-medium">{row.actualWastage}%</span>
                </p>
                <p className="text-[10px] text-muted-foreground">wastage</p>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Master Decision Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Master Procurement Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="text-center">Action</TableHead>
                <TableHead className="text-right">Procure (kg)</TableHead>
                <TableHead className="text-right">Buffer</TableHead>
                <TableHead>Vendor Split</TableHead>
                <TableHead className="text-right">Price Chg</TableHead>
                <TableHead className="text-center">Confidence</TableHead>
                <TableHead className="text-center">Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {procurementRecs.map((r) => {
                const style = actionStyles[r.action];
                return (
                  <TableRow key={`${r.sku}-${r.city}`}>
                    <TableCell className="font-medium">{r.sku}</TableCell>
                    <TableCell>{r.city}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`${style.bg} ${style.text}`}>
                        {r.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {r.procureQty}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      +{r.buffer}
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">
                      {r.vendorSplit}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        r.priceChange > 0
                          ? "text-red-500"
                          : r.priceChange < 0
                          ? "text-green-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {r.priceChange > 0
                        ? `+${r.priceChange}%`
                        : r.priceChange < 0
                        ? `${r.priceChange}%`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          r.confidence >= 85
                            ? "bg-green-50 text-green-700 border-green-200"
                            : r.confidence >= 75
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {r.confidence}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {r.riskFlag ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500 mx-auto" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
