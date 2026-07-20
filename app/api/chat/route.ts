import { streamText, UIMessage, convertToModelMessages, tool, stepCountIs } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { evaluateExpression, describe, bivariate, growthMetrics, percentile } from "@/lib/stats";
import {
  OVERVIEW_STATS,
  listSkus,
  getSalesSeries,
  getTopRetailers,
  getRetailerProfiles,
  getRetailerMetricArray,
  getCustomerBreakdown,
  getFarmerSupply,
  getSkuCatalog,
} from "@/lib/assistant-data";

export const maxDuration = 60;

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
const MODEL = process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4.5";

const SYSTEM_PROMPT = `You are the F3 Intelligence Analyst — the AI assistant inside PhalNetra, F3's fresh-produce intelligence dashboard for Delhi NCR.

You have tools for exact math, full statistical analysis, and live access to the company's real datasets: monthly/weekly sales (actual + predicted), 531 retailer profiles, top retailers, farmer/vendor supply, SKU catalog, plus live mandi prices and source-region weather.

Rules:
- NEVER do arithmetic or statistics in your head — always use the calculate or statistics tools. Chain tools: fetch data first, then feed the numbers into the statistics tool.
- Quantities are in kg unless stated otherwise. Currency is INR (₹).
- Be concise and analytical. Lead with the answer, then show the key numbers. Use markdown tables for comparisons.
- If a question is ambiguous, pick the most sensible interpretation and state it.
- Overview stats: ${JSON.stringify(OVERVIEW_STATS)}. Available SKUs: ${listSkus().join(", ")}.`;

const numberArray = z.array(z.number()).min(1).max(2000);

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const origin = new URL(req.url).origin;

  const result = streamText({
    model: openrouter(MODEL),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(12),
    tools: {
      calculate: tool({
        description:
          "Evaluate a math expression exactly. Supports + - * / % ^ ! parentheses, constants pi/e, and functions: sqrt, cbrt, abs, ln, log(base10), log2, exp, sin, cos, tan, asin, acos, atan, floor, ceil, round, factorial, min, max, pow, ncr(n,r), npr(n,r), mod. Use for ALL arithmetic.",
        inputSchema: z.object({
          expression: z.string().describe('e.g. "(4500*1.18)/12" or "sqrt(2)*ncr(10,3)"'),
        }),
        execute: async ({ expression }) => {
          try {
            return { expression, result: evaluateExpression(expression) };
          } catch (e) {
            return { expression, error: (e as Error).message };
          }
        },
      }),

      statistics: tool({
        description:
          "Full descriptive statistics for a list of numbers: mean, median, mode, quartiles, percentiles, variance, std dev, CV, skewness, kurtosis. Pass optional y array (same length) for correlation, covariance and linear regression. Pass asTimeSeries=true for growth metrics (total change %, CAGR, volatility).",
        inputSchema: z.object({
          data: numberArray.describe("primary dataset (x)"),
          y: numberArray.optional().describe("optional paired dataset for correlation/regression"),
          percentileOf: z.number().min(0).max(100).optional().describe("also compute this percentile of data"),
          asTimeSeries: z.boolean().optional().describe("treat data as an ordered series and compute growth metrics"),
        }),
        execute: async ({ data, y, percentileOf, asTimeSeries }) => {
          try {
            const out: Record<string, unknown> = { descriptive: describe(data) };
            if (y) out.bivariate = bivariate(data, y);
            if (percentileOf !== undefined) {
              out[`p${percentileOf}`] = percentile([...data].sort((a, b) => a - b), percentileOf);
            }
            if (asTimeSeries) out.growth = growthMetrics(data);
            return out;
          } catch (e) {
            return { error: (e as Error).message };
          }
        },
      }),

      getSalesData: tool({
        description:
          "Get the sales quantity series from the dashboard. granularity: 'monthly' (40 months, all SKUs combined), 'weekly' (127 weeks, actuals) or 'predicted' (48 forecast weeks). For weekly/predicted you can filter to one SKU. Feed the returned qty values into the statistics tool for analysis.",
        inputSchema: z.object({
          granularity: z.enum(["monthly", "weekly", "predicted"]),
          sku: z.string().optional().describe("SKU name, e.g. ANAR, WATERMELON (weekly/predicted only)"),
        }),
        execute: async ({ granularity, sku }) => {
          try {
            return getSalesSeries({ granularity, sku });
          } catch (e) {
            return { error: (e as Error).message };
          }
        },
      }),

      getRetailers: tool({
        description:
          "Query retailers. mode 'top' = top retailers by volume with their top SKUs. mode 'profiles' = 531 scored profiles (score, credit, payment days, avg daily kg), filterable by zone (GURUGRAM, SOUTH DELHI, EAST DELHI, NOIDA, GREATER NOIDA, GHAZIABAD, IMT) and tier (Priority, Growth, Standard, Watch). mode 'metricArray' returns the raw metric values across retailers — feed those into the statistics tool.",
        inputSchema: z.object({
          mode: z.enum(["top", "profiles", "metricArray"]),
          zone: z.string().optional(),
          tier: z.string().optional(),
          metric: z.enum(["score", "paymentDays", "creditScore", "avgDailyKg"]).optional().describe("required for metricArray"),
          limit: z.number().min(1).max(50).default(10),
        }),
        execute: async ({ mode, zone, tier, metric, limit }) => {
          try {
            if (mode === "top") return { top: getTopRetailers(limit) };
            if (mode === "metricArray") {
              if (!metric) return { error: "metric is required for metricArray mode" };
              const values = getRetailerMetricArray(metric, zone);
              return { metric, zone: zone ?? "ALL", count: values.length, values };
            }
            return getRetailerProfiles({ zone, tier, limit });
          } catch (e) {
            return { error: (e as Error).message };
          }
        },
      }),

      getCustomerBreakdown: tool({
        description: "Count of the 531 retail customers grouped by zone or by status (active/inactive).",
        inputSchema: z.object({ groupBy: z.enum(["zone", "status"]) }),
        execute: async ({ groupBy }) => getCustomerBreakdown(groupBy),
      }),

      getFarmerSupply: tool({
        description:
          "Farmer/vendor supply data (weekly kg by vendor, item and month 1-12). Filter by item and/or month; returns monthly totals and top vendors.",
        inputSchema: z.object({
          item: z.string().optional().describe("e.g. ANAR, APPLE BER"),
          month: z.number().min(1).max(12).optional(),
          topVendors: z.number().min(1).max(30).default(10),
        }),
        execute: async ({ item, month, topVendors }) => {
          try {
            return getFarmerSupply({ item, month, topVendors });
          } catch (e) {
            return { error: (e as Error).message };
          }
        },
      }),

      getSkuCatalog: tool({
        description: "SKU catalog: 33 SKUs with source regions, quality grades, and all-time volumes.",
        inputSchema: z.object({}),
        execute: async () => getSkuCatalog(),
      }),

      getMandiPrices: tool({
        description: "Current mandi (wholesale market) prices at Azadpur Delhi in ₹/quintal, with arrivals and price change %.",
        inputSchema: z.object({}),
        execute: async () => {
          const res = await fetch(`${origin}/api/mandi`);
          return await res.json();
        },
      }),

      getWeather: tool({
        description:
          "Live weather for the 6 supply-chain cities (Delhi NCR hub + source regions Shimla, Nashik, Nagpur, Lucknow, Jaipur) with alerts.",
        inputSchema: z.object({}),
        execute: async () => {
          const res = await fetch(`${origin}/api/weather`);
          return await res.json();
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
