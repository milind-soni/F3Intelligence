"use client";

import { useEffect, useContext, createContext, useMemo } from "react";
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
  zone?: string;
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

function RetailerTooltip({ id }: TooltipComponentProps) {
  const { retailers, maxQty } = useContext(RetailerCtx);

  if (id === "hub") {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "10px 14px",
          fontFamily: "system-ui, sans-serif",
          fontSize: 12,
          color: "#111",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
          border: "1px solid #e5e7eb",
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
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 700, fontSize: 12, color: "#111" }}>F3 Hub</span>
        </div>
        <div style={{ color: "#6b7280", fontSize: 11 }}>
          Azadpur Mandi, Delhi
        </div>
        <div style={{ color: "#9ca3af", fontSize: 10, marginTop: 3 }}>
          Distribution origin
        </div>
      </div>
    );
  }

  const idx = parseInt(id.replace("ret-", ""), 10);
  const retailer = retailers[idx];
  if (!retailer) return null;

  const hasData = retailer.totalQty > 0 && retailer.topSkus.length > 0;
  const topSku = retailer.topSkus[0]?.sku ?? "—";
  const skuColor = hasData ? (SKU_COLORS[topSku] ?? "#6b7280") : "#6b7280";

  // Simple tooltip for retailers without volume data
  if (!hasData) {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          padding: "10px 14px",
          fontFamily: "system-ui, sans-serif",
          fontSize: 12,
          color: "#111",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
          border: "1px solid #e5e7eb",
          minWidth: 160,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 12, color: "#111", marginBottom: 3 }}>
          {retailer.name}
        </div>
        {retailer.zone && (
          <div style={{ color: "#6b7280", fontSize: 11 }}>{retailer.zone}</div>
        )}
      </div>
    );
  }

  const sizePct = Math.round((retailer.totalQty / maxQty) * 100);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "12px 14px",
        fontFamily: "system-ui, sans-serif",
        fontSize: 12,
        color: "#111",
        boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb",
        minWidth: 200,
      }}
    >
      {/* Header */}
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
          }}
        >
          {idx + 1}
        </div>
        <div>
          <span style={{ fontWeight: 700, fontSize: 12, lineHeight: 1.35, color: "#111" }}>
            {retailer.name}
          </span>
          {retailer.zone && (
            <div style={{ color: "#9ca3af", fontSize: 10, marginTop: 1 }}>{retailer.zone}</div>
          )}
        </div>
      </div>

      {/* Volume bar */}
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            height: 3,
            borderRadius: 2,
            background: "#f3f4f6",
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

      {/* Stats */}
      <div style={{ display: "flex", gap: 16 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: skuColor, lineHeight: 1 }}>
            {(retailer.totalQty / 1000).toFixed(1)}K
          </div>
          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>kg total</div>
        </div>

        <div style={{ width: 1, background: "#e5e7eb", alignSelf: "stretch" }} />

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
            <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>
              {topSku}
            </span>
          </div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>top SKU</div>
        </div>
      </div>

      {/* Secondary SKUs */}
      {retailer.topSkus.length > 1 && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 7,
            borderTop: "1px solid #f3f4f6",
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
                background: "#f9fafb",
                borderRadius: 4,
                padding: "2px 6px",
                border: "1px solid #f3f4f6",
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
              <span style={{ fontSize: 10, color: "#6b7280" }}>
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

function RetailerMarker({ id, color }: MarkerComponentProps) {
  const { retailers, maxQty, selectedName } = useContext(RetailerCtx);

  if (id === "hub") {
    return (
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#16a34a",
          border: "3px solid #fff",
          boxShadow: "0 0 0 2px rgba(22,163,74,0.25), 0 2px 8px rgba(0,0,0,0.15)",
          cursor: "default",
        }}
      />
    );
  }

  const idx = parseInt(id.replace("ret-", ""), 10);
  const retailer = retailers[idx];
  const hasData = retailer && retailer.totalQty > 0;
  const isSelected = retailer?.name === selectedName;

  // Small dot for retailers without volume data
  if (!hasData) {
    const dotSize = isSelected ? 14 : 10;
    return (
      <div
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          background: isSelected ? "#6b7280" : "#94a3b8",
          border: "2px solid #fff",
          cursor: "pointer",
          boxShadow: isSelected
            ? "0 0 0 2px rgba(107,114,128,0.4), 0 1px 6px rgba(0,0,0,0.15)"
            : "0 1px 3px rgba(0,0,0,0.1)",
          transition: "box-shadow 0.2s, width 0.15s, height 0.15s",
        }}
      />
    );
  }

  const size = 22 + Math.round((retailer.totalQty / maxQty) * 18);
  const fontSize = Math.max(9, Math.floor(size / 2.8));

  return (
    <div
      style={{
        width: isSelected ? size + 6 : size,
        height: isSelected ? size + 6 : size,
        borderRadius: "50%",
        background: color,
        border: isSelected ? "3px solid #fff" : "2.5px solid #fff",
        cursor: "pointer",
        boxShadow: isSelected
          ? `0 0 0 3px ${color}50, 0 2px 12px rgba(0,0,0,0.2)`
          : "0 1px 6px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)",
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

// ─── Main component ────────────────────────────────────────────────────────────

export function RetailerMap({
  retailers,
  selectedRetailer,
  onSelectRetailer,
}: RetailerMapProps) {
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
        tooltip: r.name,
      };
    });
    return m;
  }, [retailers]);

  const spec = useMemo(
    () => ({
      basemap: "light" as const,
      center: [HUB[0] - 0.04, 28.54] as [number, number],
      zoom: 10,
      pitch: 0,
      controls: {
        zoom: true,
        compass: true,
        fullscreen: true,
        position: "top-right" as const,
      },
      markers,
    }),
    [markers]
  );

  const handleMarkerClick = (markerId: string) => {
    if (markerId === "hub") return;
    const idx = parseInt(markerId.replace("ret-", ""), 10);
    if (!isNaN(idx) && retailers[idx]) onSelectRetailer(retailers[idx]);
  };

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
        </MapRenderer>

        {/* Legend */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            left: 12,
            background: "rgba(255,255,255,0.92)",
            color: "#374151",
            padding: "9px 13px",
            borderRadius: 10,
            fontSize: 11,
            lineHeight: 1.75,
            pointerEvents: "none",
            backdropFilter: "blur(8px)",
            border: "1px solid #e5e7eb",
            fontFamily: "system-ui, sans-serif",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: 5,
              color: "#9ca3af",
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
                border: "2px solid #fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                fontWeight: 800,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              1
            </div>
            <span>Top retailers (by volume)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#94a3b8",
                border: "2px solid #fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                flexShrink: 0,
                marginLeft: 3,
                marginRight: 3,
              }}
            />
            <span>All other retailers</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#16a34a",
                border: "2px solid #fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                flexShrink: 0,
              }}
            />
            <span>F3 Hub — Azadpur Mandi</span>
          </div>
        </div>
      </div>
    </RetailerCtx.Provider>
  );
}
