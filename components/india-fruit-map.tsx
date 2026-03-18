"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  timeAgo: string;
  snippet: string;
  category: string;
}

interface GrowingRegion {
  id: string;
  name: string;
  state: string;
  coordinates: [number, number];
  skus: string[];
  color: string;
  riskScore: number;
  newsCount?: number;
}

const GROWING_REGIONS: GrowingRegion[] = [
  {
    id: "azadpur",
    name: "Azadpur Mandi",
    state: "Delhi",
    coordinates: [77.172, 28.696],
    skus: ["F3 Hub"],
    color: "#16a34a",
    riskScore: 0,
  },
  {
    id: "himachal",
    name: "Shimla / Kullu",
    state: "Himachal Pradesh",
    coordinates: [77.1, 31.5],
    skus: ["KASHMIR APPLE", "KINNAUR APPLE", "PEAR"],
    color: "#ef4444",
    riskScore: 72,
  },
  {
    id: "kashmir",
    name: "Kashmir Valley",
    state: "J&K",
    coordinates: [74.8, 34.1],
    skus: ["KASHMIR APPLE", "WALNUT", "CHERRY"],
    color: "#dc2626",
    riskScore: 76,
  },
  {
    id: "punjab",
    name: "Abohar / Fazilka",
    state: "Punjab",
    coordinates: [74.2, 30.1],
    skus: ["KINNOW", "ORANGE", "KINOO"],
    color: "#f97316",
    riskScore: 58,
  },
  {
    id: "up-mango",
    name: "Malihabad",
    state: "Uttar Pradesh",
    coordinates: [80.7, 26.9],
    skus: ["SAFEDA MANGO", "LITCHI", "GUAVA"],
    color: "#84cc16",
    riskScore: 35,
  },
  {
    id: "nashik",
    name: "Nashik",
    state: "Maharashtra",
    coordinates: [73.8, 19.99],
    skus: ["ANAR", "GRAPES", "ONION"],
    color: "#ec4899",
    riskScore: 62,
  },
  {
    id: "nagpur",
    name: "Nagpur",
    state: "Maharashtra",
    coordinates: [79.09, 21.15],
    skus: ["ORANGE", "MAUSAMI", "SWEET LIME"],
    color: "#f59e0b",
    riskScore: 42,
  },
  {
    id: "ratnagiri",
    name: "Ratnagiri / Devgad",
    state: "Maharashtra",
    coordinates: [73.3, 16.9],
    skus: ["ALPHONSO MANGO", "CASHEW"],
    color: "#eab308",
    riskScore: 38,
  },
  {
    id: "prayagraj",
    name: "Prayagraj",
    state: "Uttar Pradesh",
    coordinates: [81.8, 25.4],
    skus: ["VNR GUAVA", "BANANA"],
    color: "#22c55e",
    riskScore: 29,
  },
  {
    id: "karnataka",
    name: "Bagalkot",
    state: "Karnataka",
    coordinates: [75.7, 16.2],
    skus: ["ANAR", "GRAPES", "BANANA"],
    color: "#a855f7",
    riskScore: 44,
  },
];

function getRiskColor(score: number): string {
  if (score === 0) return "#16a34a";
  if (score >= 70) return "#ef4444";
  if (score >= 50) return "#f59e0b";
  return "#22c55e";
}

function getRiskLabel(score: number): string {
  if (score === 0) return "HUB";
  if (score >= 70) return "HIGH";
  if (score >= 50) return "MED";
  return "OK";
}

interface Props {
  news: NewsItem[];
  onRegionClick?: (region: GrowingRegion) => void;
}

