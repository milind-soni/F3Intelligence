// ============================================================
// F3 Fresh Intelligence Platform — Mock Data
// ============================================================

export const SKUS = ["Banana", "Apple", "Mango", "Papaya", "Guava"] as const;
export const CITIES = ["Mumbai", "Delhi", "Bangalore", "Hyderabad"] as const;

export type SKU = (typeof SKUS)[number];
export type City = (typeof CITIES)[number];

// --- Helper to generate dates ---
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

// ============================================================
// KPI Summary
// ============================================================
export const kpiData = {
  totalDemand: { value: 12450, unit: "kg", change: +8.2, period: "vs last week" },
  wastage: { value: 4.2, unit: "%", change: -1.8, period: "vs last week" },
  sellThrough: { value: 93.1, unit: "%", change: +2.4, period: "vs last week" },
  activeAlerts: { value: 3, unit: "", change: -2, period: "vs yesterday" },
  avgConfidence: { value: 87, unit: "%", change: +3.1, period: "vs last month" },
  revenueToday: { value: 8.4, unit: "L", change: +12.5, period: "vs last week" },
};

// ============================================================
// Daily Demand Data (30 days, aggregated)
// ============================================================
export const dailyDemandData = Array.from({ length: 30 }, (_, i) => {
  const base = 380 + Math.sin(i * 0.3) * 60;
  const predicted = Math.round(base + Math.random() * 40);
  const actual = i < 28 ? Math.round(predicted + (Math.random() - 0.5) * 50) : null;
  return {
    date: formatDate(daysAgo(29 - i)),
    predicted,
    actual,
    confidence: Math.round(82 + Math.random() * 12),
  };
});

// ============================================================
// City-wise Demand Breakdown
// ============================================================
export const cityDemandData = [
  { city: "Mumbai", demand: 4200, fulfilled: 3950, color: "#16a34a" },
  { city: "Delhi", demand: 3800, fulfilled: 3520, color: "#22c55e" },
  { city: "Bangalore", demand: 2600, fulfilled: 2480, color: "#4ade80" },
  { city: "Hyderabad", demand: 1850, fulfilled: 1720, color: "#86efac" },
];

// ============================================================
// SKU-wise Demand Forecast (per SKU, 30 days)
// ============================================================
export const skuDemandData: Record<
  SKU,
  { date: string; predicted: number; actual: number | null; upper: number; lower: number }[]
> = {
  Banana: Array.from({ length: 30 }, (_, i) => {
    const base = 120 + Math.sin(i * 0.4) * 25;
    const predicted = Math.round(base);
    return {
      date: formatDate(daysAgo(29 - i)),
      predicted,
      actual: i < 28 ? Math.round(predicted + (Math.random() - 0.5) * 20) : null,
      upper: Math.round(predicted * 1.15),
      lower: Math.round(predicted * 0.85),
    };
  }),
  Apple: Array.from({ length: 30 }, (_, i) => {
    const base = 90 + Math.sin(i * 0.35) * 20;
    const predicted = Math.round(base);
    return {
      date: formatDate(daysAgo(29 - i)),
      predicted,
      actual: i < 28 ? Math.round(predicted + (Math.random() - 0.5) * 18) : null,
      upper: Math.round(predicted * 1.18),
      lower: Math.round(predicted * 0.82),
    };
  }),
  Mango: Array.from({ length: 30 }, (_, i) => {
    const base = 70 + Math.sin(i * 0.25) * 30;
    const predicted = Math.round(base);
    return {
      date: formatDate(daysAgo(29 - i)),
      predicted,
      actual: i < 28 ? Math.round(predicted + (Math.random() - 0.5) * 25) : null,
      upper: Math.round(predicted * 1.2),
      lower: Math.round(predicted * 0.8),
    };
  }),
  Papaya: Array.from({ length: 30 }, (_, i) => {
    const base = 55 + Math.sin(i * 0.3) * 15;
    const predicted = Math.round(base);
    return {
      date: formatDate(daysAgo(29 - i)),
      predicted,
      actual: i < 28 ? Math.round(predicted + (Math.random() - 0.5) * 14) : null,
      upper: Math.round(predicted * 1.16),
      lower: Math.round(predicted * 0.84),
    };
  }),
  Guava: Array.from({ length: 30 }, (_, i) => {
    const base = 45 + Math.sin(i * 0.45) * 12;
    const predicted = Math.round(base);
    return {
      date: formatDate(daysAgo(29 - i)),
      predicted,
      actual: i < 28 ? Math.round(predicted + (Math.random() - 0.5) * 12) : null,
      upper: Math.round(predicted * 1.14),
      lower: Math.round(predicted * 0.86),
    };
  }),
};

