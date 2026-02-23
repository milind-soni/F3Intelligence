"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
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
import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/chart-card";
import { PageHeader } from "@/components/page-header";
import {
  SKUS,
  CITIES,
  skuDemandData,
  demandForecastTable,
  seasonalityData,
} from "@/lib/mock-data";
import type { SKU, City } from "@/lib/mock-data";

export default function DemandPage() {
  const [selectedSku, setSelectedSku] = useState<SKU>("Banana");
  const [selectedCity, setSelectedCity] = useState<City | "All">("All");

  const chartData = skuDemandData[selectedSku];

  const filteredTable =
    selectedCity === "All"
      ? demandForecastTable.filter((r) => r.sku === selectedSku)
      : demandForecastTable.filter(
          (r) => r.sku === selectedSku && r.city === selectedCity
        );

  const confidenceColor = (c: number) => {
    if (c >= 85) return "text-green-600 bg-green-50";
    if (c >= 75) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  // Heatmap color
  const heatColor = (val: number) => {
    if (val >= 520) return "bg-green-600 text-white";
    if (val >= 450) return "bg-green-500 text-white";
    if (val >= 400) return "bg-green-400 text-white";
    if (val >= 380) return "bg-green-300";
    return "bg-green-200";
  };

  return (
    <div>
      <PageHeader
        title="Demand Forecast"
        description="SKU-level demand predictions with confidence intervals"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            SKU:
          </span>
          <div className="flex gap-1">
            {SKUS.map((sku) => (
              <Button
                key={sku}
                size="sm"
                variant={selectedSku === sku ? "default" : "outline"}
                onClick={() => setSelectedSku(sku)}
                className={
                  selectedSku === sku
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                }
              >
                {sku}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            City:
          </span>
          <div className="flex gap-1">
            {(["All", ...CITIES] as const).map((city) => (
              <Button
                key={city}
                size="sm"
                variant={selectedCity === city ? "default" : "outline"}
                onClick={() => setSelectedCity(city)}
                className={
                  selectedCity === city
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                }
              >
                {city}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        <div className="lg:col-span-2">
          <ChartCard
            title={`${selectedSku} — Demand Forecast`}
            subtitle="30-day prediction with confidence band"
          >
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="upper"
                  stroke="none"
                  fill="#bbf7d0"
                  fillOpacity={0.5}
                  name="Upper Bound"
                />
                <Area
                  type="monotone"
                  dataKey="lower"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  name="Lower Bound"
                />
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
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Seasonality Heatmap */}
        <ChartCard
          title="Weekly Seasonality"
          subtitle="Demand pattern by day of week"
        >
          <div className="space-y-1">
            <div className="grid grid-cols-5 gap-1 mb-2">
              <div className="text-xs text-muted-foreground" />
              <div className="text-xs text-center text-muted-foreground">W1</div>
              <div className="text-xs text-center text-muted-foreground">W2</div>
              <div className="text-xs text-center text-muted-foreground">W3</div>
              <div className="text-xs text-center text-muted-foreground">W4</div>
            </div>
            {seasonalityData.map((row) => (
              <div key={row.day} className="grid grid-cols-5 gap-1">
                <div className="text-xs font-medium flex items-center">
                  {row.day}
                </div>
                {[row.week1, row.week2, row.week3, row.week4].map(
                  (val, i) => (
                    <div
                      key={i}
                      className={`rounded-md p-2 text-center text-xs font-medium ${heatColor(val)}`}
                    >
                      {val}
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4 justify-center">
            <span className="text-xs text-muted-foreground">Low</span>
            <div className="flex gap-0.5">
              {["bg-green-200", "bg-green-300", "bg-green-400", "bg-green-500", "bg-green-600"].map((c) => (
                <div key={c} className={`w-6 h-3 rounded-sm ${c}`} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">High</span>
          </div>
        </ChartCard>
      </div>

      {/* Forecast Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Forecast Details — {selectedSku}
            {selectedCity !== "All" ? ` / ${selectedCity}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="text-right">Predicted (kg)</TableHead>
                <TableHead className="text-center">Confidence</TableHead>
                <TableHead className="text-right">Est. Wastage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(selectedCity === "All"
                ? demandForecastTable.filter((r) => r.sku === selectedSku)
                : filteredTable
              ).map((row) => (
                <TableRow key={`${row.sku}-${row.city}`}>
                  <TableCell className="font-medium">{row.sku}</TableCell>
                  <TableCell>{row.city}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {row.predicted}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={confidenceColor(row.confidence)}
                    >
                      {row.confidence}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-amber-600">
                    {row.wastage}%
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
