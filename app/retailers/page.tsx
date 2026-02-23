"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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
import { retailers } from "@/lib/mock-data";
import { Users, Star, AlertCircle } from "lucide-react";

export default function RetailersPage() {
  const [selectedRetailer, setSelectedRetailer] = useState(retailers[0]);

  const priority = retailers.filter((r) => r.tier === "Priority");
  const secondary = retailers.filter((r) => r.tier === "Secondary");
  const lowValue = retailers.filter((r) => r.tier === "Low Value");

  const tierColor = (tier: string) => {
    if (tier === "Priority") return "bg-green-100 text-green-700 border-green-200";
    if (tier === "Secondary") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const scoreBarData = retailers
    .sort((a, b) => b.score - a.score)
    .map((r) => ({
      name: r.name.length > 15 ? r.name.substring(0, 15) + "..." : r.name,
      score: r.score,
      fill:
        r.tier === "Priority"
          ? "#16a34a"
          : r.tier === "Secondary"
          ? "#f59e0b"
          : "#ef4444",
    }));

  return (
    <div>
      <PageHeader
        title="Retailer Scores"
        description="AI-scored retailer rankings based on purchase behavior, payment reliability, and location value"
      />

      {/* Tier Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-xl bg-green-600 p-3">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{priority.length}</p>
              <p className="text-sm text-green-600 font-medium">Priority Sellers</p>
              <p className="text-xs text-muted-foreground">Score 80+</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-xl bg-amber-500 p-3">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{secondary.length}</p>
              <p className="text-sm text-amber-600 font-medium">Secondary</p>
              <p className="text-xs text-muted-foreground">Score 60–79</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-xl bg-red-500 p-3">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{lowValue.length}</p>
              <p className="text-sm text-red-600 font-medium">Low Value</p>
              <p className="text-xs text-muted-foreground">Score &lt;60</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        {/* Score Distribution */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Retailer Score Distribution"
            subtitle="All retailers ranked by AI score"
          >
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={scoreBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11 }}
                  width={130}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {scoreBarData.map((entry, index) => (
                    <rect key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Radar Chart for Selected Retailer */}
        <ChartCard
          title={selectedRetailer.name}
          subtitle="Score breakdown — click a retailer to view"
        >
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={selectedRetailer.metrics}>
              <PolarGrid stroke="#d1d5db" />
              <PolarAngleAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fontSize: 10 }}
              />
              <Radar
                name="Score"
                dataKey="value"
                stroke="#16a34a"
                fill="#16a34a"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="text-center mt-2">
            <Badge variant="outline" className={tierColor(selectedRetailer.tier)}>
              {selectedRetailer.tier}
            </Badge>
            <span className="ml-2 text-2xl font-bold">
              {selectedRetailer.score}
            </span>
            <span className="text-muted-foreground">/100</span>
          </div>
        </ChartCard>
      </div>

      {/* Retailers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            All Retailers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Retailer</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Tier</TableHead>
                <TableHead className="text-right">Daily Capacity (kg)</TableHead>
                <TableHead className="text-right">Avg Purchase</TableHead>
                <TableHead className="text-right">Payment Days</TableHead>
                <TableHead className="text-center">Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {retailers.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer hover:bg-green-50/50"
                  onClick={() => setSelectedRetailer(r)}
                >
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.city}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.shopType}
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {r.score}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={tierColor(r.tier)}>
                      {r.tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{r.capacity}</TableCell>
                  <TableCell className="text-right">
                    {r.avgDailyPurchase} kg
                  </TableCell>
                  <TableCell className="text-right">{r.paymentDays}d</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`text-sm font-medium ${
                        r.riskScore <= 20
                          ? "text-green-600"
                          : r.riskScore <= 40
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {r.riskScore}
                    </span>
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