// ============================================================
// Demand Forecast Table
// ============================================================
export const demandForecastTable = [
  { sku: "Banana", city: "Mumbai", predicted: 520, confidence: 91, wastage: 3.1 },
  { sku: "Banana", city: "Delhi", predicted: 480, confidence: 88, wastage: 3.8 },
  { sku: "Banana", city: "Bangalore", predicted: 310, confidence: 85, wastage: 4.2 },
  { sku: "Banana", city: "Hyderabad", predicted: 220, confidence: 82, wastage: 5.0 },
  { sku: "Apple", city: "Mumbai", predicted: 380, confidence: 89, wastage: 2.5 },
  { sku: "Apple", city: "Delhi", predicted: 420, confidence: 92, wastage: 2.1 },
  { sku: "Apple", city: "Bangalore", predicted: 260, confidence: 86, wastage: 3.4 },
  { sku: "Apple", city: "Hyderabad", predicted: 180, confidence: 80, wastage: 4.8 },
  { sku: "Mango", city: "Mumbai", predicted: 290, confidence: 78, wastage: 5.2 },
  { sku: "Mango", city: "Delhi", predicted: 250, confidence: 75, wastage: 6.1 },
  { sku: "Mango", city: "Bangalore", predicted: 180, confidence: 72, wastage: 7.0 },
  { sku: "Mango", city: "Hyderabad", predicted: 150, confidence: 70, wastage: 7.5 },
  { sku: "Papaya", city: "Mumbai", predicted: 180, confidence: 84, wastage: 4.0 },
  { sku: "Papaya", city: "Delhi", predicted: 150, confidence: 81, wastage: 4.5 },
  { sku: "Papaya", city: "Bangalore", predicted: 120, confidence: 79, wastage: 5.2 },
  { sku: "Papaya", city: "Hyderabad", predicted: 95, confidence: 76, wastage: 5.8 },
  { sku: "Guava", city: "Mumbai", predicted: 140, confidence: 87, wastage: 3.2 },
  { sku: "Guava", city: "Delhi", predicted: 120, confidence: 83, wastage: 3.9 },
  { sku: "Guava", city: "Bangalore", predicted: 90, confidence: 80, wastage: 4.6 },
  { sku: "Guava", city: "Hyderabad", predicted: 75, confidence: 77, wastage: 5.3 },
];

// ============================================================
// Seasonality Heatmap (day of week × 4 weeks)
// ============================================================
export const seasonalityData = [
  { day: "Mon", week1: 410, week2: 395, week3: 430, week4: 445 },
  { day: "Tue", week1: 380, week2: 370, week3: 400, week4: 415 },
  { day: "Wed", week1: 360, week2: 355, week3: 375, week4: 390 },
  { day: "Thu", week1: 390, week2: 385, week3: 410, week4: 420 },
  { day: "Fri", week1: 450, week2: 440, week3: 470, week4: 480 },
  { day: "Sat", week1: 520, week2: 510, week3: 540, week4: 555 },
  { day: "Sun", week1: 480, week2: 470, week3: 500, week4: 515 },
];

// ============================================================
// Retailers
// ============================================================
export interface Retailer {
  id: string;
  name: string;
  city: City;
  shopType: string;
  score: number;
  capacity: number;
  riskScore: number;
  tier: "Priority" | "Secondary" | "Low Value";
  avgDailyPurchase: number;
  paymentDays: number;
  creditScore: number;
  metrics: { label: string; value: number }[];
}