export function IndiaFruitMap({ news, onRegionClick }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style:
        "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [82, 22.5],
      zoom: 4.2,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.current.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left"
    );

    map.current.on("load", () => {
      // Add growing region markers
      GROWING_REGIONS.forEach((region) => {
        const riskColor = getRiskColor(region.riskScore);
        const riskLabel = getRiskLabel(region.riskScore);
        const isHub = region.id === "azadpur";

        const el = document.createElement("div");
        el.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          cursor: pointer;
        `;

        const dot = document.createElement("div");

        if (isHub) {
          dot.style.cssText = `
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #16a34a;
            border: 3px solid #fff;
            box-shadow: 0 0 0 2px rgba(22,163,74,0.35), 0 2px 10px rgba(22,163,74,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 900;
            color: white;
            font-family: system-ui, sans-serif;
            transition: transform 0.15s ease;
          `;
          el.onmouseenter = () => { dot.style.transform = "scale(1.15)"; };
          el.onmouseleave = () => { dot.style.transform = "scale(1)"; };
          dot.textContent = "F3";
        } else {
          dot.style.cssText = `
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: ${riskColor}18;
            border: 2px solid ${riskColor}60;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            transition: transform 0.15s ease;
          `;
          el.onmouseenter = () => { dot.style.transform = "scale(1.12)"; };
          el.onmouseleave = () => { dot.style.transform = "scale(1)"; };

          const inner = document.createElement("div");
          inner.style.cssText = `
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: ${riskColor};
            border: 2.5px solid #fff;
            box-shadow: 0 2px 8px ${riskColor}50;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            font-weight: 800;
            color: white;
            font-family: system-ui, sans-serif;
            letter-spacing: -0.3px;
          `;
          inner.textContent = riskLabel;
          dot.appendChild(inner);
        }

        const label = document.createElement("div");
        label.style.cssText = `
          background: rgba(255,255,255,0.95);
          color: #111827;
          font-family: system-ui, sans-serif;
          font-size: 9.5px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 20px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          white-space: nowrap;
          max-width: 100px;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
        `;
        label.textContent = isHub ? "F3 Hub" : region.name;

        el.appendChild(dot);
        el.appendChild(label);

        // Tooltip
        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 30,
          className: "fruit-map-popup",
          maxWidth: "240px",
        }).setHTML(`
          <div style="font-family:system-ui,sans-serif; padding:12px 14px; min-width:200px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <div style="width:10px;height:10px;border-radius:50%;background:${riskColor};flex-shrink:0;"></div>
              <div>
                <div style="font-weight:700;font-size:12px;color:#111;">${region.name}</div>
                <div style="font-size:10px;color:#6b7280;margin-top:1px;">${region.state}</div>
              </div>
            </div>
            ${region.riskScore > 0 ? `
            <div style="display:flex;align-items:center;justify-content:space-between;background:${riskColor}12;border:1px solid ${riskColor}30;border-radius:6px;padding:6px 10px;margin-bottom:8px;">
              <span style="font-size:10px;font-weight:700;color:#374151;">Supply Risk</span>
              <span style="font-size:14px;font-weight:900;color:${riskColor};">${region.riskScore}</span>
            </div>` : ""}
            <div style="display:flex;flex-wrap:wrap;gap:4px;">
              ${region.skus.map((s) => `<span style="background:#f3f4f6;border:1px solid #e5e7eb;border-radius:4px;padding:2px 7px;font-size:10px;font-weight:600;color:#374151;">${s}</span>`).join("")}
            </div>
          </div>
        `);

        el.addEventListener("mouseenter", () => {
          if (map.current) popup.addTo(map.current);
        });
        el.addEventListener("mouseleave", () => popup.remove());
        el.addEventListener("click", () => {
          if (onRegionClick) onRegionClick(region);
        });

        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat(region.coordinates);

        if (map.current) {
          marker.addTo(map.current);
          markers.current.push(marker);
        }
      });
    });

    return () => {
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [onRegionClick]);

  // Overlay news count badges when news arrives
  useEffect(() => {
    if (!news.length) return;
    // Future: update marker badges with news counts
  }, [news]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

      {/* Map legend */}
      <div
        style={{
          position: "absolute",
          bottom: 36,
          left: 12,
          background: "rgba(255,255,255,0.96)",
          borderRadius: 10,
          padding: "10px 13px",
          fontSize: 11,
          fontFamily: "system-ui, sans-serif",
          border: "1px solid #e5e7eb",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          pointerEvents: "none",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 9, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
          Supply Risk
        </div>
        {[
          { color: "#ef4444", label: "High (70+)" },
          { color: "#f59e0b", label: "Elevated (50–70)" },
          { color: "#22c55e", label: "Normal (<50)" },
          { color: "#16a34a", label: "F3 Hub" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: color, border: "1.5px solid #fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", flexShrink: 0 }} />
            <span style={{ color: "#374151", fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Popup styles */}
      <style>{`
        .fruit-map-popup .maplibregl-popup-content {
          padding: 0;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
          overflow: hidden;
        }
        .fruit-map-popup .maplibregl-popup-tip { display: none; }
      `}</style>
    </div>
  );
}
