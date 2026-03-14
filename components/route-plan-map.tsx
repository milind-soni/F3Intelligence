"use client";

import { useEffect, useRef } from "react";

interface RouteStop {
  name: string;
  lat: number;
  lng: number;
  area: string;
  zone: string;
}

interface RoutePlanMapProps {
  hub: { lat: number; lng: number; name: string };
  stops: RouteStop[];
  routeColor: string;
  routeId: number;
  polyline?: [number, number][]; // [lng, lat] pairs from OSRM
}

export function RoutePlanMap({ hub, stops, routeColor, routeId, polyline }: RoutePlanMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polylineLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    // Dynamic import to avoid SSR
    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current || leafletMapRef.current) return;

      // Fix default icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const allLats = [hub.lat, ...stops.map((s) => s.lat)];
      const allLngs = [hub.lng, ...stops.map((s) => s.lng)];
      const bounds: [[number, number], [number, number]] = [
        [Math.min(...allLats) - 0.01, Math.min(...allLngs) - 0.01],
        [Math.max(...allLats) + 0.01, Math.max(...allLngs) + 0.01],
      ];

      const map = L.map(mapRef.current, { zoomControl: true }).fitBounds(bounds);
      leafletMapRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO",
        maxZoom: 19,
      }).addTo(map);

      // Hub marker
      const hubIcon = L.divIcon({
        html: `<div style="width:20px;height:20px;border-radius:50%;background:#16a34a;border:3px solid #fff;box-shadow:0 0 0 2px rgba(22,163,74,0.3),0 2px 8px rgba(0,0,0,0.2);"></div>`,
        className: "",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      L.marker([hub.lat, hub.lng], { icon: hubIcon })
        .addTo(map)
        .bindTooltip(hub.name, { direction: "top", offset: [0, -10] });

      // Stop markers
      stops.forEach((stop, i) => {
        const stopIcon = L.divIcon({
          html: `<div style="width:26px;height:26px;border-radius:50%;background:${routeColor};border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:white;font-family:system-ui,sans-serif;">${i + 1}</div>`,
          className: "",
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });
        const m = L.marker([stop.lat, stop.lng], { icon: stopIcon })
          .addTo(map)
          .bindTooltip(`<b>${stop.name}</b><br/>${stop.area}`, { direction: "top", offset: [0, -13] });
        markersRef.current.push(m);
      });
    });

    return () => {
      cancelled = true;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        polylineLayerRef.current = null;
        markersRef.current = [];
      }
    };
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw/update polyline whenever it changes
  useEffect(() => {
    if (!leafletMapRef.current) return;
    import("leaflet").then((L) => {
      const map = leafletMapRef.current;
      if (!map) return;

      // Remove old polyline
      if (polylineLayerRef.current) {
        map.removeLayer(polylineLayerRef.current);
        polylineLayerRef.current = null;
      }

      if (polyline && polyline.length >= 2) {
        // OSRM gives [lng, lat]; Leaflet needs [lat, lng]
        const latlngs: [number, number][] = polyline.map(([lng, lat]) => [lat, lng]);
        const pl = L.polyline(latlngs, {
          color: routeColor,
          weight: 4,
          opacity: 0.85,
        }).addTo(map);
        polylineLayerRef.current = pl;
        map.fitBounds(pl.getBounds(), { padding: [20, 20] });
      }
    });
  }, [polyline, routeColor]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: 36,
          left: 12,
          background: "rgba(255,255,255,0.92)",
          padding: "8px 12px",
          borderRadius: 10,
          fontSize: 11,
          pointerEvents: "none",
          backdropFilter: "blur(8px)",
          border: "1px solid #e5e7eb",
          fontFamily: "system-ui, sans-serif",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          color: "#374151",
          lineHeight: 1.75,
          zIndex: 1000,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
          <div style={{ width: 20, height: 3, background: polyline ? routeColor : "#d1d5db", borderRadius: 2, flexShrink: 0 }} />
          <span>{polyline ? "Computed route" : "Click Compute Route to draw route"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#16a34a", border: "2px solid #fff", flexShrink: 0 }} />
          <span>Chattarpur Facility</span>
        </div>
      </div>
    </div>
  );
}