export const retailers: Retailer[] = [
  { id: "R001", name: "Fresh Mart Central", city: "Mumbai", shopType: "Supermarket", score: 94, capacity: 280, riskScore: 8, tier: "Priority", avgDailyPurchase: 245, paymentDays: 7, creditScore: 92, metrics: [{ label: "Volume", value: 92 }, { label: "Payment", value: 95 }, { label: "Consistency", value: 90 }, { label: "Growth", value: 88 }, { label: "Location", value: 96 }] },
  { id: "R002", name: "Green Basket", city: "Delhi", shopType: "Supermarket", score: 91, capacity: 240, riskScore: 12, tier: "Priority", avgDailyPurchase: 210, paymentDays: 10, creditScore: 88, metrics: [{ label: "Volume", value: 88 }, { label: "Payment", value: 85 }, { label: "Consistency", value: 93 }, { label: "Growth", value: 92 }, { label: "Location", value: 90 }] },
  { id: "R003", name: "Nature's Choice", city: "Bangalore", shopType: "Organic Store", score: 88, capacity: 180, riskScore: 15, tier: "Priority", avgDailyPurchase: 165, paymentDays: 14, creditScore: 85, metrics: [{ label: "Volume", value: 78 }, { label: "Payment", value: 82 }, { label: "Consistency", value: 92 }, { label: "Growth", value: 95 }, { label: "Location", value: 88 }] },
  { id: "R004", name: "Daily Fresh Hub", city: "Mumbai", shopType: "Wholesale", score: 86, capacity: 350, riskScore: 18, tier: "Priority", avgDailyPurchase: 320, paymentDays: 15, creditScore: 82, metrics: [{ label: "Volume", value: 96 }, { label: "Payment", value: 78 }, { label: "Consistency", value: 85 }, { label: "Growth", value: 80 }, { label: "Location", value: 84 }] },
  { id: "R005", name: "Fruit Palace", city: "Hyderabad", shopType: "Retail Chain", score: 84, capacity: 200, riskScore: 20, tier: "Priority", avgDailyPurchase: 185, paymentDays: 12, creditScore: 80, metrics: [{ label: "Volume", value: 82 }, { label: "Payment", value: 84 }, { label: "Consistency", value: 86 }, { label: "Growth", value: 78 }, { label: "Location", value: 82 }] },
  { id: "R006", name: "Metro Fruits", city: "Delhi", shopType: "Supermarket", score: 79, capacity: 190, riskScore: 25, tier: "Secondary", avgDailyPurchase: 160, paymentDays: 18, creditScore: 76, metrics: [{ label: "Volume", value: 76 }, { label: "Payment", value: 72 }, { label: "Consistency", value: 80 }, { label: "Growth", value: 82 }, { label: "Location", value: 78 }] },
  { id: "R007", name: "Veggie World", city: "Bangalore", shopType: "Kirana", score: 75, capacity: 120, riskScore: 28, tier: "Secondary", avgDailyPurchase: 95, paymentDays: 20, creditScore: 72, metrics: [{ label: "Volume", value: 68 }, { label: "Payment", value: 70 }, { label: "Consistency", value: 78 }, { label: "Growth", value: 76 }, { label: "Location", value: 74 }] },
  { id: "R008", name: "Quick Mart", city: "Mumbai", shopType: "Convenience", score: 72, capacity: 100, riskScore: 30, tier: "Secondary", avgDailyPurchase: 85, paymentDays: 21, creditScore: 70, metrics: [{ label: "Volume", value: 65 }, { label: "Payment", value: 68 }, { label: "Consistency", value: 75 }, { label: "Growth", value: 72 }, { label: "Location", value: 80 }] },
  { id: "R009", name: "South Fresh", city: "Hyderabad", shopType: "Wholesale", score: 70, capacity: 260, riskScore: 32, tier: "Secondary", avgDailyPurchase: 220, paymentDays: 25, creditScore: 65, metrics: [{ label: "Volume", value: 88 }, { label: "Payment", value: 58 }, { label: "Consistency", value: 70 }, { label: "Growth", value: 68 }, { label: "Location", value: 66 }] },
  { id: "R010", name: "Farm Direct", city: "Delhi", shopType: "Organic Store", score: 68, capacity: 140, riskScore: 35, tier: "Secondary", avgDailyPurchase: 110, paymentDays: 22, creditScore: 68, metrics: [{ label: "Volume", value: 70 }, { label: "Payment", value: 65 }, { label: "Consistency", value: 66 }, { label: "Growth", value: 74 }, { label: "Location", value: 72 }] },
  { id: "R011", name: "Corner Fruits", city: "Mumbai", shopType: "Kirana", score: 55, capacity: 60, riskScore: 45, tier: "Low Value", avgDailyPurchase: 42, paymentDays: 30, creditScore: 55, metrics: [{ label: "Volume", value: 45 }, { label: "Payment", value: 50 }, { label: "Consistency", value: 58 }, { label: "Growth", value: 52 }, { label: "Location", value: 60 }] },
  { id: "R012", name: "Lucky Store", city: "Hyderabad", shopType: "Kirana", score: 48, capacity: 50, riskScore: 52, tier: "Low Value", avgDailyPurchase: 35, paymentDays: 35, creditScore: 48, metrics: [{ label: "Volume", value: 40 }, { label: "Payment", value: 42 }, { label: "Consistency", value: 50 }, { label: "Growth", value: 48 }, { label: "Location", value: 55 }] },
  { id: "R013", name: "Old City Fruits", city: "Hyderabad", shopType: "Street Vendor", score: 42, capacity: 40, riskScore: 58, tier: "Low Value", avgDailyPurchase: 28, paymentDays: 40, creditScore: 42, metrics: [{ label: "Volume", value: 35 }, { label: "Payment", value: 35 }, { label: "Consistency", value: 45 }, { label: "Growth", value: 40 }, { label: "Location", value: 50 }] },
  { id: "R014", name: "Shanti Provision", city: "Bangalore", shopType: "Kirana", score: 38, capacity: 35, riskScore: 62, tier: "Low Value", avgDailyPurchase: 22, paymentDays: 45, creditScore: 38, metrics: [{ label: "Volume", value: 30 }, { label: "Payment", value: 30 }, { label: "Consistency", value: 40 }, { label: "Growth", value: 35 }, { label: "Location", value: 45 }] },
];

