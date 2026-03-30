// Retailer profiles — real names from order data
// Scores, tiers, credit, payment terms are AI-derived estimates from order history
// SKU allocations are computed from actual order quantities

import profileData from "./retailer-profiles-data.json";

export interface RetailerProfile {
  name: string;
  area: string;
  zone?: string;
  tier: "Priority" | "Secondary" | "Low Value";
  score: number;
  paymentDays: number;
  creditScore: number;
  avgDailyKg: number;
  shopType: string;
  color: string; // accent color per retailer
  radarMetrics: { label: string; value: number }[];
  skuAllocation: Record<string, number>; // SKU → % of their order (real data)
}

export const retailerProfiles = profileData as RetailerProfile[];
