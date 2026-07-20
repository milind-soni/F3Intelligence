// Server-side data access for the AI analyst. Keeps tool outputs compact so
// they fit comfortably in model context.

import realData from "./real-data.json";
import farmerData from "./farmer-data.json";
import retailerProfiles from "./retailer-profiles-data.json";

type WeeklyRow = { week: string; total: number } & Record<string, number | string>;
type FarmerRow = { month: number; vendor: string; item: string; weeklyQty: number };

const weekly = realData.weekly as unknown as WeeklyRow[];
const weeklyPredicted = realData.weeklyPredicted as unknown as WeeklyRow[];
const monthly = realData.monthly as { month: string; qty: number }[];
const customers = realData.customers as { id: string; name: string; area: string; zone: string; status: string }[];
const topRetailers = realData.retailers as { name: string; totalQty: number; topSkus: { sku: string; qty: number }[] }[];
const skuDetails = realData.skuDetails as { name: string; area: string; A: string; B: string; C: string }[];
const topSkus = realData.topSkus as { sku: string; qty: number }[];
const farmers = farmerData as FarmerRow[];

export const OVERVIEW_STATS = realData.stats as Record<string, number>;

export function listSkus(): string[] {
  return skuDetails.map((s) => s.name);
}

export function getSalesSeries(opts: { granularity: "monthly" | "weekly" | "predicted"; sku?: string }) {
  if (opts.granularity === "monthly") {
    return { series: monthly.map((m) => ({ period: m.month, qty: m.qty })), unit: "kg/month" };
  }
  const rows = opts.granularity === "weekly" ? weekly : weeklyPredicted;
  const key = opts.sku ? matchSku(opts.sku) : null;
  return {
    sku: key ?? "ALL",
    unit: "kg/week",
    series: rows.map((r) => ({
      period: r.week,
      qty: key ? Number(r[key] ?? 0) : r.total,
    })),
  };
}

function matchSku(input: string): string {
  const up = input.toUpperCase().trim();
  const names = listSkus();
  const exact = names.find((n) => n === up);
  if (exact) return exact;
  const partial = names.find((n) => n.includes(up) || up.includes(n));
  if (partial) return partial;
  throw new Error(`Unknown SKU "${input}". Available: ${names.join(", ")}`);
}

export function getTopRetailers(limit: number) {
  return topRetailers.slice(0, limit).map((r) => ({
    name: r.name,
    totalQty: r.totalQty,
    topSkus: r.topSkus.slice(0, 5),
  }));
}

export function getRetailerProfiles(opts: { zone?: string; tier?: string; limit: number }) {
  let rows = retailerProfiles as {
    name: string; area: string; zone: string; tier: string; score: number;
    paymentDays: number; creditScore: number; avgDailyKg: number; shopType: string;
  }[];
  if (opts.zone) {
    const z = opts.zone.toUpperCase();
    rows = rows.filter((r) => r.zone.toUpperCase().includes(z));
  }
  if (opts.tier) {
    const t = opts.tier.toLowerCase();
    rows = rows.filter((r) => r.tier.toLowerCase() === t);
  }
  const total = rows.length;
  return {
    matched: total,
    returned: Math.min(total, opts.limit),
    profiles: rows.slice(0, opts.limit).map((r) => ({
      name: r.name, zone: r.zone, tier: r.tier, score: r.score,
      paymentDays: r.paymentDays, creditScore: r.creditScore,
      avgDailyKg: r.avgDailyKg, shopType: r.shopType,
    })),
  };
}

export function getRetailerMetricArray(metric: "score" | "paymentDays" | "creditScore" | "avgDailyKg", zone?: string) {
  let rows = retailerProfiles as { zone: string; score: number; paymentDays: number; creditScore: number; avgDailyKg: number }[];
  if (zone) {
    const z = zone.toUpperCase();
    rows = rows.filter((r) => r.zone.toUpperCase().includes(z));
  }
  return rows.map((r) => r[metric]);
}

export function getCustomerBreakdown(groupBy: "zone" | "status") {
  const counts: Record<string, number> = {};
  for (const c of customers) {
    const key = (groupBy === "zone" ? c.zone : c.status).toUpperCase().trim();
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return { total: customers.length, breakdown: counts };
}

export function getFarmerSupply(opts: { item?: string; month?: number; topVendors: number }) {
  let rows = farmers;
  if (opts.item) {
    const up = opts.item.toUpperCase();
    rows = rows.filter((r) => r.item.toUpperCase().includes(up));
    if (rows.length === 0) {
      const items = [...new Set(farmers.map((f) => f.item))];
      throw new Error(`No farmer supply for "${opts.item}". Items: ${items.join(", ")}`);
    }
  }
  if (opts.month) rows = rows.filter((r) => r.month === opts.month);

  const byVendor: Record<string, number> = {};
  const byMonth: Record<number, number> = {};
  for (const r of rows) {
    byVendor[r.vendor] = (byVendor[r.vendor] ?? 0) + r.weeklyQty;
    byMonth[r.month] = (byMonth[r.month] ?? 0) + r.weeklyQty;
  }
  const vendors = Object.entries(byVendor)
    .sort((a, b) => b[1] - a[1])
    .slice(0, opts.topVendors)
    .map(([vendor, totalWeeklyQty]) => ({ vendor, totalWeeklyQty }));
  return {
    rowsMatched: rows.length,
    totalWeeklyQty: rows.reduce((a, r) => a + r.weeklyQty, 0),
    monthlyTotals: byMonth,
    topVendors: vendors,
  };
}

export function getSkuCatalog() {
  return {
    totalSkus: skuDetails.length,
    topSkusByVolume: topSkus.slice(0, 15).map((s) => ({ sku: s.sku, totalQty: s.qty })),
    details: skuDetails.map((s) => ({ name: s.name, sourceArea: s.area, grades: { A: s.A, B: s.B, C: s.C } })),
  };
}