// ============================================================
// Vendors
// ============================================================
export interface Vendor {
  id: string;
  name: string;
  location: string;
  reliability: number;
  capacity: number;
  utilized: number;
  paymentSpeed: number;
  defaultRate: number;
}

export const vendors: Vendor[] = [
  { id: "V001", name: "Agri Fresh Co.", location: "Nashik", reliability: 96, capacity: 2000, utilized: 1720, paymentSpeed: 5, defaultRate: 1.2 },
  { id: "V002", name: "Green Valley Farms", location: "Ratnagiri", reliability: 93, capacity: 1500, utilized: 1280, paymentSpeed: 7, defaultRate: 1.8 },
  { id: "V003", name: "Deccan Produce", location: "Pune", reliability: 90, capacity: 1800, utilized: 1440, paymentSpeed: 8, defaultRate: 2.1 },
  { id: "V004", name: "Southern Harvest", location: "Mysore", reliability: 88, capacity: 1200, utilized: 960, paymentSpeed: 10, defaultRate: 2.5 },
  { id: "V005", name: "Indo Farm Supply", location: "Nagpur", reliability: 85, capacity: 1600, utilized: 1120, paymentSpeed: 12, defaultRate: 3.0 },
  { id: "V006", name: "Coastal Agri", location: "Goa", reliability: 82, capacity: 900, utilized: 680, paymentSpeed: 14, defaultRate: 3.5 },
  { id: "V007", name: "Hill Fresh", location: "Shimla", reliability: 78, capacity: 800, utilized: 520, paymentSpeed: 15, defaultRate: 4.2 },
  { id: "V008", name: "Eastern Growers", location: "Kolkata", reliability: 75, capacity: 1100, utilized: 660, paymentSpeed: 18, defaultRate: 5.0 },
];

