"use client";

import { useEffect, useContext, createContext, useMemo, useState } from "react";
import {
  MapRenderer,
  useMap,
  type MarkerComponentProps,
  type TooltipComponentProps,
} from "json-maps";

interface Retailer {
  name: string;
  totalQty: number;
  lng: number;
  lat: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topSkus: { sku: string; qty: number; [key: string]: any }[];
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

const HUB: [number, number] = [77.172, 28.6959];
const HUB_LABEL = "F3 Hub — Azadpur Mandi";

// ─── Context ──────────────────────────────────────────────────────────────────

const RetailerCtx = createContext<{
  retailers: Retailer[];
  maxQty: number;
  selectedName: string | null;
}>({ retailers: [], maxQty: 1, selectedName: null });

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
// Rendered by json-maps via createPortal inside MapRenderer — context flows through.

function RetailerTooltip({ id }: TooltipComponentProps) {
  const { retailers, maxQty } = useContext(RetailerCtx);

  // ── Hub ──
  if (id === "hub") {
    return (
      <div
        style={{
          background: "rgba(8,8,8,0.95)",
          borderRadius: 10,
          padding: "10px 14px",
          fontFamily: "system-ui, sans-serif",
          fontSize: 12,
          color: "white",
          boxShadow: "0 4px 24px rgba(0,0,0,0.7)",
          border: "1px solid rgba(22,163,74,0.45)",
          minWidth: 160,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#16a34a",
              boxShadow: "0 0 6px #16a34a",
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 700, fontSize: 12 }}>F3 Hub</span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>
          Azadpur Mandi, Delhi
        </div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 3 }}>
          Distribution origin · all routes start here
        </div>
      </div>
    );
  }

  // ── Retailer ──
  const idx = parseInt(id.replace("ret-", ""), 10);
  const retailer = retailers[idx];
  if (!retailer) return null;

  const topSku = retailer.topSkus[0]?.sku ?? "—";
  const skuColor = SKU_COLORS[topSku] ?? "#6b7280";
  const sizePct = Math.round((retailer.totalQty / maxQty) * 100);

  return (
    <div
      style={{
        background: "rgba(8,8,8,0.95)",
        borderRadius: 10,
        padding: "11px 14px",
        fontFamily: "system-ui, sans-serif",
        fontSize: 12,
        color: "white",
        boxShadow: "0 4px 24px rgba(0,0,0,0.7)",
        border: `1px solid ${skuColor}55`,
        minWidth: 200,
      }}
    >
      {/* Header: rank circle + name */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: skuColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 800,
            color: "white",
            flexShrink: 0,
            marginTop: 1,
            boxShadow: `0 0 8px ${skuColor}80`,
          }}
        >
          {idx + 1}
        </div>
        <span
          style={{
            fontWeight: 700,
            fontSize: 12,
            lineHeight: 1.35,
            color: "rgba(255,255,255,0.95)",
          }}
        >
          {retailer.name}
        </span>
      </div>

      {/* Volume bar */}
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            height: 3,
            borderRadius: 2,
            background: "rgba(255,255,255,0.1)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${sizePct}%`,
              height: "100%",
              background: skuColor,
              borderRadius: 2,
            }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 16 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: skuColor, lineHeight: 1 }}>
            {(retailer.totalQty / 1000).toFixed(1)}K
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
            kg total
          </div>
        </div>

        <div
          style={{
            width: 1,
            background: "rgba(255,255,255,0.1)",
            alignSelf: "stretch",
          }}
        />

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: skuColor,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
              {topSku}
            </span>
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>top SKU</div>
        </div>
      </div>

      {/* Secondary SKUs */}
      {retailer.topSkus.length > 1 && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 7,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            gap: 5,
            flexWrap: "wrap",
          }}
        >
          {retailer.topSkus.slice(1, 4).map((s: { sku: string; qty: number }) => (
            <div
              key={s.sku}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 4,
                padding: "2px 6px",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: SKU_COLORS[s.sku] ?? "#6b7280",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>
                {s.sku.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Custom Marker ─────────────────────────────────────────────────────────────
// Pure visual — no hover state needed, json-maps handles the tooltip popup.

function RetailerMarker({ id, color }: MarkerComponentProps) {
  const { retailers, maxQty, selectedName } = useContext(RetailerCtx);

  if (id === "hub") {
    return (
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#ffffff",
          border: "3px solid #16a34a",
          boxShadow: "0 0 0 5px rgba(22,163,74,0.3), 0 2px 10px rgba(0,0,0,0.7)",
          cursor: "default",
        }}
      />
    );
  }

  const idx = parseInt(id.replace("ret-", ""), 10);
  const retailer = retailers[idx];
  const size = retailer ? 22 + Math.round((retailer.totalQty / maxQty) * 20) : 28;
  const fontSize = Math.max(9, Math.floor(size / 2.8));
  const isSelected = retailer?.name === selectedName;

  return (
    <div
      style={{
        width: isSelected ? size + 6 : size,
        height: isSelected ? size + 6 : size,
        borderRadius: "50%",
        background: color,
        border: isSelected ? "3px solid white" : "2.5px solid rgba(255,255,255,0.85)",
        cursor: "pointer",
        boxShadow: isSelected
          ? `0 0 0 4px ${color}80, 0 0 20px ${color}60, 0 3px 12px rgba(0,0,0,0.7)`
          : "0 2px 8px rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize,
        fontWeight: 800,
        color: "white",
        fontFamily: "system-ui, sans-serif",
        userSelect: "none",
        transition: "box-shadow 0.2s, width 0.15s, height 0.15s",
      }}
    >
      {idx + 1}
    </div>
  );
}

// ─── FlyTo ────────────────────────────────────────────────────────────────────

function FlyToController({ selectedRetailer }: { selectedRetailer: Retailer | null }) {
  const { map, isLoaded } = useMap();
  useEffect(() => {
    if (!map || !isLoaded || !selectedRetailer) return;
    map.flyTo({
      center: [selectedRetailer.lng, selectedRetailer.lat],
      zoom: 13,
      duration: 900,
      essential: true,
    });
  }, [map, isLoaded, selectedRetailer]);
  return null;
}

// ─── Route highlight ───────────────────────────────────────────────────────────

function RouteHighlightController({
  retailers,
  selectedRetailer,
}: {
  retailers: Retailer[];
  selectedRetailer: Retailer | null;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    const apply = () => {
      retailers.forEach((_, i) => {
        const layerId = `jm-route-ret-${i}-line`;
        if (!map.getLayer(layerId)) return;
        map.setPaintProperty(layerId, "line-opacity", 0.22);
        map.setPaintProperty(layerId, "line-width", 1.5);
      });

      if (selectedRetailer) {
        const idx = retailers.findIndex((r) => r.name === selectedRetailer.name);
        if (idx >= 0) {
          const layerId = `jm-route-ret-${idx}-line`;
          if (map.getLayer(layerId)) {
            map.setPaintProperty(layerId, "line-opacity", 0.95);
            map.setPaintProperty(layerId, "line-width", 5);
          }
        }
      }
    };

    map.on("idle", apply);
    apply();
    const t1 = setTimeout(apply, 800);
    const t2 = setTimeout(apply, 2500);
    return () => {
      map.off("idle", apply);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map, isLoaded, selectedRetailer, retailers]);

  return null;
}

// ─── Main component ────────────────────────────────────────────────────────────

export function RetailerMap({
  retailers,
  selectedRetailer,
  onSelectRetailer,
}: RetailerMapProps) {
  // Pre-fetch all 20 OSRM routes in batches of 5
  const [routeCoords, setRouteCoords] = useState<Record<string, [number, number][]>>({});

  useEffect(() => {
    const controller = new AbortController();
    const BATCH = 5;

    const fetchAll = async () => {
      for (let start = 0; start < retailers.length; start += BATCH) {
        if (controller.signal.aborted) break;

        const batchUpdates: Record<string, [number, number][]> = {};
        const batch = retailers.slice(start, start + BATCH);

        await Promise.allSettled(
          batch.map(async (r, batchIdx) => {
            const i = start + batchIdx;
            const key = `route-ret-${i}`;
            try {
              const res = await fetch(
                `https://router.project-osrm.org/route/v1/driving/` +
                  `${HUB[0]},${HUB[1]};${r.lng},${r.lat}` +
                  `?overview=full&geometries=geojson`,
                { signal: controller.signal }
              );
              const data = await res.json();
              const coords = data?.routes?.[0]?.geometry?.coordinates as
                | [number, number][]
                | undefined;
              batchUpdates[key] = coords ?? [HUB, [r.lng, r.lat]];
            } catch {
              if (!controller.signal.aborted) {
                batchUpdates[key] = [HUB, [r.lng, r.lat]];
              }
            }
          })
        );

        if (!controller.signal.aborted) {
          setRouteCoords((prev) => ({ ...prev, ...batchUpdates }));
        }

        if (start + BATCH < retailers.length && !controller.signal.aborted) {
          await new Promise((res) => setTimeout(res, 300));
        }
      }
    };

    fetchAll();
    return () => controller.abort();
  }, [retailers]);

  const maxQty = useMemo(
    () => Math.max(...retailers.map((r) => r.totalQty)),
    [retailers]
  );

  const markers = useMemo(() => {
    const m: Record<
      string,
      { coordinates: [number, number]; color: string; tooltip: string }
    > = {
      hub: { coordinates: HUB, color: "#16a34a", tooltip: HUB_LABEL },
    };
    retailers.forEach((r, i) => {
      const topSku = r.topSkus[0]?.sku ?? "WATERMELON";
      m[`ret-${i}`] = {
        coordinates: [r.lng, r.lat],
        color: SKU_COLORS[topSku] ?? "#22c55e",
        // tooltip text is passed to RetailerTooltip as `text` — we use `id` for lookup instead
        tooltip: r.name,
      };
    });
    return m;
  }, [retailers]);

  const routeLayers = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layers: Record<string, any> = {};
    retailers.forEach((r, i) => {
      const key = `route-ret-${i}`;
      const coords = routeCoords[key];
      layers[key] = {
        type: "route",
        coordinates: coords ?? ([HUB, [r.lng, r.lat]] as [number, number][]),
        style: {
          color: "#22c55e",
          width: coords ? 1.5 : 1,
          opacity: coords ? 0.22 : 0.08,
          dashed: true,
        },
      };
    });
    return layers;
  }, [retailers, routeCoords]);

  const spec = useMemo(
    () => ({
      basemap: "dark" as const,
      center: [HUB[0] - 0.04, 28.54] as [number, number],
      zoom: 10,
      pitch: 20,
      controls: {
        zoom: true,
        compass: true,
        fullscreen: true,
        position: "top-right" as const,
      },
      markers,
      layers: routeLayers,
    }),
    [markers, routeLayers]
  );

  const handleMarkerClick = (markerId: string) => {
    if (markerId === "hub") return;
    const idx = parseInt(markerId.replace("ret-", ""), 10);
    if (!isNaN(idx) && retailers[idx]) onSelectRetailer(retailers[idx]);
  };

  const routesLoaded = Object.keys(routeCoords).length;
  const allLoaded = routesLoaded >= retailers.length;

  return (
    <RetailerCtx.Provider
      value={{ retailers, maxQty, selectedName: selectedRetailer?.name ?? null }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <MapRenderer
          spec={spec}
          style={{ width: "100%", height: "100%" }}
          components={{ Marker: RetailerMarker, Tooltip: RetailerTooltip }}
          onMarkerClick={handleMarkerClick}
        >
          <FlyToController selectedRetailer={selectedRetailer} />
          <RouteHighlightController
            retailers={retailers}
            selectedRetailer={selectedRetailer}
          />
        </MapRenderer>

        {/* Legend */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            left: 12,
            background: "rgba(8,8,8,0.82)",
            color: "white",
            padding: "9px 13px",
            borderRadius: 8,
            fontSize: 11,
            lineHeight: 1.75,
            pointerEvents: "none",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(255,255,255,0.1)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: 5,
              opacity: 0.55,
              fontSize: 10,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
            }}
          >
            Map Guide
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#22c55e",
                border: "1.5px solid rgba(255,255,255,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              1
            </div>
            <span style={{ opacity: 0.85 }}>Pin # = rank by total volume</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#fff",
                border: "2px solid #16a34a",
                flexShrink: 0,
              }}
            />
            <span style={{ opacity: 0.85 }}>F3 Hub — Azadpur Mandi</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div
              style={{
                width: 16,
                height: 2,
                background: "#22c55e",
                opacity: 0.8,
                flexShrink: 0,
              }}
            />
            <span style={{ opacity: 0.85 }}>
              {allLoaded
                ? `Road routes (${retailers.length} loaded)`
                : `Routes loading… ${routesLoaded}/${retailers.length}`}
            </span>
          </div>
        </div>
      </div>
    </RetailerCtx.Provider>
  );
}
