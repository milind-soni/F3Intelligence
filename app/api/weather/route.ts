import { NextResponse } from "next/server";

const CITIES = [
  { name: "Delhi NCR", query: "Delhi", role: "Hub & Distribution" },
  { name: "Shimla", query: "Shimla", role: "Apple Source Region" },
  { name: "Nashik", query: "Nashik", role: "Grapes & Anar Belt" },
  { name: "Nagpur", query: "Nagpur", role: "Orange & Mausami" },
  { name: "Lucknow", query: "Lucknow", role: "UP Mango Belt" },
  { name: "Jaipur", query: "Jaipur", role: "Transit Corridor" },
];

function weatherAlert(condition: string, temp: number, rain: number): { label: string; level: "ok" | "warn" | "critical" } | null {
  const c = condition.toLowerCase();
  if (temp >= 40) return { label: "Extreme Heat", level: "critical" };
  if (temp <= 2) return { label: "Frost Risk", level: "critical" };
  if (/thunderstorm|storm/.test(c)) return { label: "Thunderstorm", level: "critical" };
  if (/heavy rain|torrential/.test(c)) return { label: "Heavy Rain", level: "warn" };
  if (temp >= 35) return { label: "High Heat", level: "warn" };
  if (/fog|mist/.test(c) && temp <= 15) return { label: "Dense Fog", level: "warn" };
  if (rain > 10) return { label: "Rain Alert", level: "warn" };
  return null;
}

export async function GET() {
  const results = await Promise.allSettled(
    CITIES.map(async (city) => {
      const res = await fetch(
        `https://wttr.in/${encodeURIComponent(city.query)}?format=j1`,
        {
          headers: { "User-Agent": "FruitMonitorIndia/1.0" },
          next: { revalidate: 1800 },
        }
      );
      const data = await res.json();
      const current = data.current_condition?.[0];
      const today = data.weather?.[0];
      const hourly = today?.hourly ?? [];
      const totalRain = hourly.reduce(
        (sum: number, h: Record<string, string>) =>
          sum + parseFloat(h.precipMM ?? "0"),
        0
      );
      const temp = parseInt(current?.temp_C ?? "20");
      const condition = current?.weatherDesc?.[0]?.value ?? "Clear";
      const rain = parseFloat(totalRain.toFixed(1));
      const alert = weatherAlert(condition, temp, rain);
      return {
        city: city.name,
        role: city.role,
        temp,
        feelsLike: parseInt(current?.FeelsLikeC ?? "0"),
        humidity: parseInt(current?.humidity ?? "0"),
        condition,
        windKmph: parseInt(current?.windspeedKmph ?? "0"),
        maxTemp: parseInt(today?.maxtempC ?? "0"),
        minTemp: parseInt(today?.mintempC ?? "0"),
        rainMm: rain,
        alert,
      };
    })
  );

  const cities = results
    .filter(
      (r): r is PromiseFulfilledResult<ReturnType<typeof weatherAlert> extends infer R ? R & object : never> =>
        r.status === "fulfilled"
    )
    .map((r) => (r as PromiseFulfilledResult<unknown>).value);

  return NextResponse.json({ cities });
}