// ============================================================
// Vendor Allocation (Today)
// ============================================================
export const vendorAllocations = [
  { vendor: "Agri Fresh Co.", sku: "Banana", city: "Mumbai", qty: 420, sellThrough: 95 },
  { vendor: "Agri Fresh Co.", sku: "Apple", city: "Mumbai", qty: 280, sellThrough: 92 },
  { vendor: "Green Valley Farms", sku: "Mango", city: "Mumbai", qty: 200, sellThrough: 88 },
  { vendor: "Green Valley Farms", sku: "Banana", city: "Delhi", qty: 350, sellThrough: 91 },
  { vendor: "Deccan Produce", sku: "Apple", city: "Delhi", qty: 300, sellThrough: 89 },
  { vendor: "Deccan Produce", sku: "Papaya", city: "Mumbai", qty: 150, sellThrough: 86 },
  { vendor: "Southern Harvest", sku: "Banana", city: "Bangalore", qty: 220, sellThrough: 90 },
  { vendor: "Southern Harvest", sku: "Guava", city: "Bangalore", qty: 120, sellThrough: 85 },
  { vendor: "Indo Farm Supply", sku: "Mango", city: "Delhi", qty: 180, sellThrough: 82 },
  { vendor: "Indo Farm Supply", sku: "Apple", city: "Hyderabad", qty: 160, sellThrough: 80 },
  { vendor: "Coastal Agri", sku: "Papaya", city: "Bangalore", qty: 100, sellThrough: 84 },
  { vendor: "Coastal Agri", sku: "Guava", city: "Hyderabad", qty: 80, sellThrough: 78 },
  { vendor: "Hill Fresh", sku: "Apple", city: "Bangalore", qty: 140, sellThrough: 87 },
  { vendor: "Eastern Growers", sku: "Banana", city: "Hyderabad", qty: 190, sellThrough: 83 },
];

// Allocation by vendor (for stacked bar)
export const vendorSkuAllocation = vendors.map((v) => {
  const allocs = vendorAllocations.filter((a) => a.vendor === v.name);
  return {
    vendor: v.name.split(" ")[0],
    Banana: allocs.filter((a) => a.sku === "Banana").reduce((s, a) => s + a.qty, 0),
    Apple: allocs.filter((a) => a.sku === "Apple").reduce((s, a) => s + a.qty, 0),
    Mango: allocs.filter((a) => a.sku === "Mango").reduce((s, a) => s + a.qty, 0),
    Papaya: allocs.filter((a) => a.sku === "Papaya").reduce((s, a) => s + a.qty, 0),
    Guava: allocs.filter((a) => a.sku === "Guava").reduce((s, a) => s + a.qty, 0),
  };
});

// ============================================================
// Risk Alerts
// ============================================================
export interface RiskAlert {
  id: string;
  type: "Critical" | "Warning" | "Info";
  title: string;
  description: string;
  route: string;
  impact: string;
  time: string;
}

export const riskAlerts: RiskAlert[] = [
  { id: "A001", type: "Critical", title: "Heavy Rainfall — Nashik", description: "150mm rainfall expected in next 48hrs. Banana and grape supply from Nashik likely disrupted.", route: "Nashik → Mumbai", impact: "Banana supply -40%", time: "2 hours ago" },
  { id: "A002", type: "Critical", title: "Highway Blockage — NH48", description: "Truck overturned near Pune bypass. Route clearance expected in 12hrs.", route: "Pune → Mumbai", impact: "All SKU delay 12-18hrs", time: "4 hours ago" },
  { id: "A003", type: "Warning", title: "Mandi Price Spike — Delhi", description: "Apple prices up 22% at Azadpur mandi due to reduced Kashmir arrivals.", route: "Kashmir → Delhi", impact: "Apple cost +22%", time: "6 hours ago" },
  { id: "A004", type: "Warning", title: "Vendor Reliability Drop — Eastern Growers", description: "3 consecutive delayed shipments. Reliability score dropped to 75.", route: "Kolkata → Hyderabad", impact: "Delivery risk HIGH", time: "1 day ago" },
  { id: "A005", type: "Warning", title: "Temperature Surge — Hyderabad", description: "42°C expected this week. Shelf life of papaya and mango reduced by 30%.", route: "Local — Hyderabad", impact: "Wastage risk +30%", time: "1 day ago" },
  { id: "A006", type: "Info", title: "Festival Demand — Upcoming", description: "Navratri starts in 5 days. Historical data shows 35% demand surge for bananas.", route: "All routes", impact: "Demand +35%", time: "2 days ago" },
  { id: "A007", type: "Info", title: "New Vendor Onboarded", description: "Hill Fresh (Shimla) added to apple supply chain. First shipment scheduled.", route: "Shimla → Delhi", impact: "Apple supply +10%", time: "2 days ago" },
  { id: "A008", type: "Info", title: "Mango Season Approaching", description: "Alphonso season starts in 3 weeks. Pre-booking window open with Ratnagiri vendors.", route: "Ratnagiri → All", impact: "Mango availability", time: "3 days ago" },
];

