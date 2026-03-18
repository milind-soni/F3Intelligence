"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { IndiaFruitMap, type NewsItem } from "@/components/india-fruit-map";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ExternalLink,
  CloudRain,
  Thermometer,
  Wind,
  Droplets,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Newspaper,
  BarChart3,
  MapPin,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface MandiItem {
  commodity: string;
  emoji: string;
  mandi: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  change: number;
  sourceRegion: string;
  arrivals: string;
  riskScore: number;
}

interface WeatherCity {
  city: string;
  role: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  condition: string;
  windKmph: number;
  maxTemp: number;
  minTemp: number;
  rainMm: number;
  alert: { label: string; level: "ok" | "warn" | "critical" } | null;
}

// ─── Static SKU risk scores ─────────────────────────────────────────────────

const SKU_HEALTH = [
  { sku: "KASHMIR APPLE", emoji: "🍎", score: 72, trend: "up" as const, risk: "Cold wave advisory in J&K source regions", region: "Himachal / J&K" },
  { sku: "WATERMELON", emoji: "🍉", score: 84, trend: "up" as const, risk: "Heat wave stress in UP growing zones", region: "Uttar Pradesh" },
  { sku: "GRAPES", emoji: "🍇", score: 62, trend: "down" as const, risk: "Unseasonal rain risk near Nashik", region: "Nashik, Maharashtra" },
  { sku: "KINNAUR APPLE", emoji: "🍎", score: 68, trend: "up" as const, risk: "Elevated prices — low cold storage stock", region: "Kinnaur, HP" },
  { sku: "KINNOW", emoji: "🍊", score: 58, trend: "stable" as const, risk: "Punjab transport disruption (partial)", region: "Punjab" },
  { sku: "ANAR", emoji: "🔴", score: 45, trend: "down" as const, risk: "Supply stable, firm prices from Solapur", region: "Solapur, MH" },
  { sku: "ORANGE", emoji: "🟠", score: 42, trend: "stable" as const, risk: "Good Nagpur harvest, ample arrivals", region: "Nagpur, MH" },
  { sku: "MAUSAMI", emoji: "🍋", score: 38, trend: "stable" as const, risk: "Normal season, steady arrivals", region: "Nagpur, MH" },
  { sku: "SAFEDA MANGO", emoji: "🥭", score: 35, trend: "up" as const, risk: "Early season arrivals — short supply", region: "Malihabad, UP" },
  { sku: "VNR GUAVA", emoji: "💚", score: 29, trend: "stable" as const, risk: "Steady supply from Prayagraj", region: "Prayagraj, UP" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 70) return "#ef4444";
  if (score >= 50) return "#f59e0b";
  return "#22c55e";
}

function getScoreBg(score: number): string {
  if (score >= 70) return "bg-red-50 border-red-200";
  if (score >= 50) return "bg-amber-50 border-amber-200";
  return "bg-green-50 border-green-200";
}

function getScoreLabel(score: number): string {
  if (score >= 70) return "HIGH";
  if (score >= 50) return "MED";
  return "OK";
}

function getCategoryStyle(cat: string): { bg: string; text: string; dot: string } {
  switch (cat) {
    case "Weather": return { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "#3b82f6" };
    case "Price": return { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "#f59e0b" };
    case "Supply": return { bg: "bg-green-50 border-green-200", text: "text-green-700", dot: "#22c55e" };
    case "Transport": return { bg: "bg-red-50 border-red-200", text: "text-red-700", dot: "#ef4444" };
    default: return { bg: "bg-slate-50 border-slate-200", text: "text-slate-700", dot: "#94a3b8" };
  }
}

function getWeatherIcon(condition: string, temp: number): string {
  const c = condition.toLowerCase();
  if (temp <= 5) return "❄️";
  if (/thunderstorm|storm/.test(c)) return "⛈️";
  if (/heavy rain|torrential/.test(c)) return "🌧️";
  if (/rain|drizzle/.test(c)) return "🌦️";
  if (/fog|mist/.test(c)) return "🌫️";
  if (/cloud/.test(c)) return "⛅";
  if (temp >= 38) return "🌡️";
  return "☀️";
}

