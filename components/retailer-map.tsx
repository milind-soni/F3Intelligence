"use client";

import { useEffect, useRef, useState } from "react";

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

export function RetailerMap({ retailers, selectedRetailer, onSelectRetailer }: RetailerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Dynamic import to avoid SSR issues
    import("maplibre-gl").then((maplibre) => {
      const { default: maplibregl } = maplibre;

      const map = new maplibregl.Map({
        container: mapContainerRef.current!,
        style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        center: [77.15, 28.54],
        zoom: 10.5,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on("load", () => {
        const maxQty = Math.max(...retailers.map((r) => r.totalQty));

        retailers.forEach((retailer, i) => {
          const size = 18 + Math.round((retailer.totalQty / maxQty) * 24);
          const topSku = retailer.topSkus[0]?.sku ?? "WATERMELON";
          const color = SKU_COLORS[topSku] ?? "#22c55e";

          const el = document.createElement("div");
          el.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: ${color};
            border: 2px solid white;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5);
            transition: transform 0.2s, box-shadow 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${Math.max(8, size / 3)}px;
            font-weight: bold;
            color: white;
          `;
          el.textContent = String(i + 1);

          el.addEventListener("mouseenter", () => {
            el.style.transform = "scale(1.4)";
            el.style.boxShadow = `0 4px 16px ${color}80`;
            el.style.zIndex = "999";
          });
          el.addEventListener("mouseleave", () => {
            el.style.transform = "scale(1)";
            el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.5)";
          });
          el.addEventListener("click", () => {
            onSelectRetailer(retailer);
          });

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([retailer.lng, retailer.lat])
            .addTo(map);

          (markersRef.current as unknown[]).push(marker);
        });
      });
    });

    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Fly to selected retailer
  useEffect(() => {
    if (!mapRef.current || !selectedRetailer) return;
    const map = mapRef.current as { flyTo: (opts: object) => void };
    map.flyTo({
      center: [selectedRetailer.lng, selectedRetailer.lat],
      zoom: 13,
      duration: 1200,
      essential: true,
    });
  }, [selectedRetailer]);

  return (
    <div ref={mapContainerRef} className="w-full h-full rounded-xl overflow-hidden" />
  );
}
