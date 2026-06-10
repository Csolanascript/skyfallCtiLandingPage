"use client";

import React, { useEffect, useRef, useMemo, useState, useCallback } from "react";
import gsap from "gsap";
import countries from "world-countries";
import { Shield, Crosshair, AlertTriangle } from "lucide-react";

type Slice = { label: string; value: number };
type Colors = {
  bg: string; red: string; redDim: string; redGlow: string;
  border: string; white: string; muted: string; mono: string;
  surface: string; accentFaint: string; green: string;
};

interface Props {
  data: Slice[];
  colors: Colors;
}

// ─── Country lookup: name / iso2 / iso3 / alt spellings → {lat, lng, iso2, name} ──
const LOOKUP: Record<string, { lat: number; lng: number; name: string; iso2: string }> = {};
for (const c of countries) {
  if (!c.latlng || c.latlng.length < 2) continue;
  const entry = { lat: c.latlng[0], lng: c.latlng[1], name: c.name.common, iso2: c.cca2 };
  LOOKUP[c.name.common.toLowerCase()]   = entry;
  LOOKUP[c.name.official.toLowerCase()] = entry;
  LOOKUP[c.cca2.toLowerCase()]          = entry;
  LOOKUP[c.cca3.toLowerCase()]          = entry;
  for (const alt of (c.altSpellings ?? [])) LOOKUP[alt.toLowerCase()] = entry;
}

// ─── Equirectangular projection ───────────────────────────────────────────────
const W = 960;
const H = 480;

function lonLatToXY(lon: number, lat: number): [number, number] {
  return [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];
}