function fmt(n: number): string {
  return n.toLocaleString("en-IN");
}

// ─── Ticker ───────────────────────────────────────────────────────────────────

function NewsTicker({ items }: { items: NewsItem[] }) {
  const ticker = items.map((n) => n.title).join("  ·  ");
  return (
    <div className="flex items-center overflow-hidden bg-slate-900 text-white rounded-xl border border-slate-800 h-9 mb-4 flex-shrink-0">
      <div className="flex items-center gap-2 px-3 border-r border-slate-700 h-full bg-red-600 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Live Intel</span>
      </div>
      <div className="flex-1 overflow-hidden relative">
        {ticker ? (
          <div
            className="whitespace-nowrap text-[11px] font-medium text-slate-200 absolute"
            style={{ animation: "marquee 60s linear infinite", paddingLeft: "100%" }}
          >
            {ticker}
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 px-4">Fetching live intelligence…</div>
        )}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}

// ─── SKU Health Panel ────────────────────────────────────────────────────────

function SkuHealthPanel() {
  const overallScore = Math.round(SKU_HEALTH.reduce((s, i) => s + i.score, 0) / SKU_HEALTH.length);

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60 bg-slate-50/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">SKU Supply Risk</span>
        </div>
        <div
          className="text-xs font-black px-2 py-0.5 rounded-full border"
          style={{ color: getScoreColor(overallScore), borderColor: getScoreColor(overallScore) + "40", background: getScoreColor(overallScore) + "12" }}
        >
          {overallScore} Composite
        </div>
      </div>
      <div className="p-2 space-y-0.5 max-h-[340px] overflow-y-auto">
        {SKU_HEALTH.map((item) => {
          const color = getScoreColor(item.score);
          return (
            <div
              key={item.sku}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-default"
            >
              <span className="text-base w-6 text-center shrink-0">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-bold text-foreground truncate">{item.sku}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {item.trend === "up" ? (
                      <TrendingUp className="h-3 w-3" style={{ color }} />
                    ) : item.trend === "down" ? (
                      <TrendingDown className="h-3 w-3 text-green-500" />
                    ) : (
                      <Minus className="h-3 w-3 text-slate-400" />
                    )}
                    <span className="text-[11px] font-black" style={{ color }}>{item.score}</span>
                  </div>
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${item.score}%`, background: color }}
                  />
                </div>
                <div className="text-[9px] text-slate-400 truncate">{item.risk}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Mandi Prices Panel ───────────────────────────────────────────────────────

function MandiPanel({ data }: { data: MandiItem[] }) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60 bg-slate-50/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Azadpur Mandi Prices</span>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Agmarknet</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left text-[9px] font-black uppercase tracking-wider text-slate-400 px-3 py-2">SKU</th>
              <th className="text-right text-[9px] font-black uppercase tracking-wider text-slate-400 px-3 py-2">Modal ₹/q</th>
              <th className="text-right text-[9px] font-black uppercase tracking-wider text-slate-400 px-3 py-2">Δ Week</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr key={item.commodity} className={`border-b border-border/20 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/30"}`}>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{item.emoji}</span>
                    <div>
                      <div className="text-[10px] font-bold text-foreground leading-none">{item.commodity}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{item.arrivals}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-right">
                  <span className="text-[11px] font-black text-foreground">₹{fmt(item.modalPrice)}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${item.change > 0 ? "text-red-600" : "text-green-600"}`}>
                    {item.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(item.change).toFixed(1)}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── News Feed Panel ─────────────────────────────────────────────────────────

function NewsFeed({ news, loading }: { news: NewsItem[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden flex-1">
        <div className="px-4 py-3 border-b border-border/60 bg-slate-50/80 flex items-center gap-2">
          <Newspaper className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Live Intelligence</span>
        </div>
        <div className="p-3 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-2.5 bg-slate-100 rounded w-3/4 mb-2" />
              <div className="h-2 bg-slate-100 rounded w-full mb-1" />
              <div className="h-2 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden flex-1 min-h-0">
      <div className="px-4 py-3 border-b border-border/60 bg-slate-50/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Live Intelligence</span>
        </div>
        <span className="text-[9px] font-bold text-slate-400">{news.length} articles</span>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: "420px" }}>
        {news.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">No articles found</div>
        ) : (
          <div className="divide-y divide-border/30">
            {news.map((item) => {
              const style = getCategoryStyle(item.category);
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
                >
                  <div
                    className="w-1 rounded-full shrink-0 mt-1"
                    style={{ background: style.dot, minHeight: "32px" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${style.bg} ${style.text}`}
                      >
                        {item.category}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold truncate">{item.source}</span>
                      <span className="text-[9px] text-slate-300 ml-auto shrink-0">{item.timeAgo}</span>
                    </div>
                    <div className="text-[11px] font-bold text-foreground leading-snug mb-1 group-hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </div>
                    {item.snippet && item.snippet !== item.title && (
                      <div className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{item.snippet}</div>
                    )}
                  </div>
                  <ExternalLink className="h-3 w-3 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 mt-1" />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Weather Panel ───────────────────────────────────────────────────────────

function WeatherPanel({ cities, loading }: { cities: WeatherCity[]; loading: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60 bg-slate-50/80 flex items-center gap-2">
        <CloudRain className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Growing Region Weather</span>
      </div>
      {loading ? (
        <div className="p-3 grid grid-cols-2 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-50 rounded-lg animate-pulse border border-border/40" />
          ))}
        </div>
      ) : (
        <div className="p-3 grid grid-cols-2 gap-2">
          {cities.map((city) => {
            const icon = getWeatherIcon(city.condition, city.temp);
            const alertLevel = city.alert?.level;
            const borderCls =
              alertLevel === "critical"
                ? "border-red-200 bg-red-50/40"
                : alertLevel === "warn"
                ? "border-amber-200 bg-amber-50/40"
                : "border-border/40 bg-slate-50/30";
            return (
              <div key={city.city} className={`rounded-lg border px-3 py-2.5 transition-colors hover:bg-white ${borderCls}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black text-foreground truncate">{city.city}</span>
                  <span className="text-lg leading-none">{icon}</span>
                </div>
                <div className="flex items-end gap-1.5 mb-1">
                  <span className="text-xl font-black text-foreground leading-none">{city.temp}°</span>
                  <span className="text-[9px] text-slate-400 font-semibold mb-0.5">{city.minTemp}–{city.maxTemp}°C</span>
                </div>
                <div className="text-[9px] text-slate-400 truncate mb-1.5">{city.role}</div>
                {city.alert ? (
                  <div
                    className={`inline-flex items-center gap-1 text-[8.5px] font-bold px-1.5 py-0.5 rounded-full ${alertLevel === "critical" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                  >
                    {alertLevel === "critical" ? (
                      <AlertTriangle className="h-2.5 w-2.5" />
                    ) : (
                      <AlertCircle className="h-2.5 w-2.5" />
                    )}
                    {city.alert.label}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 text-[8.5px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                    <CheckCircle className="h-2.5 w-2.5" /> Clear
                  </div>
                )}
                <div className="flex items-center gap-3 mt-2 text-[9px] text-slate-400 font-semibold">
                  <div className="flex items-center gap-0.5"><Droplets className="h-2.5 w-2.5 text-blue-400" />{city.humidity}%</div>
                  <div className="flex items-center gap-0.5"><Wind className="h-2.5 w-2.5 text-slate-300" />{city.windKmph}km/h</div>
                  {city.rainMm > 0 && <div className="flex items-center gap-0.5"><CloudRain className="h-2.5 w-2.5 text-blue-400" />{city.rainMm}mm</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RisksPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [mandi, setMandi] = useState<MandiItem[]>([]);
  const [weather, setWeather] = useState<WeatherCity[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [mandiLoading, setMandiLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);

    await Promise.allSettled([
      fetch("/api/news")
        .then((r) => r.json())
        .then((d) => {
          setNews(d.articles ?? []);
          setNewsLoading(false);
        })
        .catch(() => setNewsLoading(false)),

      fetch("/api/weather")
        .then((r) => r.json())
        .then((d) => {
          setWeather(d.cities ?? []);
          setWeatherLoading(false);
        })
        .catch(() => setWeatherLoading(false)),

      fetch("/api/mandi")
        .then((r) => r.json())
        .then((d) => {
          setMandi(d.data ?? []);
          setMandiLoading(false);
        })
        .catch(() => setMandiLoading(false)),
    ]);

    setLastUpdated(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    if (isRefresh) setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAll();
    // Auto-refresh news every 10 minutes
    intervalRef.current = setInterval(() => fetchAll(), 10 * 60 * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAll]);

  const criticalCount = SKU_HEALTH.filter((s) => s.score >= 70).length;
  const elevatedCount = SKU_HEALTH.filter((s) => s.score >= 50 && s.score < 70).length;
  const weatherAlerts = weather.filter((w) => w.alert?.level === "critical").length;

  return (
    <div className="flex flex-col h-full" style={{ minHeight: "calc(100vh - 80px)" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Fruit Market Monitor</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[10px] font-black text-red-600 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Live
            </span>
            <span className="inline-flex items-center rounded-full bg-orange-50 border border-orange-200 px-2.5 py-0.5 text-[10px] font-bold text-orange-700 uppercase tracking-wider">
              India
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Real-time supply chain intelligence for fresh produce · Powered by Exa + IMD</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground font-semibold">Updated {lastUpdated}</span>
          )}
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stat pills */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        {[
          { label: `${criticalCount} High Risk SKUs`, cls: "bg-red-50 border-red-200 text-red-700", Icon: AlertTriangle },
          { label: `${elevatedCount} Elevated SKUs`, cls: "bg-amber-50 border-amber-200 text-amber-700", Icon: AlertCircle },
          { label: `${mandi.length} Commodities Tracked`, cls: "bg-blue-50 border-blue-200 text-blue-700", Icon: BarChart3 },
          { label: `${weatherAlerts} Weather Alerts`, cls: "bg-purple-50 border-purple-200 text-purple-700", Icon: CloudRain },
          { label: `${news.length} Intel Articles`, cls: "bg-slate-50 border-slate-200 text-slate-700", Icon: Newspaper },
        ].map(({ label, cls, Icon }) => (
          <div key={label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${cls}`}>
            <Icon className="h-3.5 w-3.5" />
            {label}
          </div>
        ))}
      </div>

      {/* Breaking ticker */}
      <NewsTicker items={news} />

      {/* Main 3-column layout */}
      <div className="flex-1 grid gap-4 min-h-0" style={{ gridTemplateColumns: "280px 1fr 320px" }}>
        {/* Left: SKU Risk + Mandi */}
        <div className="flex flex-col gap-4 overflow-y-auto min-h-0">
          <SkuHealthPanel />
          {mandiLoading ? (
            <div className="bg-white rounded-xl border border-border shadow-sm h-48 animate-pulse" />
          ) : (
            <MandiPanel data={mandi} />
          )}
        </div>

        {/* Center: India Map */}
        <div className="rounded-xl border border-border shadow-sm overflow-hidden min-h-0" style={{ minHeight: "500px" }}>
          <IndiaFruitMap news={news} />
        </div>

        {/* Right: News + Weather */}
        <div className="flex flex-col gap-4 overflow-y-auto min-h-0">
          <NewsFeed news={news} loading={newsLoading} />
          <WeatherPanel cities={weather} loading={weatherLoading} />
        </div>
      </div>
    </div>
  );
}