// Risk routes table
export const riskRoutes = [
  { route: "Nashik → Mumbai", delayProb: 78, priceImpact: "+15%", riskLevel: "Critical" as const },
  { route: "Pune → Mumbai", delayProb: 65, priceImpact: "+8%", riskLevel: "Critical" as const },
  { route: "Kashmir → Delhi", delayProb: 45, priceImpact: "+22%", riskLevel: "Warning" as const },
  { route: "Kolkata → Hyderabad", delayProb: 40, priceImpact: "+5%", riskLevel: "Warning" as const },
  { route: "Shimla → Delhi", delayProb: 20, priceImpact: "+3%", riskLevel: "Info" as const },
  { route: "Mysore → Bangalore", delayProb: 12, priceImpact: "+1%", riskLevel: "Info" as const },
];

// Weather per city
export const cityWeather = [
  { city: "Mumbai", temp: 32, rain: 45, humidity: 82, alert: "Rain likely", severity: "Warning" as const },
  { city: "Delhi", temp: 38, rain: 0, humidity: 35, alert: "Clear skies", severity: "Info" as const },
  { city: "Bangalore", temp: 28, rain: 12, humidity: 65, alert: "Light showers", severity: "Info" as const },
  { city: "Hyderabad", temp: 42, rain: 0, humidity: 28, alert: "Heat wave", severity: "Warning" as const },
];

// Risk timeline (last 7 days)
export const riskTimeline = [
  { day: formatDate(daysAgo(6)), critical: 1, warning: 2, info: 3 },
  { day: formatDate(daysAgo(5)), critical: 0, warning: 3, info: 2 },
  { day: formatDate(daysAgo(4)), critical: 2, warning: 1, info: 4 },
  { day: formatDate(daysAgo(3)), critical: 1, warning: 2, info: 2 },
  { day: formatDate(daysAgo(2)), critical: 0, warning: 4, info: 1 },
  { day: formatDate(daysAgo(1)), critical: 1, warning: 1, info: 3 },
  { day: formatDate(daysAgo(0)), critical: 2, warning: 2, info: 3 },
];

// ============================================================
// Procurement Recommendations (Today)
// ============================================================
export type ProcAction = "Buy More" | "Buy Less" | "Hold";

export interface ProcurementRec {
  sku: SKU;
  city: City;
  procureQty: number;
  buffer: number;
  vendorSplit: string;
  priceChange: number;
  confidence: number;
  riskFlag: boolean;
  action: ProcAction;
}

