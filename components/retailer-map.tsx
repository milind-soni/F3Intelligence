"use client";

import { useEffect, useRef } from "react";

interface Retailer {
  name: string;
  totalQty: number;
  lng: number;
  lat: number;
  topSkus: { sku: string; qty: number }[];
}

interface RetailerMapProps {
  retailers: Retailer[];
  selectedRetailer: Retailer | null;
  onSelectRetailer: (r: Retailer) => void;
}

const SKU_COLORS: Record<string, string> = {
  WATERMELON: "#22c55e",
  "KASHMIR APPLE": "#ef4444",
  "KINNAUR APPLE": "#f97316",
  ANAR: "#ec4899",
  KINNOW: "#f59e0b",
  ORANGE: "#fb923c",
  "SAFEDA MANGO": "#84cc16",
  "VNR GUAVA": "#8b5cf6",
};

// F3 Hub — Azadpur Mandi (Delhi's main fruit market)
const HUB = { lng: 77.1720, lat: 28.6959, label: "F3 Hub — Azadpur" };

export function RetailerMap({ retailers, selectedRetailer, onSelectRetailer }: RetailerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ flyTo: (o: object) => void; remove: () => void } | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import("maplibre-gl").then(({ default: maplibregl }) => {
      const map = new maplibregl.Map({
        container: containerRef.current!,
        style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        center: [HUB.lng - 0.05, 28.54],
        zoom: 10,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on("load", () => {
        const maxQty = Math.max(...retailers.map((r) => r.totalQty));

        // --- HUB marker ---
        const hubEl = document.createElement("div");
        hubEl.style.cssText = `
          width: 20px; height: 20px; border-radius: 50%;
          background: #ffffff; border: 3px solid #16a34a;
          box-shadow: 0 0 0 4px rgba(22,163,74,0.25), 0 2px 8px rgba(0,0,0,0.6);
          cursor: default;
        `;
        new maplibregl.Marker({ element: hubEl, anchor: "center" })
          .setLngLat([HUB.lng, HUB.lat])
          .setPopup(new maplibregl.Popup({ offset: 12, closeButton: false })
            .setHTML(`<div style="font-size:12px;font-weight:700;padding:4px 8px;color:#052e16">${HUB.label}</div>`))
          .addTo(map);

        // --- Route lines source ---
        const routeFeatures = retailers.map((r) => ({
          type: "Feature" as const,
          properties: { name: r.name },
          geometry: {
            type: "LineString" as const,
            coordinates: [[HUB.lng, HUB.lat], [r.lng, r.lat]],
          },
        }));

        map.addSource("routes", {
          type: "geojson",
          data: { type: "FeatureCollection", features: routeFeatures },
        });

        // Dashed route lines
        map.addLayer({
          id: "routes-line",
          type: "line",
          source: "routes",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#22c55e",
            "line-width": 1.5,
            "line-opacity": 0.35,
            "line-dasharray": [3, 4],
          },
        });

        // --- Retailer markers ---
        retailers.forEach((retailer, i) => {
          const size = 22 + Math.round((retailer.totalQty / maxQty) * 20);
          const topSku = retailer.topSkus[0]?.sku ?? "WATERMELON";
          const color = SKU_COLORS[topSku] ?? "#22c55e";

          const el = document.createElement("div");
          el.style.cssText = `
            width: ${size}px; height: ${size}px;
            border-radius: 50%;
            background: ${color};
            border: 2.5px solid rgba(255,255,255,0.9);
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.55);
            display: flex; align-items: center; justify-content: center;
            font-size: ${Math.max(9, Math.floor(size / 2.8))}px;
            font-weight: 800;
            color: white;
            font-family: system-ui, sans-serif;
            transition: transform 0.15s, box-shadow 0.15s;
            position: relative;
            z-index: ${10 - i};
          `;
          el.textContent = String(i + 1);

          el.addEventListener("mouseenter", () => {
            el.style.transform = "scale(1.35)";
            el.style.boxShadow = `0 4px 18px ${color}99`;
          });
          el.addEventListener("mouseleave", () => {
            el.style.transform = "scale(1)";
            el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.55)";
          });
          el.addEventListener("click", () => onSelectRetailer(retailer));

          new maplibregl.Marker({ element: el, anchor: "center" })
            .setLngLat([retailer.lng, retailer.lat])
            .addTo(map);
        });
      });
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // Fly to + highlight route when selection changes
  useEffect(() => {
    if (!mapRef.current || !selectedRetailer) return;
    mapRef.current.flyTo({
      center: [selectedRetailer.lng, selectedRetailer.lat],
      zoom: 13,
      duration: 1000,
      essential: true,
    });
  }, [selectedRetailer]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