function ringToD(ring: number[][]): string {
  return ring
    .map(([lon, lat], i) => {
      const [x, y] = lonLatToXY(lon, lat);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join("") + "Z";
}

function featureToD(geom: { type: string; coordinates: unknown }): string {
  if (geom.type === "Polygon") {
    return (geom.coordinates as number[][][]).map(ringToD).join(" ");
  }
  if (geom.type === "MultiPolygon") {
    return (geom.coordinates as number[][][][])
      .flatMap((poly) => poly.map(ringToD))
      .join(" ");
  }
  return "";
}

interface GeoFeature {
  properties: { ISO_A2: string | number; NAME: string };
  geometry: { type: string; coordinates: unknown };
}

// ─── Grid config ─────────────────────────────────────────────────────────────
const LAT_LINES = [-60, -30, 0, 30, 60];
const LON_LINES = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];

// ─── Component ────────────────────────────────────────────────────────────────
export default function WorldMap({ data, colors: C }: Props) {
  const wrapRef      = useRef<SVGSVGElement>(null);
  const [geoFeatures, setGeoFeatures] = useState<GeoFeature[]>([]);
  const [tooltip, setTooltip]         = useState<{ x: number; y: number; iso2: string; name: string; val: number } | null>(null);
  const [hovered, setHovered]         = useState<string | null>(null);
  const animatedRef  = useRef(false);

  // Fetch GeoJSON once
  useEffect(() => {
    fetch("/world-110m.geojson")
      .then((r) => r.json())
      .then((d: { features: GeoFeature[] }) => setGeoFeatures(d.features))
      .catch(() => {});
  }, []);

  // Build iso2 → IOC count map from data prop
  const valueMap = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const d of data ?? []) {
      const entry = LOOKUP[d.label.toLowerCase().trim()];
      if (entry) map[entry.iso2] = (map[entry.iso2] ?? 0) + d.value;
    }
    return map;
  }, [data]);

  const maxVal   = useMemo(() => Math.max(...Object.values(valueMap), 1), [valueMap]);
  const logMaxVal = useMemo(() => Math.log(maxVal + 1), [maxVal]);
  const hotCount  = Object.keys(valueMap).length;

  // Logarithmic intensity: gives meaningful color contrast across wide value ranges
  const logIntensity = useCallback((val: number) =>
    val > 0 ? Math.log(val + 1) / logMaxVal : 0,
  [logMaxVal]);

  // Animate hot countries in when features arrive
  useEffect(() => {
    if (!wrapRef.current || !geoFeatures.length || animatedRef.current) return;
    animatedRef.current = true;
    const paths = wrapRef.current.querySelectorAll<SVGPathElement>("[data-hot='1']");
    if (paths.length) {
      gsap.fromTo(paths,
        { opacity: 0, scale: 0.94, transformOrigin: "center center" },
        { opacity: 1, scale: 1, duration: 0.7, stagger: 0.025, ease: "power2.out" },
      );
    }
  }, [geoFeatures]);

  // Entrance
  useEffect(() => {
    if (!wrapRef.current) return;
    gsap.fromTo(wrapRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5 });
  }, []);

  // Top 10 label points, radius scaled by log intensity
  const topPoints = useMemo(() => {
    return Object.entries(valueMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .flatMap(([iso2, val], rank) => {
        const entry = Object.values(LOOKUP).find((e) => e.iso2 === iso2);
        if (!entry) return [];
        const [x, y] = lonLatToXY(entry.lng, entry.lat);
        const r = 3 + logIntensity(val) * 10;
        return [{ iso2, name: entry.name, val, x, y, r, rank }];
      });
  }, [valueMap, logIntensity]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<SVGPathElement>, f: GeoFeature) => {
      const iso2Str = String(f.properties.ISO_A2 ?? "");
      const iso2 = (iso2Str === "-99" || iso2Str.length !== 2)
        ? (LOOKUP[f.properties.NAME?.toLowerCase?.() ?? ""]?.iso2 ?? iso2Str)
        : iso2Str;
      const val  = valueMap[iso2] ?? 0;
      const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * W;
      const svgY = ((e.clientY - rect.top) / rect.height) * H;
      setHovered(iso2);
      setTooltip({ x: svgX, y: svgY, iso2, name: f.properties.NAME, val });
    },
    [valueMap],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGPathElement>) => {
      if (!tooltip) return;
      const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * W;
      const svgY = ((e.clientY - rect.top) / rect.height) * H;
      setTooltip((t) => t ? { ...t, x: svgX, y: svgY } : null);
    },
    [tooltip],
  );

  const handleMouseLeave = useCallback(() => {
    setHovered(null);
    setTooltip(null);
  }, []);

  // Tooltip in SVG coordinates → percentage for div positioning
  const ttLeft = tooltip ? `${((tooltip.x / W) * 100).toFixed(1)}%` : "0";
  const ttTop  = tooltip ? `${((tooltip.y / H) * 100).toFixed(1)}%` : "0";

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* ── Stats bar ─────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 24, marginBottom: 10, fontSize: 9,
        letterSpacing: "0.16em", color: C.muted,
        borderBottom: `1px solid ${C.border}`, paddingBottom: 8,
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Shield size={9} color={C.red} />
          <span style={{ color: C.red }}>{hotCount}</span> COUNTRIES WITH IOCs
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Crosshair size={9} color={C.red} />
          <span style={{ color: C.white }}>{(data ?? []).reduce((s, d) => s + d.value, 0).toLocaleString()}</span> TOTAL IOCs MAPPED
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: "auto" }}>
          <AlertTriangle size={9} color={C.red} />
          LOG SCALE · NATURAL EARTH 110M
        </span>
      </div>

      {/* ── SVG Map ───────────────────────────────────────────────────── */}
      <div style={{ position: "relative", width: "100%", border: `1px solid ${C.border}` }}>
        <svg
          ref={wrapRef}
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "auto", display: "block", background: "#030810" }}
          onMouseLeave={handleMouseLeave}
        >
          {/* Ocean fill (the SVG bg color already handles this) */}
          <rect x={0} y={0} width={W} height={H} fill="#030810" />

          {/* ── Graticule ── */}
          {/* Latitude lines */}
          {LAT_LINES.map((lat) => {
            const [, y] = lonLatToXY(0, lat);
            const isEquator = lat === 0;
            return (
              <line key={`lat${lat}`}
                x1={0} y1={y} x2={W} y2={y}
                stroke={isEquator ? C.redDim : "#1a2a3a"}
                strokeWidth={isEquator ? 0.8 : 0.5}
                strokeDasharray={isEquator ? undefined : "3 5"}
                opacity={isEquator ? 0.8 : 0.6}
              />
            );
          })}
          {/* Longitude lines */}
          {LON_LINES.map((lon) => {
            const [x] = lonLatToXY(lon, 0);
            return (
              <line key={`lon${lon}`}
                x1={x} y1={0} x2={x} y2={H}
                stroke="#1a2a3a" strokeWidth={0.5}
                strokeDasharray="3 5" opacity={0.5}
              />
            );
          })}
          {/* Prime meridian + antimeridian */}
          {[0, 180].map((lon) => {
            const [x] = lonLatToXY(lon, 0);
            return (
              <line key={`pm${lon}`}
                x1={x} y1={0} x2={x} y2={H}
                stroke={C.redDim} strokeWidth={0.6} opacity={0.4}
              />
            );
          })}

          {/* ── Country shapes ── */}
          {geoFeatures.map((f, i) => {
            // Natural Earth 110m stores ISO_A2 as the number -99 (not string) for
            // France and a few others — convert first, then fall back to NAME lookup.
            const iso2Str = String(f.properties.ISO_A2 ?? "");
            const iso2 = (iso2Str === "-99" || iso2Str.length !== 2)
              ? (LOOKUP[f.properties.NAME?.toLowerCase?.() ?? ""]?.iso2 ?? iso2Str)
              : iso2Str;
            const val   = valueMap[iso2] ?? 0;
            const isHot = val > 0;
            const isHov = hovered === iso2;
            // Logarithmic intensity: 0..1 with full contrast across wide ranges
            const li    = logIntensity(val);

            let fill: string;
            let stroke: string;
            let strokeW: number;

            if (isHov) {
              fill    = `${C.red}ee`;
              stroke  = C.white;
              strokeW = 1.4;
            } else if (isHot) {
              // Alpha range: 30 (≈12%) for 1 IOC → 255 (100%) for max
              // This gives clear visible steps across the entire range
              const alpha = Math.round(30 + li * 225).toString(16).padStart(2, "0");
              fill    = `${C.red}${alpha}`;
              stroke  = li > 0.6 ? `${C.red}cc` : `${C.red}55`;
              strokeW = li > 0.6 ? 0.8 : 0.5;
            } else {
              fill    = "#0e1c2b";
              stroke  = "#1e3044";
              strokeW = 0.4;
            }

            const d = featureToD(f.geometry);
            if (!d) return null;

            return (
              <path
                key={i}
                d={d}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeW}
                data-iso={iso2}
                data-hot={isHot ? "1" : "0"}
                style={{
                  cursor: isHot ? "crosshair" : "default",
                  filter: isHov
                    ? `drop-shadow(0 0 8px ${C.red})`
                    : isHot && li > 0.55
                      ? `drop-shadow(0 0 ${(li * 6).toFixed(1)}px ${C.red}aa)`
                      : undefined,
                  transition: "fill 120ms, filter 120ms",
                }}
                onMouseEnter={(e) => handleMouseEnter(e, f)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              />
            );
          })}

          {/* ── Top-10 pulse circles + labels ── */}
          {topPoints.map((p) => {
            // Stagger pulse animation by rank so they don't all pulse together
            const dur = (2.0 + p.rank * 0.18).toFixed(2);
            const nameShort = p.name.length > 13 ? p.name.slice(0, 11).toUpperCase() + "…" : p.name.toUpperCase();
            const labelY    = p.y - p.r - 7;
            // Top-3 get white label, rest get muted
            const labelColor = p.rank < 3 ? C.white : C.muted;
            return (
              <g key={p.iso2} style={{ pointerEvents: "none" }}>
                {/* Animated pulse ring */}
                <circle cx={p.x} cy={p.y} r={p.r}>
                  <animate attributeName="r"       values={`${p.r};${p.r + 8};${p.r}`}       dur={`${dur}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.35;0;0.35"                        dur={`${dur}s`} repeatCount="indefinite" />
                  <animate attributeName="stroke"  values={`${C.red};${C.red}00;${C.red}`}    dur={`${dur}s`} repeatCount="indefinite" />
                </circle>
                {/* Filled circle scaled by log intensity */}
                <circle cx={p.x} cy={p.y} r={p.r}
                  fill={`${C.red}35`} stroke={C.red} strokeWidth={1.2} />
                {/* Center dot */}
                <circle cx={p.x} cy={p.y} r={2.8} fill={C.red} />
                {/* Rank number in dot */}
                <text x={p.x} y={p.y + 1}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={C.white} fontSize={5} fontFamily="monospace" fontWeight={900}>
                  {p.rank + 1}
                </text>
                {/* Country name */}
                <text x={p.x} y={labelY}
                  textAnchor="middle" fill={labelColor}
                  fontSize={7} fontFamily="monospace" fontWeight={700}>
                  {nameShort}
                </text>
                {/* IOC count */}
                <text x={p.x} y={labelY + 8}
                  textAnchor="middle" fill={C.red}
                  fontSize={6} fontFamily="monospace">
                  ▲ {p.val.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* ── Axis labels ── */}
          {([["90°N", 90], ["60°N", 60], ["30°N", 30], ["EQ 0°", 0], ["30°S", -30], ["60°S", -60], ["90°S", -90]] as [string, number][])
            .map(([lbl, lat]) => {
              const [, y] = lonLatToXY(0, lat);
              return (
                <text key={lbl} x={4} y={y + 3} fill={C.muted}
                  fontSize={6} fontFamily="monospace" opacity={0.6}>
                  {lbl}
                </text>
              );
            })}
          {([[-150, "-150°"], [-90, "-90°"], [-30, "-30°"], [30, "30°"], [90, "90°"], [150, "150°"]] as [number, string][])
            .map(([lon, lbl]) => {
              const [x] = lonLatToXY(lon, 0);
              return (
                <text key={lbl} x={x} y={H - 3} textAnchor="middle"
                  fill={C.muted} fontSize={6} fontFamily="monospace" opacity={0.5}>
                  {lbl}
                </text>
              );
            })}

          {/* ── Corner decorations ── */}
          {([[0, 0], [W, 0], [0, H], [W, H]] as [number, number][]).map(([cx, cy], i) => {
            const dx = cx === 0 ? 1 : -1;
            const dy = cy === 0 ? 1 : -1;
            return (
              <g key={i}>
                <line x1={cx} y1={cy} x2={cx + dx * 18} y2={cy} stroke={C.red} strokeWidth={1.5} />
                <line x1={cx} y1={cy} x2={cx} y2={cy + dy * 18} stroke={C.red} strokeWidth={1.5} />
              </g>
            );
          })}
        </svg>

        {/* ── Tooltip ── */}
        {tooltip && (
          <div style={{
            position: "absolute",
            left: ttLeft,
            top: ttTop,
            transform: "translate(12px, -50%)",
            pointerEvents: "none",
            background: C.bg,
            border: `1px solid ${C.red}`,
            padding: "5px 12px",
            fontSize: 9,
            letterSpacing: "0.14em",
            color: C.white,
            whiteSpace: "nowrap",
            zIndex: 30,
            boxShadow: `0 0 12px ${C.red}40`,
          }}>
            <div style={{ color: C.red, fontWeight: 700, marginBottom: 2 }}>
              {tooltip.name.toUpperCase()}
            </div>
            <div style={{ color: C.muted }}>
              {tooltip.val > 0 ? `${tooltip.val.toLocaleString()} IOCs DETECTED` : "NO IOCs DETECTED"}
            </div>
            {tooltip.val > 0 && (
              <div style={{ color: C.muted, fontSize: 8, marginTop: 2 }}>
                {(logIntensity(tooltip.val) * 100).toFixed(0)}% LOG INTENSITY · #{
                  Object.entries(valueMap).sort((a,b) => b[1]-a[1]).findIndex(([k]) => k === tooltip.iso2) + 1
                } GLOBALLY
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 20, marginTop: 10,
        fontSize: 9, color: C.muted, letterSpacing: "0.13em",
        flexWrap: "wrap",
      }}>
        <span>LEGEND:</span>
        {([
          ["NO DATA",  "#0e1c2b",       "#1e3044"],
          ["1–10",     `${C.red}28`,    C.red    ],
          ["10–100",   `${C.red}60`,    C.red    ],
          ["100–1K",   `${C.red}a0`,    C.red    ],
          ["1K+",      `${C.red}ee`,    C.red    ],
        ] as [string, string, string][]).map(([lbl, fill, stroke]) => (
          <span key={lbl} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width={16} height={10} style={{ flexShrink: 0 }}>
              <rect x={0} y={0} width={16} height={10} fill={fill} stroke={stroke} strokeWidth={0.8} />
            </svg>
            {lbl}
          </span>
        ))}
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <svg width={14} height={14} style={{ flexShrink: 0 }}>
            <circle cx={7} cy={7} r={5} fill={`${C.red}40`} stroke={C.red} strokeWidth={1} />
            <circle cx={7} cy={7} r={2} fill={C.red} />
          </svg>
          TOP THREATS
        </span>
        <span style={{ marginLeft: "auto", color: C.green, letterSpacing: "0.1em" }}>
          ● {hotCount} ACTIVE REGIONS
        </span>
      </div>
    </div>
  );
}
