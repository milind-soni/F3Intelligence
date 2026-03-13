"use client";

import { useMemo, useContext, createContext } from "react";
import { MapRenderer, type MarkerComponentProps } from "json-maps";

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

const RouteCtx = createContext<{ stops: RouteStop[]; routeColor: string }>({
  stops: [],
  routeColor: "#22c55e",
});

function RouteMarker({ id }: MarkerComponentProps) {
  const { stops, routeColor } = useContext(RouteCtx);

  if (id === "hub") {
    return (
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#16a34a",
          border: "3px solid #fff",
          boxShadow: "0 0 0 2px rgba(22,163,74,0.3), 0 2px 8px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
      </div>
    );
  }

  const idx = parseInt(id.replace("stop-", ""), 10);

  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: routeColor,
        border: "2.5px solid #fff",
        boxShadow: `0 0 0 1px ${routeColor}50, 0 2px 8px rgba(0,0,0,0.2)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        fontWeight: 800,
        color: "white",
        fontFamily: "system-ui, sans-serif",
        cursor: "default",
      }}
    >
      {idx + 1}
    </div>
  );
}

export function RoutePlanMap({ hub, stops, routeColor, polyline }: RoutePlanMapProps) {
  const allLngs = [hub.lng, ...stops.map((s) => s.lng)];
  const allLats = [hub.lat, ...stops.map((s) => s.lat)];

  const bounds = useMemo<[number, number, number, number]>(() => {
    const minLng = Math.min(...allLngs) - 0.02;
    const maxLng = Math.max(...allLngs) + 0.02;
    const minLat = Math.min(...allLats) - 0.02;
    const maxLat = Math.max(...allLats) + 0.02;
    return [minLng, minLat, maxLng, maxLat];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hub.lat, hub.lng, stops]);

  const markers = useMemo(() => {
    const m: Record<string, { coordinates: [number, number]; color: string; tooltip: string }> = {
      hub: { coordinates: [hub.lng, hub.lat], color: "#16a34a", tooltip: hub.name },
    };
    stops.forEach((stop, i) => {
      m[`stop-${i}`] = {
        coordinates: [stop.lng, stop.lat],
        color: routeColor,
        tooltip: stop.name,
      };
    });
    return m;
  }, [hub, stops, routeColor]);

  const layers = useMemo(() => {
    if (!polyline || polyline.length < 2) return undefined;
    return {
      "route-line": {
        type: "geojson" as const,
        data: {
          type: "FeatureCollection" as const,
          features: [
            {
              type: "Feature" as const,
              geometry: {
                type: "LineString" as const,
                coordinates: polyline,
              },
              properties: {},
            },
          ],
        },
        style: {
          lineColor: routeColor,
          lineWidth: 4,
          lineOpacity: 0.85,
        },
      },
    };
  }, [polyline, routeColor]);

  const spec = useMemo(
    () => ({
      basemap: "light" as const,
      bounds,
      controls: {
        zoom: true,
        compass: true,
        position: "top-right" as const,
      },
      markers,
      ...(layers ? { layers } : {}),
    }),
    [bounds, markers, layers]
  );

  return (
    <RouteCtx.Provider value={{ stops, routeColor }}>
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <MapRenderer
          spec={spec}
          style={{ width: "100%", height: "100%" }}
          components={{ Marker: RouteMarker }}
        />
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
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
            <div style={{ width: 20, height: 3, background: routeColor, borderRadius: 2, flexShrink: 0 }} />
            <span>{polyline ? "Computed route" : "Route not yet computed"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#16a34a", border: "2px solid #fff", flexShrink: 0 }} />
            <span>Chattarpur Facility (hub)</span>
          </div>
        </div>
      </div>
    </RouteCtx.Provider>
  );
}
