import { NextResponse } from "next/server";

// Cache the entire route response for 24 hours at the Next.js edge layer
export const revalidate = 86400;

const EXA_API_KEY = process.env.EXA_API_KEY!;

const QUERIES = [
  "India fresh produce fruit vegetable mandi market price supply 2026",
  "India agriculture weather crop damage disruption farmer 2026",
  "India fruit import export apple mango kinnow orange price market",
];

function categorize(text: string): string {
  const t = text.toLowerCase();
  if (/monsoon|rain|cold wave|heat wave|fog|hailstorm|cyclone|drought|weather|flood|frost/.test(t))
    return "Weather";
  if (/price|mandi|market|rate|cost|expensive|cheap|₹|rupee|wholesale|retail/.test(t))
    return "Price";
  if (/supply|shortage|crop|harvest|yield|production|farmer|vendor|arrival|seasonal/.test(t))
    return "Supply";
  if (/strike|highway|transport|truck|delay|logistics|route|toll|ban|agitation/.test(t))
    return "Transport";
  return "Market";
}

function getTimeAgo(dateStr: string): string {
  if (!dateStr) return "Recently";
  const now = Date.now();
  const pub = new Date(dateStr).getTime();
  if (isNaN(pub)) return "Recently";
  const diff = Math.floor((now - pub) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export async function GET() {
  try {
    const fetchQuery = (query: string) =>
      fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "x-api-key": EXA_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          type: "auto",
          numResults: 8,
          category: "news",
          contents: {
            highlights: { maxCharacters: 280 },
          },
        }),
        next: { revalidate: 600 },
      }).then((r) => r.json());

    const results = await Promise.allSettled(QUERIES.map(fetchQuery));

    const seen = new Set<string>();
    const articles: {
      id: string;
      title: string;
      url: string;
      source: string;
      publishedDate: string;
      timeAgo: string;
      snippet: string;
      category: string;
    }[] = [];

    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      for (const item of result.value.results ?? []) {
        if (!item.url || seen.has(item.url)) continue;
        seen.add(item.url);
        const highlight = item.highlights?.[0] ?? "";
        const snippet = (highlight || item.title).slice(0, 240);
        const category = categorize(item.title + " " + snippet);
        let source = item.url;
        try {
          source = new URL(item.url).hostname.replace(/^www\./, "");
        } catch {}
        articles.push({
          id: item.id ?? item.url,
          title: item.title ?? "Untitled",
          url: item.url,
          source,
          publishedDate: item.publishedDate ?? "",
          timeAgo: getTimeAgo(item.publishedDate),
          snippet,
          category,
        });
      }
    }

    // Sort by most recent first
    articles.sort((a, b) => {
      const ta = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
      const tb = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
      return tb - ta;
    });

    return NextResponse.json({ articles: articles.slice(0, 20) });
  } catch (err) {
    return NextResponse.json({ articles: [], error: String(err) }, { status: 500 });
  }
}