export const procurementRecs: ProcurementRec[] = [
  { sku: "Banana", city: "Mumbai", procureQty: 540, buffer: 55, vendorSplit: "Agri Fresh 60% / Deccan 40%", priceChange: +2.5, confidence: 91, riskFlag: true, action: "Buy More" },
  { sku: "Banana", city: "Delhi", procureQty: 480, buffer: 40, vendorSplit: "Green Valley 70% / Indo Farm 30%", priceChange: 0, confidence: 88, riskFlag: false, action: "Hold" },
  { sku: "Banana", city: "Bangalore", procureQty: 310, buffer: 30, vendorSplit: "Southern Harvest 100%", priceChange: -1.0, confidence: 85, riskFlag: false, action: "Buy Less" },
  { sku: "Banana", city: "Hyderabad", procureQty: 220, buffer: 25, vendorSplit: "Eastern Growers 100%", priceChange: +1.5, confidence: 82, riskFlag: true, action: "Hold" },
  { sku: "Apple", city: "Mumbai", procureQty: 400, buffer: 45, vendorSplit: "Agri Fresh 50% / Hill Fresh 50%", priceChange: +5.0, confidence: 89, riskFlag: true, action: "Buy More" },
  { sku: "Apple", city: "Delhi", procureQty: 420, buffer: 50, vendorSplit: "Green Valley 40% / Indo Farm 60%", priceChange: +8.0, confidence: 86, riskFlag: true, action: "Buy More" },
  { sku: "Apple", city: "Bangalore", procureQty: 260, buffer: 25, vendorSplit: "Hill Fresh 60% / Southern 40%", priceChange: +3.0, confidence: 84, riskFlag: false, action: "Hold" },
  { sku: "Apple", city: "Hyderabad", procureQty: 180, buffer: 20, vendorSplit: "Indo Farm 100%", priceChange: +4.0, confidence: 80, riskFlag: false, action: "Hold" },
  { sku: "Mango", city: "Mumbai", procureQty: 300, buffer: 60, vendorSplit: "Green Valley 100%", priceChange: -3.0, confidence: 78, riskFlag: false, action: "Buy Less" },
  { sku: "Mango", city: "Delhi", procureQty: 250, buffer: 45, vendorSplit: "Indo Farm 100%", priceChange: -2.0, confidence: 75, riskFlag: false, action: "Buy Less" },
  { sku: "Papaya", city: "Mumbai", procureQty: 190, buffer: 20, vendorSplit: "Deccan 100%", priceChange: 0, confidence: 84, riskFlag: false, action: "Hold" },
  { sku: "Papaya", city: "Bangalore", procureQty: 120, buffer: 15, vendorSplit: "Coastal Agri 100%", priceChange: +1.0, confidence: 79, riskFlag: false, action: "Hold" },
  { sku: "Guava", city: "Mumbai", procureQty: 150, buffer: 15, vendorSplit: "Agri Fresh 100%", priceChange: 0, confidence: 87, riskFlag: false, action: "Hold" },
  { sku: "Guava", city: "Bangalore", procureQty: 100, buffer: 10, vendorSplit: "Southern Harvest 100%", priceChange: -1.5, confidence: 82, riskFlag: false, action: "Buy Less" },
  { sku: "Guava", city: "Hyderabad", procureQty: 80, buffer: 10, vendorSplit: "Coastal Agri 100%", priceChange: +2.0, confidence: 78, riskFlag: true, action: "Buy More" },
];

// Cost projection (last 7 days + 7 days forecast)
export const costProjection = [
  { day: formatDate(daysAgo(6)), actual: 7.2, projected: null },
  { day: formatDate(daysAgo(5)), actual: 7.5, projected: null },
  { day: formatDate(daysAgo(4)), actual: 7.8, projected: null },
  { day: formatDate(daysAgo(3)), actual: 7.4, projected: null },
  { day: formatDate(daysAgo(2)), actual: 8.1, projected: null },
  { day: formatDate(daysAgo(1)), actual: 8.4, projected: null },
  { day: formatDate(daysAgo(0)), actual: 8.4, projected: 8.4 },
  { day: "Day +1", actual: null, projected: 8.6 },
  { day: "Day +2", actual: null, projected: 8.8 },
  { day: "Day +3", actual: null, projected: 8.5 },
  { day: "Day +4", actual: null, projected: 8.3 },
  { day: "Day +5", actual: null, projected: 8.1 },
  { day: "Day +6", actual: null, projected: 7.9 },
  { day: "Day +7", actual: null, projected: 7.7 },
];

// AI vs Actual comparison
export const aiVsActual = [
  { sku: "Banana", aiRecommended: 1550, actualOrdered: 1620, aiWastage: 3.2, actualWastage: 5.1 },
  { sku: "Apple", aiRecommended: 1260, actualOrdered: 1400, aiWastage: 2.8, actualWastage: 6.3 },
  { sku: "Mango", aiRecommended: 870, actualOrdered: 950, aiWastage: 5.5, actualWastage: 9.2 },
  { sku: "Papaya", aiRecommended: 545, actualOrdered: 600, aiWastage: 4.1, actualWastage: 7.0 },
  { sku: "Guava", aiRecommended: 425, actualOrdered: 480, aiWastage: 3.5, actualWastage: 5.8 },
];
