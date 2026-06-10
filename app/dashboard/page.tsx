"use client";

import React, {
  useState, useEffect, useCallback, useRef, useMemo,
  createContext, useContext,
} from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Globe, Target, Shield, Network, Layers,
  Bug, AlertTriangle, Database, Loader2, Sun, Moon,
  MapPin, Activity, Cpu, Server, Zap, Lock, Flag,
  TrendingUp, Eye, Radio, Crosshair, Wifi,
  Monitor, Terminal, Laptop, Smartphone, Router,
  Package, HardDrive, Boxes, Flame, Cloud, Building2,
  CheckCircle, Hash, ExternalLink, Clock, Users,
  ChevronRight, BarChart2, GitBranch, Swords,
  ShieldAlert, BookOpen, Link2,
} from "lucide-react";
import WorldMap from "@/components/dashboard/WorldMap";
import { useTheme, type ColorSet, DARK } from "@/lib/theme";
import Breadcrumb from "@/components/ui/Breadcrumb";
import NologinLogo from "@/components/ui/NologinLogo";

gsap.registerPlugin();

// ─── Local theme context (for sub-components within this file) ────────────────
const ThemeCtx = createContext<ColorSet>(DARK);
const useC = () => useContext(ThemeCtx);

// ─── Main tabs ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "iocs-geo",      label: "IOCs + GEO",    icon: Globe         },
  { id: "intrusion-set", label: "INTRUSION SET", icon: Shield        },
  { id: "ips-domains",   label: "IPs & DOMAINS", icon: Network       },
  { id: "techniques",    label: "TECHNIQUES",    icon: Layers        },
  { id: "cves",          label: "CVEs",          icon: Bug           },
  { id: "malware",       label: "MALWARE",       icon: AlertTriangle },
  { id: "node-status",   label: "NODE STATUS",   icon: Database      },
] as const;
type TabId = typeof TABS[number]["id"];

// ─── Data hook ────────────────────────────────────────────────────────────────
function useFetch<T = unknown>(url: string) {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const refresh = useCallback(() => {
    setLoading(true); setError(false);
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [url]);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error };
}

function fmt(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (Array.isArray(val))               return val.join(", ");
  if (typeof val === "number")          return val.toLocaleString();
  return String(val);
}

// ─── Scanlines ────────────────────────────────────────────────────────────────
function Scanlines() {
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9998,
      background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.07) 3px,rgba(0,0,0,0.07) 4px)",
    }} />
  );
}

// ─── Bracket corners ──────────────────────────────────────────────────────────
function Brackets({ color: colorProp, size = 10 }: { color?: string; size?: number }) {
  const C = useC();
  const color = colorProp ?? C.red;
  const corner = (top: boolean, right: boolean): React.CSSProperties => ({
    position: "absolute", width: size, height: size,
    ...(top   ? { top: -1 }    : { bottom: -1 }),
    ...(right ? { right: -1 }  : { left: -1 }),
    borderTop:    top   ? `2px solid ${color}` : undefined,
    borderBottom: !top  ? `2px solid ${color}` : undefined,
    borderLeft:   !right ? `2px solid ${color}` : undefined,
    borderRight:  right ? `2px solid ${color}` : undefined,
  });
  return (
    <>
      <div style={corner(true,  false)} />
      <div style={corner(true,  true)}  />
      <div style={corner(false, false)} />
      <div style={corner(false, true)}  />
    </>
  );
}

// ─── HudCard ──────────────────────────────────────────────────────────────────
function HudCard({ children, title, hot = false }: {
  children: React.ReactNode; title?: string; hot?: boolean;
}) {
  const C = useC();
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
    );
  }, { scope: ref });

  return (
    <div ref={ref} style={{
      opacity: 0, background: C.surface, position: "relative",
      border: `1px solid ${hot ? C.redDim : C.border}`,
      padding: "18px 20px", minWidth: 0, boxSizing: "border-box",
    }}>
      <Brackets />
      {title && (
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.22em",
          color: C.red, marginBottom: 14, display: "flex", alignItems: "center", gap: 7,
          borderBottom: `1px solid ${C.redDim}`, paddingBottom: 10,
        }}>
          <Eye size={10} color={C.red} />
          <span>{title}</span>
          <div style={{
            marginLeft: "auto", width: 6, height: 6, borderRadius: "50%",
            background: C.red, boxShadow: `0 0 6px ${C.red}`,
            animation: "pulse 1.8s ease-in-out infinite",
          }} />
        </div>
      )}
      {children}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color: colorProp, icon: Icon }: {
  label: string; value: string | number; color?: string;
  icon?: React.ElementType;
}) {
  const C = useC();
  const color = colorProp ?? C.red;
  const numRef  = useRef<HTMLDivElement>(null);
  const raw     = String(value ?? "").replace(/[^0-9.]/g, "");
  const numVal  = parseFloat(raw);
  const isNum   = !isNaN(numVal) && numVal > 0;

  useGSAP(() => {
    if (!numRef.current || !isNum) return;
    const obj = { n: 0 };
    gsap.to(obj, {
      n: numVal, duration: 1.4, ease: "power2.out",
      onUpdate() {
        if (numRef.current)
          numRef.current.textContent = Math.round(obj.n).toLocaleString();
      },
    });
  }, { dependencies: [numVal] });

  return (
    <HudCard hot>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.muted, textTransform: "uppercase" }}>
          {label}
        </div>
        {Icon && <Icon size={13} color={`${color}99`} />}
      </div>
      <div ref={numRef} style={{
        fontSize: 44, fontWeight: 900, color, lineHeight: 1,
        textShadow: `0 0 24px ${color}90, 0 0 48px ${color}30`,
        fontVariantNumeric: "tabular-nums",
      }}>
        {isNum ? "0" : fmt(value)}
      </div>
    </HudCard>
  );
}

// ─── BarList ──────────────────────────────────────────────────────────────────
type Slice = { label: string; value: number };

function BarList({ data, color: colorProp }: { data: Slice[]; color?: string }) {
  const C = useC();
  const color = colorProp ?? C.red;
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...(data ?? []).map((d) => d.value), 1);

  useGSAP(() => {
    if (!containerRef.current || !data?.length) return;
    const fills = containerRef.current.querySelectorAll<HTMLElement>("[data-bar-fill]");
    gsap.fromTo(
      fills,
      { width: "0%" },
      {
        width: (i: number) => `${((data[i]?.value ?? 0) / max) * 100}%`,
        duration: 0.85,
        stagger: 0.05,
        ease: "power3.out",
      },
    );
  }, { scope: containerRef, dependencies: [JSON.stringify(data)] });

  if (!data?.length) return <EmptyState />;

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {data.map((item, i) => (
        <div
          key={i}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          style={{
            display: "flex", alignItems: "center", gap: 8, fontSize: 11,
            cursor: "default", transition: "opacity 150ms",
            opacity: hovered !== null && hovered !== i ? 0.45 : 1,
          }}
        >
          <div style={{
            width: 110, textAlign: "right", color: hovered === i ? C.white : C.muted,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            flexShrink: 0, transition: "color 150ms",
          }}>
            {fmt(item.label)}
          </div>
          <div style={{ flex: 1, minWidth: 0, height: 13, background: C.border }}>
            <div
              data-bar-fill
              style={{
                width: "0%", height: "100%", background: color,
                boxShadow: hovered === i ? `0 0 12px ${color}` : `0 0 5px ${color}55`,
                transition: "box-shadow 150ms",
              }}
            />
          </div>
          <div style={{
            width: 44, color: hovered === i ? C.white : color,
            fontWeight: 700, textAlign: "right", flexShrink: 0,
            fontSize: hovered === i ? 12 : 11, transition: "all 150ms",
          }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── DonutChart ───────────────────────────────────────────────────────────────
function DonutChart({ data, size = "sm" }: { data: Slice[]; size?: "sm" | "lg" }) {
  const C = useC();
  const svgRef = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<number | null>(null);

  const total = (data ?? []).reduce((s, d) => s + (d.value ?? 0), 0);
  const SIZE = size === "lg" ? 240 : 168;
  const R    = size === "lg" ? 96  : 65;
  const IR   = size === "lg" ? 52  : 36;
  const legendFont = size === "lg" ? 12 : 10;
  const dotSz      = size === "lg" ? 11 : 8;
  const cx = SIZE / 2; const cy = SIZE / 2;

  let cumAngle = -Math.PI / 2;
  const slices = (data ?? []).map((d, i) => {
    const angle = total ? (d.value / total) * 2 * Math.PI : 0;
    const x1 = cx + R * Math.cos(cumAngle);
    const y1 = cy + R * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + R * Math.cos(cumAngle);
    const y2 = cy + R * Math.sin(cumAngle);
    const la = angle > Math.PI ? 1 : 0;
    return {
      path: `M${cx},${cy}L${x1.toFixed(1)},${y1.toFixed(1)}A${R},${R},0,${la},1,${x2.toFixed(1)},${y2.toFixed(1)}Z`,
      col:  C.pie[i % C.pie.length],
      label: d.label, value: d.value,
      pct:  total ? Math.round((d.value / total) * 100) : 0,
    };
  });

  useGSAP(() => {
    if (!svgRef.current || !total) return;
    const paths = svgRef.current.querySelectorAll<SVGPathElement>("path[data-slice]");
    gsap.fromTo(
      paths,
      { opacity: 0, scale: 0.72, transformOrigin: `${cx}px ${cy}px` },
      { opacity: 1, scale: 1,    transformOrigin: `${cx}px ${cy}px`, stagger: 0.07, duration: 0.45, ease: "back.out(1.3)" },
    );
  }, { scope: svgRef, dependencies: [JSON.stringify(data)] });

  if (!total) return <EmptyState />;

  const activeSlice = active !== null ? slices[active] : null;

  return (
    <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg ref={svgRef} width={SIZE} height={SIZE}>
          {slices.map((s, i) => (
            <path
              key={i} data-slice d={s.path} fill={s.col}
              stroke={active === i ? C.white : C.bg}
              strokeWidth={active === i ? 2 : 1.5}
              style={{
                cursor: "pointer",
                filter: active === i ? `drop-shadow(0 0 6px ${s.col})` : "none",
                transition: "stroke-width 120ms, filter 120ms",
                transformOrigin: `${cx}px ${cy}px`,
              }}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            />
          ))}
          <circle cx={cx} cy={cy} r={IR} fill={C.bg} />
          {activeSlice && (
            <>
              <text x={cx} y={cy - 7} textAnchor="middle" fill={activeSlice.col} fontSize={15} fontWeight={700} fontFamily={C.mono}>
                {activeSlice.pct}%
              </text>
              <text x={cx} y={cy + 9} textAnchor="middle" fill={C.muted} fontSize={8} fontFamily={C.mono}>
                {String(activeSlice.value)}
              </text>
            </>
          )}
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: size === "lg" ? 8 : 5, fontSize: legendFont }}>
        {slices.map((s, i) => (
          <div
            key={i}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            style={{
              display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
              opacity: active !== null && active !== i ? 0.4 : 1,
              transition: "opacity 150ms",
            }}
          >
            <div style={{ width: dotSz, height: dotSz, background: s.col, flexShrink: 0,
              boxShadow: active === i ? `0 0 8px ${s.col}` : "none", transition: "box-shadow 150ms",
            }} />
            <span style={{
              color: active === i ? C.white : C.muted, flex: 1, minWidth: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              transition: "color 150ms",
            }}>
              {fmt(s.label)}
            </span>
            <span style={{ color: s.col, fontWeight: 700, flexShrink: 0, fontSize: size === "lg" ? 13 : 10 }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HudTable ────────────────────────────────────────────────────────────────
function HudTable({ columns, rows }: { columns: string[]; rows: Record<string, unknown>[] }) {
  const C = useC();
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  if (!rows?.length) return <EmptyState />;

  const thSt: React.CSSProperties = {
    textAlign: "left", padding: "7px 12px", color: C.red,
    fontWeight: 700, letterSpacing: "0.12em", fontSize: 9,
    borderBottom: `1px solid ${C.redDim}`, whiteSpace: "nowrap",
  };

  return (
    <div style={{ overflowX: "auto", width: "100%" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, tableLayout: "fixed" }}>
        <thead>
          <tr>{columns.map((c) => <th key={c} style={thSt}>{c.replace(/_/g, " ").toUpperCase()}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              onMouseEnter={() => setHoveredRow(i)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                borderBottom: `1px solid ${C.border}`,
                background: hoveredRow === i ? C.rowHover : i % 2 === 0 ? "transparent" : C.altRow,
                transition: "background 120ms", cursor: "default",
              }}
            >
              {columns.map((c) => (
                <td key={c} title={fmt(row[c])} style={{
                  padding: "6px 12px",
                  color: hoveredRow === i ? C.white : C.muted,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  maxWidth: 0, transition: "color 120ms",
                }}>
                  {fmt(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Utility components ───────────────────────────────────────────────────────
function EmptyState() {
  const C = useC();
  return (
    <div style={{ color: C.muted, textAlign: "center", padding: "28px 0", letterSpacing: "0.22em", fontSize: 10, opacity: 0.6 }}>
      NO_DATA_AVAILABLE
    </div>
  );
}

function PageLoading() {
  const C = useC();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.red, padding: "80px 0", justifyContent: "center", fontSize: 12, letterSpacing: "0.22em" }}>
      <Loader2 size={14} className="animate-spin" /> FETCHING_DATA...
    </div>
  );
}

function PageError() {
  const C = useC();
  return (
    <div style={{ color: C.red, textAlign: "center", padding: "60px 0", fontSize: 12, letterSpacing: "0.2em" }}>
      [ERROR] NEO4J_QUERY_FAILED
    </div>
  );
}

// ─── Layout atoms ─────────────────────────────────────────────────────────────
function Row({ children, gap = 16 }: { children: React.ReactNode; gap?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap, width: "100%" }}>
      {children}
    </div>
  );
}

function Stats({ children, cols = 4 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap: 16, width: "100%" }}>
      {children}
    </div>
  );
}

function Col({ children, gap = 20 }: { children: React.ReactNode; gap?: number }) {
  return <div style={{ display: "flex", flexDirection: "column", gap, width: "100%", minWidth: 0 }}>{children}</div>;
}

// ─── SubNav ───────────────────────────────────────────────────────────────────
function SubNav<T extends string>({
  tabs, active, onChange,
}: { tabs: { id: T; label: string }[]; active: T; onChange: (id: T) => void }) {
  const C = useC();
  return (
    <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, gap: 0, width: "100%" }}>
      {tabs.map((t) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              padding: "7px 16px", fontSize: 9, fontWeight: 700, letterSpacing: "0.16em",
              fontFamily: C.mono, border: "none", cursor: "pointer",
              background: on ? C.accentFaint : "transparent",
              color: on ? C.red : C.muted,
              borderBottom: on ? `2px solid ${C.red}` : "2px solid transparent",
              transition: "color 100ms, background 100ms",
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── FlagPill ─────────────────────────────────────────────────────────────────
function FlagPill({ label, value, color: colorProp }: { label: string; value: number; color?: string }) {
  const C = useC();
  const color = colorProp ?? C.red;
  const numRef = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (!numRef.current || !value) return;
    const obj = { n: 0 };
    gsap.to(obj, {
      n: value, duration: 1.2, ease: "power2.out",
      onUpdate() { if (numRef.current) numRef.current.textContent = Math.round(obj.n).toLocaleString(); },
    });
  }, { dependencies: [value] });

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 18px", border: `1px solid ${C.redDim}`, position: "relative",
      background: C.accentFaint, minWidth: 0, boxSizing: "border-box",
    }}>
      <Brackets size={8} />
      <span style={{ fontSize: 9, letterSpacing: "0.18em", color: C.muted, textTransform: "uppercase" }}>{label}</span>
      <div ref={numRef} style={{ fontSize: 28, fontWeight: 900, color, textShadow: `0 0 18px ${color}80` }}>
        {value ?? "—"}
      </div>
    </div>
  );
}


// ─── Platform helpers ─────────────────────────────────────────────────────────
function parsePlatformLabel(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((p: unknown) => String(p).trim()).filter(Boolean);
    return [String(parsed).trim()];
  } catch {
    return raw.replace(/[\[\]"']/g, "").split(",").map((s) => s.trim()).filter(Boolean);
  }
}

function aggregatePlatforms(data: Slice[]): Slice[] {
  const map: Record<string, number> = {};
  for (const item of data) {
    for (const p of parsePlatformLabel(String(item.label))) {
      map[p] = (map[p] ?? 0) + item.value;
    }
  }
  return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LucideIcon = React.ComponentType<any>;

const PLATFORM_META: Record<string, { icon: LucideIcon; color: string }> = {
  "Windows":                  { icon: Monitor,    color: "#0078D4" },
  "Linux":                    { icon: Terminal,   color: "#E95420" },
  "macOS":                    { icon: Laptop,     color: "#A2AAAD" },
  "Android":                  { icon: Smartphone, color: "#3DDC84" },
  "iOS":                      { icon: Smartphone, color: "#555555" },
  "Network Devices":          { icon: Router,     color: "#00BCEB" },
  "ESXi":                     { icon: HardDrive,  color: "#607078" },
  "Containers":               { icon: Boxes,      color: "#2496ED" },
  "Field Controller Systems": { icon: Cpu,        color: "#FF6B35" },
  "PRE":                      { icon: Shield,     color: "#8A2BE2" },
  "Office Suite":             { icon: Layers,     color: "#D83B01" },
  "SaaS":                     { icon: Cloud,      color: "#00B4D8" },
  "Google Workspace":         { icon: Cloud,      color: "#4285F4" },
  "Azure AD":                 { icon: Cloud,      color: "#0089D6" },
  "IaaS":                     { icon: Server,     color: "#FF9900" },
};
function getPlatformMeta(name: string): { icon: LucideIcon; color: string } {
  return PLATFORM_META[name] ?? { icon: Monitor, color: "#888" };
}

// ─── PlatformGrid ─────────────────────────────────────────────────────────────
function PlatformGrid({ data }: { data: Slice[] }) {
  const C = useC();
  const containerRef = useRef<HTMLDivElement>(null);
  const platforms = useMemo(() => aggregatePlatforms(data), [data]);
  const max = Math.max(...platforms.map((p) => p.value), 1);

  useGSAP(() => {
    if (!containerRef.current || !platforms.length) return;
    const cards = containerRef.current.querySelectorAll<HTMLElement>("[data-platform-card]");
    gsap.fromTo(cards,
      { opacity: 0, y: 12, scale: 0.92 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.06, ease: "back.out(1.4)" },
    );
  }, { scope: containerRef, dependencies: [JSON.stringify(platforms)] });

  if (!platforms.length) return <EmptyState />;

  return (
    <div ref={containerRef} style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
      gap: 12,
    }}>
      {platforms.map((p, i) => {
        const { icon: Icon, color } = getPlatformMeta(p.label);
        const pct = (p.value / max) * 100;
        return (
          <div
            key={i}
            data-platform-card
            style={{
              opacity: 0,
              border: `1px solid ${C.border}`,
              background: C.surface,
              padding: "14px 14px 12px",
              position: "relative",
              boxSizing: "border-box",
              transition: "border-color 150ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = color; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
          >
            <Brackets size={6} color={color} />
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
              <Icon size={22} color={color} />
              <div style={{
                fontSize: 26, fontWeight: 900, color, lineHeight: 1,
                textShadow: `0 0 16px ${color}60`,
                fontVariantNumeric: "tabular-nums",
              }}>
                {p.value.toLocaleString()}
              </div>
            </div>
            <div style={{ fontSize: 9, letterSpacing: "0.16em", color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>
              {p.label}
            </div>
            {/* compact bar */}
            <div style={{ height: 3, background: C.border }}>
              <div style={{ width: `${pct}%`, height: "100%", background: color, boxShadow: `0 0 6px ${color}80` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── AsnBarList — BarList with org-type icons ─────────────────────────────────
type OrgIcon = { icon: LucideIcon; color: string };
function getAsnIcon(name: string): OrgIcon {
  const n = name.toLowerCase();
  if (n.includes("cloudflare"))                         return { icon: Flame,     color: "#F48120" };
  if (n.includes("amazon") || n.includes("aws"))        return { icon: Cloud,     color: "#FF9900" };
  if (n.includes("google"))                             return { icon: Globe,     color: "#4285F4" };
  if (n.includes("microsoft") || n.includes("azure"))   return { icon: Monitor,   color: "#0078D4" };
  if (n.includes("digitalocean"))                       return { icon: Cloud,     color: "#0080FF" };
  if (n.includes("linode") || n.includes("akamai"))     return { icon: Cloud,     color: "#00A95C" };
  if (n.includes("ovh"))                                return { icon: Server,    color: "#123F6D" };
  if (n.includes("hetzner"))                            return { icon: Server,    color: "#D50C2D" };
  if (n.includes("vultr"))                              return { icon: Cloud,     color: "#007BFC" };
  if (n.includes("alibaba"))                            return { icon: Cloud,     color: "#FF6A00" };
  if (n.includes("tencent"))                            return { icon: Cloud,     color: "#12B7F5" };
  if (n.includes("hosting") || n.includes("host"))      return { icon: HardDrive, color: "#888" };
  if (n.includes("telecom") || n.includes("telekom"))   return { icon: Wifi,      color: "#E20074" };
  if (n.includes("internet") || n.includes("isp"))      return { icon: Network,   color: "#888" };
  if (n.includes("coloc") || n.includes("datacenter"))  return { icon: Building2, color: "#888" };
  return { icon: Server, color: "#666" };
}

function AsnBarList({ data }: { data: Slice[] }) {
  const C = useC();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...(data ?? []).map((d) => d.value), 1);

  useGSAP(() => {
    if (!containerRef.current || !data?.length) return;
    const fills = containerRef.current.querySelectorAll<HTMLElement>("[data-bar-fill]");
    gsap.fromTo(fills,
      { width: "0%" },
      { width: (i: number) => `${((data[i]?.value ?? 0) / max) * 100}%`, duration: 0.85, stagger: 0.05, ease: "power3.out" },
    );
  }, { scope: containerRef, dependencies: [JSON.stringify(data)] });

  if (!data?.length) return <EmptyState />;

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {data.map((item, i) => {
        const { icon: Icon, color } = getAsnIcon(String(item.label));
        return (
          <div key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: "flex", alignItems: "center", gap: 8, fontSize: 11,
              opacity: hovered !== null && hovered !== i ? 0.4 : 1,
              transition: "opacity 150ms",
            }}
          >
            <Icon size={13} color={hovered === i ? color : `${color}99`} />
            <div style={{
              width: 120, color: hovered === i ? C.white : C.muted,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              flexShrink: 0, fontSize: 10, letterSpacing: "0.08em",
            }}>
              {fmt(item.label)}
            </div>
            <div style={{ flex: 1, minWidth: 0, height: 10, background: C.border }}>
              <div data-bar-fill style={{
                width: "0%", height: "100%", background: color,
                boxShadow: hovered === i ? `0 0 10px ${color}` : `0 0 4px ${color}55`,
                transition: "box-shadow 150ms",
              }} />
            </div>
            <div style={{
              width: 40, color: hovered === i ? C.white : color,
              fontWeight: 700, textAlign: "right", flexShrink: 0, fontSize: 11,
            }}>
              {item.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Shared visual utilities ─────────────────────────────────────────────────

/** Rank badge: #1=red, #2=orange, #3=amber, rest=muted */
function RankBadge({ rank }: { rank: number }) {
  const C = useC();
  const color = rank === 1 ? C.red : rank === 2 ? C.orange : rank === 3 ? "#FFBF00" : C.muted;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 22, height: 16, fontSize: 8, fontWeight: 900,
      border: `1px solid ${color}`, color, letterSpacing: "0.06em",
      marginRight: 6, flexShrink: 0,
    }}>
      #{rank}
    </span>
  );
}

/** CVSS severity badge */
function SeverityBadge({ score }: { score: number | null }) {
  const C = useC();
  if (score === null || score === undefined || isNaN(score)) {
    return <span style={{ color: C.muted, fontSize: 10 }}>—</span>;
  }
  const { label, color } =
    score >= 9   ? { label: "CRITICAL", color: "#FF0033" } :
    score >= 7   ? { label: "HIGH",     color: C.red      } :
    score >= 4   ? { label: "MEDIUM",   color: C.orange   } :
    score > 0    ? { label: "LOW",      color: "#FFBF00"  } :
                   { label: "INFO",     color: C.muted    };
  return (
    <span style={{
      display: "inline-block", fontSize: 9, fontWeight: 700,
      letterSpacing: "0.12em", padding: "2px 8px",
      border: `1px solid ${color}`, color,
      background: `${color}18`,
    }}>
      {label}
    </span>
  );
}

/** Mini CVSS bar */
function CvssBar({ score }: { score: number }) {
  const C = useC();
  const pct = Math.min((score / 10) * 100, 100);
  const color = score >= 9 ? "#FF0033" : score >= 7 ? C.red : score >= 4 ? C.orange : "#FFBF00";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 70, height: 5, background: C.border, flexShrink: 0 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, boxShadow: `0 0 4px ${color}88` }} />
      </div>
      <span style={{ color, fontWeight: 700, fontSize: 12, minWidth: 32 }}>{score.toFixed(1)}</span>
    </div>
  );
}

/** Mini EPSS probability bar */
function EpssBar({ value }: { value: number }) {
  const C = useC();
  const pct = Math.min(value * 100, 100);
  const color = pct >= 50 ? "#FF0033" : pct >= 20 ? C.red : pct >= 5 ? C.orange : "#FFBF00";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 70, height: 5, background: C.border, flexShrink: 0 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, boxShadow: `0 0 4px ${color}88` }} />
      </div>
      <span style={{ color, fontWeight: 700, fontSize: 12, minWidth: 40 }}>
        {(value * 100).toFixed(1)}%
      </span>
    </div>
  );
}

/** Render `["item1","item2"]` JSON strings as inline pills */
function JsonPills({ value, color: colorProp }: { value: unknown; color?: string }) {
  const C = useC();
  const color = colorProp ?? C.muted;
  let items: string[];
  try {
    const parsed = JSON.parse(String(value));
    items = Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
  } catch {
    items = String(value).replace(/[\[\]"']/g, "").split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (!items.length) return <span style={{ color: C.muted, fontSize: 9 }}>—</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
      {items.map((item, i) => (
        <span key={i} style={{
          fontSize: 8.5, padding: "1px 6px",
          border: `1px solid ${color}55`, color,
          background: `${color}12`, letterSpacing: "0.06em",
          whiteSpace: "nowrap",
        }}>
          {item}
        </span>
      ))}
    </div>
  );
}

/** MITRE technique ID chip: T1234 or T1234.001 */
function MitreChip({ id }: { id: string }) {
  const C = useC();
  if (!id) return <span style={{ color: C.muted, fontSize: 9 }}>—</span>;
  return (
    <span style={{
      display: "inline-block", fontSize: 8, fontWeight: 700,
      letterSpacing: "0.1em", padding: "1px 5px",
      border: `1px solid ${C.red}66`, color: C.red,
      background: `${C.red}12`, fontFamily: C.mono,
    }}>
      {id}
    </span>
  );
}

/** Stat banner — compact row of icon+label+value chips */
function StatBanner({ items }: { items: { icon: React.ElementType; label: string; value: string|number; color?: string }[] }) {
  const C = useC();
  return (
    <div style={{
      display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16,
      padding: "10px 14px", border: `1px solid ${C.border}`,
      background: C.accentFaint,
    }}>
      {items.map(({ icon: Icon, label, value, color: col }, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10 }}>
          <Icon size={11} color={col ?? C.red} />
          <span style={{ color: C.muted, letterSpacing: "0.12em", fontSize: 9 }}>{label}</span>
          <span style={{ color: col ?? C.white, fontWeight: 700 }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

/** Colored count badge */
function CountBadge({ value, color: colorProp }: { value: number; color?: string }) {
  const C = useC();
  const color = colorProp ?? C.red;
  return (
    <span style={{
      display: "inline-block", minWidth: 24, textAlign: "center",
      fontSize: 9, fontWeight: 900, padding: "2px 6px",
      background: `${color}22`, border: `1px solid ${color}55`,
      color, letterSpacing: "0.08em",
    }}>
      {value}
    </span>
  );
}

// ─── Dashboard pages ──────────────────────────────────────────────────────────
function IocGeoPage() {
  const C = useC();
  const { data: d, loading, error } = useFetch<Record<string, unknown>>("/api/dashboard/iocs-geo");
  if (loading) return <PageLoading />;
  if (error)   return <PageError />;
  const data = d ?? {} as Record<string, unknown>;
  const countryOrigin = (data.country_origin as Slice[]) ?? [];
  return (
    <Col>
      <Stats cols={3}>
        <StatCard label="TOTAL IOCs"     value={String(data.total_iocs ?? "—")}             icon={Crosshair} />
        <StatCard label="CAMPAIGNS"      value={String(data.campaigns_total ?? "—")}         icon={Radio} />
        <StatCard label="TOTAL ASN"      value={String(data.total_asn ?? "—")}               icon={Server} />
        <StatCard label="TOTAL IPs"      value={String(data.total_ips ?? "—")}    color={C.white} icon={Wifi} />
        <StatCard label="COUNTRIES"      value={String(data.total_countries ?? "—")} color={C.white} icon={Globe} />
        <StatCard label="ATTACK VECTORS" value={String(data.attack_vectors_total ?? "—")} color={C.white} icon={Zap} />
      </Stats>

      {/* Full-width world map */}
      <HudCard title="GLOBAL THREAT ORIGIN MAP">
        <div style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 8, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>
          <MapPin size={10} color={C.red} />
          <span>IOC ORIGIN BY COUNTRY — EQUIRECTANGULAR PROJECTION — HOVER FOR DETAILS</span>
        </div>
        <WorldMap data={countryOrigin} colors={C} />
      </HudCard>

      {/* Country ranking (scrollable, all countries) + IOC type side by side */}
      <Row>
        <HudCard title="COUNTRY RANKING — IOC ORIGIN">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>
            <Flag size={10} color={C.red} />
            <span>ALL THREAT-ORIGINATING COUNTRIES ({countryOrigin.length})</span>
          </div>
          <div style={{ maxHeight: 360, overflowY: "auto", paddingRight: 4 }}>
            <BarList data={countryOrigin} />
          </div>
        </HudCard>
        <HudCard title="IOC TYPES BREAKDOWN">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>
            <Activity size={10} color={C.red} />
            <span>DISTRIBUTION BY IOC CATEGORY</span>
          </div>
          <DonutChart data={(data.ioc_types as Slice[]) ?? []} />
        </HudCard>
      </Row>

      <Row>
        <HudCard title="IOC HOSTING — TOP ASN ORGS">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>
            <Server size={10} color={C.red} />
            <span>AUTONOMOUS SYSTEM HOSTING BREAKDOWN</span>
          </div>
          <AsnBarList data={(data.ioc_hosting as Slice[]) ?? []} />
        </HudCard>
        <HudCard title="ASN INFRASTRUCTURE TYPES">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>
            <Cpu size={10} color={C.red} />
            <span>NETWORK INFRASTRUCTURE CLASSIFICATION</span>
          </div>
          <BarList data={(data.asn_types as Slice[]) ?? []} />
        </HudCard>
      </Row>

      <HudCard title="IPs WITH MOST CONNECTIONS">
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>
          <TrendingUp size={10} color={C.red} />
          <span>HIGH-DEGREE IOC NODES — SORTED BY CONNECTION COUNT</span>
        </div>
        <HudTable columns={["ip_address","connection_count"]} rows={(data.top_ips as Record<string,unknown>[]) ?? []} />
      </HudCard>
    </Col>
  );
}


function IntrusionSetPage() {
  const C = useC();
  const { data: d, loading, error } = useFetch<Record<string, unknown>>("/api/dashboard/intrusion-set");
  if (loading) return <PageLoading />;
  if (error)   return <PageError />;
  const data        = d ?? {} as Record<string, unknown>;
  const groups      = (data.most_dangerous as Record<string,unknown>[]) ?? [];
  const aliases     = (data.aliases        as Record<string,unknown>[]) ?? [];
  const maxCampaigns = Math.max(...groups.map((g) => Number(g.total ?? 0)), 1);

  return (
    <Col>
      <StatBanner items={[
        { icon: Swords,    label: "APT GROUPS",     value: groups.length   },
        { icon: Radio,     label: "TOTAL CAMPAIGNS", value: groups.reduce((s,g) => s + Number(g.total ?? 0), 0) },
        { icon: Users,     label: "WITH ALIASES",    value: aliases.length, color: C.orange },
      ]} />

      <HudCard title="MOST DANGEROUS GROUPS — RANKED BY CAMPAIGNS">
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, fontSize: 10, color: C.muted, letterSpacing: "0.14em" }}>
          <Swords size={11} color={C.red} /><span>INTRUSION SETS SORTED BY CAMPAIGN COUNT</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {/* header */}
          <div style={{ display: "grid", gridTemplateColumns: "44px 240px 1fr 80px", gap: 10, padding: "8px 14px", borderBottom: `1px solid ${C.redDim}`, fontSize: 10, color: C.red, letterSpacing: "0.12em", fontWeight: 700 }}>
            <span>#</span><span>GROUP</span><span>CAMPAIGNS</span><span style={{ textAlign: "right" }}>COUNT</span>
          </div>
          {groups.map((row, i) => {
            const total = Number(row.total ?? 0);
            const pct   = (total / maxCampaigns) * 100;
            const barColor = i === 0 ? "#FF0033" : i === 1 ? C.red : i === 2 ? C.orange : C.muted;
            let campaigns: string[] = [];
            try { campaigns = JSON.parse(String(row.campaigns)); } catch { campaigns = String(row.campaigns ?? "").split(",").map(s => s.trim()).filter(Boolean); }
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "44px 240px 1fr 80px", gap: 10, padding: "14px 14px", borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : C.altRow, alignItems: "start" }}>
                <RankBadge rank={i + 1} />
                <div>
                  <div style={{ color: C.white, fontWeight: 700, fontSize: 14, marginBottom: 5 }}>{String(row.group ?? "—")}</div>
                  <div style={{ height: 4, background: C.border, width: "100%", marginTop: 6 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: barColor, boxShadow: `0 0 5px ${barColor}88` }} />
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "flex-start" }}>
                  {campaigns.slice(0, 5).map((c, ci) => (
                    <span key={ci} style={{ fontSize: 10, padding: "2px 8px", border: `1px solid ${C.border}`, color: C.muted, background: C.accentFaint, whiteSpace: "nowrap" }}>
                      {c.length > 32 ? c.slice(0, 30) + "…" : c}
                    </span>
                  ))}
                  {campaigns.length > 5 && <span style={{ fontSize: 10, color: C.muted }}>+{campaigns.length - 5}</span>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <CountBadge value={total} color={barColor} />
                </div>
              </div>
            );
          })}
        </div>
      </HudCard>

      <HudCard title="KNOWN INTRUSION SET ALIASES">
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, fontSize: 10, color: C.muted, letterSpacing: "0.14em" }}>
          <Users size={11} color={C.red} /><span>ALTERNATIVE NAMES AND TRACKING IDS</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 10, padding: "8px 14px", borderBottom: `1px solid ${C.redDim}`, fontSize: 10, color: C.red, letterSpacing: "0.12em", fontWeight: 700 }}>
            <span><Users size={9} color={C.red} style={{ marginRight: 5 }} />NAME</span><span>ALIASES</span>
          </div>
          {aliases.map((row, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 10, padding: "12px 14px", borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : C.altRow, alignItems: "start" }}>
              <div style={{ color: C.white, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <Shield size={11} color={C.red} />{String(row.name ?? "—")}
              </div>
              <JsonPills value={row.aliases} color={C.muted} />
            </div>
          ))}
        </div>
      </HudCard>
    </Col>
  );
}

// ─── IPs & DOMAINS — with sub-tabs ───────────────────────────────────────────
type IpDomTab = "domains" | "dns" | "indicators";
const IP_DOM_TABS: { id: IpDomTab; label: string }[] = [
  { id: "domains",    label: "DOMAINS & TLDs"   },
  { id: "dns",        label: "DNS THREAT FLAGS"  },
  { id: "indicators", label: "INDICATORS"        },
];

function IpsDomainsPage() {
  const C = useC();
  const { data: d, loading, error } = useFetch<Record<string, unknown>>("/api/dashboard/ips-domains");
  const [subTab, setSubTab] = useState<IpDomTab>("domains");

  if (loading) return <PageLoading />;
  if (error)   return <PageError />;
  const data  = d ?? {} as Record<string, unknown>;
  const flags = (data.dns_flags as Record<string, number>) ?? {};

  return (
    <Col>
      <SubNav tabs={IP_DOM_TABS} active={subTab} onChange={setSubTab} />

      {subTab === "domains" && (
        <Col>
          <Row>
            <HudCard title="LATEST ENRICHED DOMAINS">
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>
                <Globe size={10} color={C.red} /><span>RECENTLY ENRICHED DOMAIN IOCs</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {(data.last_domains as Record<string,unknown>[])?.map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : C.altRow }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                      <Link2 size={11} color={C.red} style={{ flexShrink: 0 }} />
                      <span style={{ color: C.white, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {String(row.domain_name ?? "—")}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0, marginLeft: 12 }}>
                      <Clock size={9} color={C.muted} />
                      <span style={{ color: C.muted, fontSize: 10 }}>{String(row.last_seen ?? "—")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </HudCard>
            <HudCard title="TOP LEVEL DOMAIN DISTRIBUTION">
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>
                <Globe size={10} color={C.red} /><span>TLD BREAKDOWN BY COUNT</span>
              </div>
              <DonutChart data={(data.top_tlds as Slice[]) ?? []} size="lg" />
            </HudCard>
          </Row>
          <HudCard title="DOMAINS RESOLVING TO SAME IP">
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>
              <Network size={10} color={C.red} /><span>SHARED INFRASTRUCTURE — MULTIPLE DOMAINS → SINGLE IP</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: C.red, fontSize: 10, letterSpacing: "0.12em", borderBottom: `1px solid ${C.redDim}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Link2 size={9} color={C.red} />DOMAIN</div>
                    </th>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: C.red, fontSize: 10, letterSpacing: "0.12em", borderBottom: `1px solid ${C.redDim}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Wifi size={9} color={C.red} />RESOLVED IP</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(data.domain_ip as Record<string,unknown>[])?.map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : C.altRow }}>
                      <td style={{ padding: "8px 12px", color: C.white }}>{String(row.domain ?? "—")}</td>
                      <td style={{ padding: "8px 12px", color: C.red, fontFamily: C.mono, fontWeight: 700 }}>{String(row.resolved_ip ?? "—")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </HudCard>
        </Col>
      )}

      {subTab === "dns" && (
        <Col>
          {/* Big flag counts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14 }}>
            {([
              { key: "cloudflare_flags", label: "CLOUDFLARE", icon: Flame,      color: "#F48120" },
              { key: "dns4eu_flags",     label: "DNS4EU",     icon: Shield,     color: C.red     },
              { key: "ultradns_flags",   label: "ULTRADNS",   icon: Network,    color: "#00BCEB" },
              { key: "total_analyzed",   label: "ANALYZED",   icon: Database,   color: C.white   },
            ] as { key: string; label: string; icon: typeof Flame; color: string }[]).map(({ key, label, icon: Icon, color }) => (
              <div key={key} style={{ padding: "16px 18px", border: `1px solid ${key === "total_analyzed" ? C.border : color + "55"}`, position: "relative", background: `${color}08`, textAlign: "center" }}>
                <Brackets size={7} color={key === "total_analyzed" ? C.border : color} />
                <Icon size={18} color={color} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 34, fontWeight: 900, color, lineHeight: 1, textShadow: `0 0 18px ${color}60` }}>
                  {(flags[key] ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 8, color: C.muted, letterSpacing: "0.18em", marginTop: 6 }}>{label} FLAGS</div>
              </div>
            ))}
          </div>

          {/* Coverage bars */}
          <HudCard title="DETECTION COVERAGE — % OF TOTAL ANALYZED">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {([
                { key: "cloudflare_flags", label: "CLOUDFLARE",  icon: Flame,   color: "#F48120" },
                { key: "dns4eu_flags",     label: "DNS4EU",      icon: Shield,  color: C.red     },
                { key: "ultradns_flags",   label: "ULTRADNS",    icon: Network, color: "#00BCEB" },
              ] as { key: string; label: string; icon: typeof Flame; color: string }[]).map(({ key, label, icon: Icon, color }) => {
                const v     = flags[key] ?? 0;
                const total = flags.total_analyzed || 1;
                const pct   = (v / total) * 100;
                return (
                  <div key={key}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: C.muted }}>
                        <Icon size={11} color={color} />{label}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 10, color: C.muted }}>{v.toLocaleString()} / {(total).toLocaleString()}</span>
                        <span style={{ fontSize: 14, fontWeight: 900, color, minWidth: 50, textAlign: "right" }}>{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: C.border }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: color, boxShadow: `0 0 6px ${color}88`, transition: "width 0.8s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </HudCard>
        </Col>
      )}

      {subTab === "indicators" && (
        <Col>
          <Row>
            <HudCard title="INDICATOR TYPES BREAKDOWN">
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>
                <Target size={10} color={C.red} /><span>STIX INDICATOR TYPE DISTRIBUTION</span>
              </div>
              <DonutChart data={(data.indicator_types as Slice[]) ?? []} size="lg" />
            </HudCard>
            <HudCard title="INDICATORS — MULTIPLE MALWARE FAMILIES">
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>
                <Bug size={10} color={C.red} /><span>INDICATORS LINKED TO 2+ MALWARE FAMILIES</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 1fr", gap: 8, padding: "6px 10px", borderBottom: `1px solid ${C.redDim}`, fontSize: 9, color: C.red, letterSpacing: "0.12em", fontWeight: 700 }}>
                  <span>INDICATOR</span><span style={{ textAlign: "center" }}>LINKS</span><span>FAMILIES</span>
                </div>
                {(data.indicator_malware as Record<string,unknown>[])?.map((row, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 60px 1fr", gap: 8, padding: "7px 10px", borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : C.altRow, alignItems: "start" }}>
                    <span style={{ color: C.white, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(row.indicator ?? "—")}</span>
                    <div style={{ textAlign: "center" }}><CountBadge value={Number(row.connection_count ?? 0)} /></div>
                    <JsonPills value={row.malware_families} color={C.orange} />
                  </div>
                ))}
              </div>
            </HudCard>
          </Row>
        </Col>
      )}
    </Col>
  );
}

function TechniquesPage() {
  const C = useC();
  const { data: d, loading, error } = useFetch<Record<string, unknown>>("/api/dashboard/techniques");
  if (loading) return <PageLoading />;
  if (error)   return <PageError />;
  const data = d ?? {} as Record<string, unknown>;
  return (
    <Col>
      <HudCard title="MOST TARGETED PLATFORMS">
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>
          <Monitor size={10} color={C.red} />
          <span>MALWARE PLATFORM TARGETS — AGGREGATED ACROSS ALL FAMILIES</span>
        </div>
        <PlatformGrid data={(data.targeted_os as Slice[]) ?? []} />
      </HudCard>
      <Row>
        <HudCard title="BIGGEST INTRUSION SETS — MALWARE ARSENAL">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>
            <Swords size={10} color={C.red} /><span>APT GROUPS SORTED BY TOOLS COUNT</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 50px", gap: 8, padding: "6px 10px", borderBottom: `1px solid ${C.redDim}`, fontSize: 9, color: C.red, letterSpacing: "0.12em", fontWeight: 700 }}>
              <span>ACTOR</span><span>TOOLS</span><span style={{ textAlign: "right" }}>#</span>
            </div>
            {(data.biggest_groups as Record<string,unknown>[])?.map((row, i) => {
              const max = Math.max(...((data.biggest_groups as Record<string,unknown>[]) ?? []).map((g) => Number(g.tool_count ?? 0)), 1);
              const pct = (Number(row.tool_count ?? 0) / max) * 100;
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "140px 1fr 50px", gap: 8, padding: "7px 10px", borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : C.altRow, alignItems: "start" }}>
                  <div style={{ color: C.white, fontWeight: 700, fontSize: 10 }}>{String(row.threat_actor ?? "—")}</div>
                  <div>
                    <JsonPills value={row.malware_tools} color={C.red} />
                    <div style={{ height: 2, background: C.border, marginTop: 5 }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: C.red, boxShadow: `0 0 4px ${C.red}88` }} />
                    </div>
                  </div>
                  <CountBadge value={Number(row.tool_count ?? 0)} />
                </div>
              );
            })}
          </div>
        </HudCard>
        <HudCard title="MOST USED TECHNIQUES">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>
            <Layers size={10} color={C.red} /><span>TECHNIQUES USED ACROSS MOST THREAT ACTORS</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 60px", gap: 8, padding: "6px 10px", borderBottom: `1px solid ${C.redDim}`, fontSize: 9, color: C.red, letterSpacing: "0.12em", fontWeight: 700 }}>
              <span>TECHNIQUE</span><span style={{ textAlign: "right" }}>ACTORS</span>
            </div>
            {(data.most_used_techniques as Record<string,unknown>[])?.map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 60px", gap: 8, padding: "7px 10px", borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : C.altRow, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <ChevronRight size={9} color={C.red} style={{ flexShrink: 0 }} />
                  <span style={{ color: C.white, fontSize: 11 }}>{String(row.technique_name ?? "—")}</span>
                </div>
                <CountBadge value={Number(row.actor_count ?? 0)} />
              </div>
            ))}
          </div>
        </HudCard>
      </Row>
      <Row>
        <HudCard title="BEST MITIGATIONS">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>
            <CheckCircle size={10} color={C.green} /><span>MITIGATIONS COVERING MOST TECHNIQUES</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 8, padding: "6px 10px", borderBottom: `1px solid ${C.redDim}`, fontSize: 9, color: C.red, letterSpacing: "0.12em", fontWeight: 700 }}>
              <span>MITIGATION</span><span style={{ textAlign: "right" }}>TECHNIQUES</span>
            </div>
            {(data.mitigations as Record<string,unknown>[])?.map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 8, padding: "7px 10px", borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : C.altRow, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle size={9} color={C.green} style={{ flexShrink: 0 }} />
                  <span style={{ color: C.white, fontSize: 11 }}>{String(row.mitigation ?? "—")}</span>
                </div>
                <CountBadge value={Number(row.techniques_covered ?? 0)} color={C.green} />
              </div>
            ))}
          </div>
        </HudCard>
        <HudCard title="UNMITIGATED TECHNIQUES">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>
            <ShieldAlert size={10} color={C.orange} /><span>TECHNIQUES WITH NO MITIGATIONS — {(data.unmitigated as unknown[])?.length ?? 0} FOUND</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, maxHeight: 320, overflowY: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 8, padding: "6px 10px", borderBottom: `1px solid ${C.redDim}`, fontSize: 9, color: C.red, letterSpacing: "0.12em", fontWeight: 700 }}>
              <span>TECHNIQUE</span><span>MITRE ID</span>
            </div>
            {(data.unmitigated as Record<string,unknown>[])?.map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 8, padding: "6px 10px", borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : C.altRow, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertTriangle size={8} color={C.orange} style={{ flexShrink: 0 }} />
                  <span style={{ color: C.muted, fontSize: 10 }}>{String(row.technique ?? "—")}</span>
                </div>
                <MitreChip id={String(row.technique_id ?? "")} />
              </div>
            ))}
          </div>
        </HudCard>
      </Row>
    </Col>
  );
}

function CvesPage() {
  const C = useC();
  const { data: d, loading, error } = useFetch<Record<string, unknown>>("/api/dashboard/cves");
  if (loading) return <PageLoading />;
  if (error)   return <PageError />;
  const data = d ?? {} as Record<string, unknown>;
  const epss = (data.highest_epss    as Record<string,unknown>[]) ?? [];
  const kev  = (data.known_exploited as Record<string,unknown>[]) ?? [];
  const topEpss = epss[0]?.exploit_probability;

  return (
    <Col>
      <Stats cols={4}>
        <StatCard label="TOTAL CVEs"            value={String(data.total_cves ?? "—")}       icon={Bug} />
        <StatCard label="KEV — KNOWN EXPLOITED" value={String(kev.length ?? "—")}  color={C.orange} icon={Zap} />
        <StatCard label="TOP EPSS SCORE"        value={topEpss ? `${(Number(topEpss)*100).toFixed(1)}%` : "—"} color={C.white} icon={TrendingUp} />
        <StatCard label="TARGETED SOFTWARE"     value={String((data.targeted_software as unknown[])?.length ?? "—")} color={C.white} icon={Lock} />
      </Stats>

      <Row>
        {/* EPSS table */}
        <HudCard title="HIGHEST EXPLOIT PROBABILITY (EPSS)">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 10, color: C.muted, letterSpacing: "0.14em" }}>
            <TrendingUp size={11} color={C.red} /><span>VULNERABILITY EXPLOIT PREDICTION SCORING SYSTEM</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "130px 110px 1fr", gap: 10, padding: "8px 12px", borderBottom: `1px solid ${C.redDim}`, fontSize: 10, color: C.red, letterSpacing: "0.12em", fontWeight: 700 }}>
              <span>CVE ID</span><span>SEVERITY</span><span>EPSS PROBABILITY</span>
            </div>
            {epss.map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "130px 110px 1fr", gap: 10, padding: "10px 12px", borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : C.altRow, alignItems: "center" }}>
                <span style={{ color: C.red, fontFamily: C.mono, fontWeight: 700, fontSize: 12 }}>{String(row.cve ?? "—")}</span>
                <SeverityBadge score={parseFloat(String(row.severity ?? row.cvss ?? "0"))} />
                <EpssBar value={parseFloat(String(row.exploit_probability ?? "0"))} />
              </div>
            ))}
          </div>
        </HudCard>
        <HudCard title="ATTACK VECTOR DISTRIBUTION">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 10, color: C.muted, letterSpacing: "0.14em" }}>
            <Target size={11} color={C.red} /><span>CVE ATTACK VECTOR CLASSIFICATION</span>
          </div>
          <DonutChart data={(data.attack_vectors as Slice[]) ?? []} size="lg" />
        </HudCard>
      </Row>

      <HudCard title="KNOWN EXPLOITED CVEs (KEV) — ORDERED BY CVSS">
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 10, color: C.muted, letterSpacing: "0.14em" }}>
          <Zap size={11} color={C.orange} /><span>CISA KEV CATALOG — ACTIVELY EXPLOITED IN THE WILD</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "130px 140px 1fr", gap: 10, padding: "8px 12px", borderBottom: `1px solid ${C.redDim}`, fontSize: 10, color: C.red, letterSpacing: "0.12em", fontWeight: 700 }}>
            <span>CVE ID</span><span>CVSS SCORE</span><span>TITLE</span>
          </div>
          {kev.map((row, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "130px 140px 1fr", gap: 10, padding: "10px 12px", borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : C.altRow, alignItems: "center" }}>
              <span style={{ color: C.red, fontFamily: C.mono, fontWeight: 700, fontSize: 12 }}>{String(row.cve ?? "—")}</span>
              <CvssBar score={parseFloat(String(row.cvss ?? "0"))} />
              <span style={{ color: C.muted, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={String(row.title ?? "")}>
                {String(row.title ?? "—")}
              </span>
            </div>
          ))}
        </div>
      </HudCard>

      <Row>
        <HudCard title="MOST TARGETED SOFTWARE">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 10, color: C.muted, letterSpacing: "0.14em" }}>
            <HardDrive size={11} color={C.red} /><span>SOFTWARE PRODUCTS WITH MOST CVEs</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 70px", gap: 10, padding: "8px 12px", borderBottom: `1px solid ${C.redDim}`, fontSize: 10, color: C.red, letterSpacing: "0.12em", fontWeight: 700 }}>
              <span>PRODUCT</span><span>CPE CODE</span><span style={{ textAlign: "right" }}>CVEs</span>
            </div>
            {(data.targeted_software as Record<string,unknown>[])?.map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 1fr 70px", gap: 10, padding: "9px 12px", borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : C.altRow, alignItems: "center" }}>
                <span style={{ color: C.white, fontWeight: 700, fontSize: 13 }}>{String(row.product ?? "—")}</span>
                <span style={{ color: C.muted, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: C.mono }}>{String(row.cpe_code ?? "—")}</span>
                <CountBadge value={Number(row.total_vulns ?? 0)} />
              </div>
            ))}
          </div>
        </HudCard>
        <HudCard title="PATCH REFERENCES">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 10, color: C.muted, letterSpacing: "0.14em" }}>
            <ExternalLink size={11} color={C.red} /><span>OFFICIAL PATCH & FIX URLS</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "120px 80px 1fr", gap: 10, padding: "8px 12px", borderBottom: `1px solid ${C.redDim}`, fontSize: 10, color: C.red, letterSpacing: "0.12em", fontWeight: 700 }}>
              <span>CVE</span><span>TYPE</span><span>URL</span>
            </div>
            {(data.url_fixes as Record<string,unknown>[])?.map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 80px 1fr", gap: 10, padding: "9px 12px", borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : C.altRow, alignItems: "center" }}>
                <span style={{ color: C.red, fontFamily: C.mono, fontWeight: 700, fontSize: 12 }}>{String(row.cve ?? "—")}</span>
                <span style={{ color: C.orange, fontSize: 10 }}>{String(row.type ?? "—").toUpperCase()}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                  <ExternalLink size={9} color={C.muted} style={{ flexShrink: 0 }} />
                  <span style={{ color: C.muted, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(row.fix_url ?? "—")}</span>
                </div>
              </div>
            ))}
          </div>
        </HudCard>
      </Row>
    </Col>
  );
}

function MalwarePage() {
  const C = useC();
  const { data: d, loading, error } = useFetch<Record<string, unknown>>("/api/dashboard/malware");
  if (loading) return <PageLoading />;
  if (error)   return <PageError />;
  const data        = d ?? {} as Record<string, unknown>;
  const aptMalware  = (data.apt_malware   as Record<string,unknown>[]) ?? [];
  const shared      = (data.shared_malware as Record<string,unknown>[]) ?? [];
  const aliases     = (data.aliases        as Record<string,unknown>[]) ?? [];
  const maxArsenal  = Math.max(...aptMalware.map((g) => Number(g.arsenal_size ?? 0)), 1);
  const maxGroupCnt = Math.max(...shared.map((s) => Number(s.group_count ?? 0)), 1);

  return (
    <Col>
      <StatBanner items={[
        { icon: Bug,       label: "MALWARE FAMILIES",  value: (data.targeted_platforms as unknown[])?.length ?? "—" },
        { icon: Swords,    label: "APT GROUPS W/ TOOLS", value: aptMalware.length },
        { icon: GitBranch, label: "SHARED TOOLS",        value: shared.length, color: C.orange },
        { icon: BookOpen,  label: "WITH ALIASES",         value: aliases.length, color: C.white },
      ]} />

      <Row>
        <HudCard title="MOST TARGETED PLATFORMS">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 10, color: C.muted, letterSpacing: "0.14em" }}>
            <Monitor size={11} color={C.red} /><span>MALWARE FAMILY PLATFORM TARGETING</span>
          </div>
          <DonutChart data={(data.targeted_platforms as Slice[]) ?? []} size="lg" />
        </HudCard>
        <HudCard title="TOP MITRE CONTRIBUTORS">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 10, color: C.muted, letterSpacing: "0.14em" }}>
            <BookOpen size={11} color={C.red} /><span>CONTRIBUTORS BY MALWARE REPORTED</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {(data.top_reporters as Record<string,unknown>[])?.map((row, i) => {
              const maxRep = Math.max(...((data.top_reporters as Record<string,unknown>[]) ?? []).map((r) => Number(r.malware_reported ?? 0)), 1);
              const pct = (Number(row.malware_reported ?? 0) / maxRep) * 100;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : C.altRow }}>
                  <RankBadge rank={i + 1} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: C.white, fontSize: 13, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(row.contributor ?? "—")}</div>
                    <div style={{ height: 3, background: C.border }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: C.red, boxShadow: `0 0 3px ${C.red}88` }} />
                    </div>
                  </div>
                  <CountBadge value={Number(row.malware_reported ?? 0)} />
                </div>
              );
            })}
          </div>
        </HudCard>
      </Row>

      <HudCard title="MALWARE ARSENAL BY APT GROUP">
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 10, color: C.muted, letterSpacing: "0.14em" }}>
          <Swords size={11} color={C.red} /><span>TOOLS AND MALWARE PER THREAT ACTOR</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 80px", gap: 10, padding: "8px 12px", borderBottom: `1px solid ${C.redDim}`, fontSize: 10, color: C.red, letterSpacing: "0.12em", fontWeight: 700 }}>
            <span>APT GROUP</span><span>TOOLS USED</span><span style={{ textAlign: "right" }}>SIZE</span>
          </div>
          {aptMalware.map((row, i) => {
            const pct = (Number(row.arsenal_size ?? 0) / maxArsenal) * 100;
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr 80px", gap: 10, padding: "12px 12px", borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : C.altRow, alignItems: "start" }}>
                <div>
                  <div style={{ color: C.white, fontWeight: 700, fontSize: 13, marginBottom: 5 }}>{String(row.group_name ?? "—")}</div>
                  <div style={{ height: 3, background: C.border }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: C.red, boxShadow: `0 0 4px ${C.red}88` }} />
                  </div>
                </div>
                <JsonPills value={row.tools_used} color={C.red} />
                <CountBadge value={Number(row.arsenal_size ?? 0)} />
              </div>
            );
          })}
        </div>
      </HudCard>

      <HudCard title="SHARED MALWARE — USED BY MULTIPLE GROUPS">
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 10, color: C.muted, letterSpacing: "0.14em" }}>
          <GitBranch size={11} color={C.orange} /><span>CROSS-GROUP TOOL SHARING — INDICATES COMMON TRADECRAFT</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 70px", gap: 10, padding: "8px 12px", borderBottom: `1px solid ${C.redDim}`, fontSize: 10, color: C.red, letterSpacing: "0.12em", fontWeight: 700 }}>
            <span>MALWARE</span><span>GROUPS USING IT</span><span style={{ textAlign: "right" }}>GROUPS</span>
          </div>
          {shared.map((row, i) => {
            const pct = (Number(row.group_count ?? 0) / maxGroupCnt) * 100;
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr 70px", gap: 10, padding: "12px 12px", borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : C.altRow, alignItems: "start" }}>
                <div>
                  <div style={{ color: C.orange, fontWeight: 700, fontSize: 13, marginBottom: 5 }}>{String(row.shared_malware ?? "—")}</div>
                  <div style={{ height: 3, background: C.border }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: C.orange, boxShadow: `0 0 4px ${C.orange}88` }} />
                  </div>
                </div>
                <JsonPills value={row.groups} color={C.muted} />
                <CountBadge value={Number(row.group_count ?? 0)} color={C.orange} />
              </div>
            );
          })}
        </div>
      </HudCard>

      <Row>
        <HudCard title="MALWARE ALIASES">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 10, color: C.muted, letterSpacing: "0.14em" }}>
            <BookOpen size={11} color={C.red} /><span>PRIMARY NAMES AND ALTERNATE TRACKING IDS</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {aliases.map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 10, padding: "10px 12px", borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : C.altRow, alignItems: "start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Bug size={11} color={C.red} style={{ flexShrink: 0 }} />
                  <span style={{ color: C.white, fontWeight: 700, fontSize: 13 }}>{String(row.primary_name ?? "—")}</span>
                </div>
                <JsonPills value={row.known_aliases} color={C.muted} />
              </div>
            ))}
          </div>
        </HudCard>
        <HudCard title="SHARED TECHNIQUES">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 10, color: C.muted, letterSpacing: "0.14em" }}>
            <Layers size={11} color={C.red} /><span>TECHNIQUES SHARED ACROSS MALWARE FAMILIES</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 80px", gap: 10, padding: "8px 12px", borderBottom: `1px solid ${C.redDim}`, fontSize: 10, color: C.red, letterSpacing: "0.12em", fontWeight: 700 }}>
              <span>TECHNIQUE</span><span>FAMILIES</span><span>MITRE ID</span>
            </div>
            {(data.shared_techniques as Record<string,unknown>[])?.map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 90px 80px", gap: 10, padding: "10px 12px", borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : C.altRow, alignItems: "start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <ChevronRight size={9} color={C.red} style={{ flexShrink: 0 }} />
                  <span style={{ color: C.muted, fontSize: 12 }}>{String(row.shared_technique ?? "—")}</span>
                </div>
                <JsonPills value={row.used_in_malware_families} color={C.muted} />
                <MitreChip id={String(row.mitre_id ?? "")} />
              </div>
            ))}
          </div>
        </HudCard>
      </Row>
    </Col>
  );
}

function NodeStatusPage() {
  const C = useC();
  const { data: d, loading, error } = useFetch<Record<string, unknown>>("/api/dashboard/node-status");
  if (loading) return <PageLoading />;
  if (error)   return <PageError />;
  const data        = d ?? {} as Record<string, unknown>;
  const nodeTypes   = (data.node_types   as Slice[]) ?? [];
  const relTypes    = (data.rel_types    as Slice[]) ?? [];
  const ingestion   = (data.ingestion_type as Slice[]) ?? [];
  const density     = (data.data_density as Record<string,unknown>[]) ?? [];
  const unconnected = (data.unconnected  as Record<string,unknown>[]) ?? [];

  const totalNodes = nodeTypes.reduce((s, n) => s + n.value, 0);
  const totalRels  = relTypes.reduce((s, r) => s + r.value, 0);
  const maxNodeVal = Math.max(...nodeTypes.map((n) => n.value), 1);
  const maxRelVal  = Math.max(...relTypes.map((r) => r.value), 1);
  const maxDensity = Math.max(...density.map((d) => Number(d.avg_properties ?? 0)), 1);

  return (
    <Col>
      <Stats cols={4}>
        <StatCard label="TOTAL NODES"         value={totalNodes.toLocaleString()}         icon={Database} />
        <StatCard label="TOTAL RELATIONSHIPS" value={totalRels.toLocaleString()}  color={C.orange} icon={GitBranch} />
        <StatCard label="NODE TYPES"          value={nodeTypes.length}            color={C.white}  icon={Layers} />
        <StatCard label="UNCONNECTED NODES"   value={unconnected.reduce((s,u) => s + Number(u.total ?? 0), 0).toLocaleString()} color={C.muted} icon={AlertTriangle} />
      </Stats>

      {/* Ingestion banner */}
      <HudCard title="INGESTION MEDIUM">
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>
          <BarChart2 size={10} color={C.red} /><span>DATA SOURCE BREAKDOWN</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12 }}>
          {ingestion.map((item, i) => {
            const icons: Record<string, React.ElementType> = { Disk: HardDrive, Kafka: Radio, Forge: Zap };
            const colors: Record<string, string> = { Disk: C.muted, Kafka: "#00BCEB", Forge: C.red };
            const Icon  = icons[item.label] ?? Database;
            const color = colors[item.label] ?? C.red;
            const total = ingestion.reduce((s, x) => s + x.value, 1);
            const pct   = (item.value / total) * 100;
            return (
              <div key={i} style={{ border: `1px solid ${color}55`, padding: "14px", position: "relative", background: `${color}08` }}>
                <Brackets size={6} color={color} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <Icon size={20} color={color} />
                  <span style={{ fontSize: 24, fontWeight: 900, color, textShadow: `0 0 14px ${color}60` }}>{item.value.toLocaleString()}</span>
                </div>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.16em", marginBottom: 6 }}>{item.label.toUpperCase()}</div>
                <div style={{ height: 3, background: C.border }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: color, boxShadow: `0 0 4px ${color}88` }} />
                </div>
                <div style={{ fontSize: 8, color: C.muted, marginTop: 4, textAlign: "right" }}>{pct.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </HudCard>

      <Row>
        {/* Node types as horizontal bar chart */}
        <HudCard title="NODE TYPE DISTRIBUTION">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>
            <Database size={10} color={C.red} /><span>ALL {nodeTypes.length} NODE TYPES — {totalNodes.toLocaleString()} TOTAL</span>
          </div>
          <div style={{ maxHeight: 340, overflowY: "auto", paddingRight: 4 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {nodeTypes.map((n, i) => {
                const pct = (n.value / maxNodeVal) * 100;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 120, textAlign: "right", color: C.muted, fontSize: 9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>{n.label}</div>
                    <div style={{ flex: 1, height: 10, background: C.border }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: C.red, boxShadow: `0 0 4px ${C.red}55` }} />
                    </div>
                    <div style={{ width: 60, textAlign: "right", color: C.red, fontWeight: 700, fontSize: 9, flexShrink: 0 }}>{n.value.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </HudCard>

        {/* Rel types + density */}
        <Col gap={16}>
          <HudCard title="RELATIONSHIP TYPES">
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>
              <GitBranch size={10} color={C.orange} /><span>{totalRels.toLocaleString()} TOTAL EDGES</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {relTypes.map((r, i) => {
                const pct = (r.value / maxRelVal) * 100;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 100, textAlign: "right", color: C.muted, fontSize: 9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>{r.label}</div>
                    <div style={{ flex: 1, height: 8, background: C.border }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: C.orange, boxShadow: `0 0 4px ${C.orange}55` }} />
                    </div>
                    <div style={{ width: 60, textAlign: "right", color: C.orange, fontWeight: 700, fontSize: 9, flexShrink: 0 }}>{r.value.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          </HudCard>
          <HudCard title="DATA DENSITY — AVG PROPERTIES">
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>
              <BarChart2 size={10} color={C.red} /><span>RICHNESS BY NODE TYPE</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "auto" }}>
              {density.map((row, i) => {
                const val = Number(row.avg_properties ?? 0);
                const pct = (val / maxDensity) * 100;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 120, textAlign: "right", color: C.muted, fontSize: 9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>{String(row.type ?? "—")}</div>
                    <div style={{ flex: 1, height: 8, background: C.border }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: C.green, boxShadow: `0 0 4px ${C.green}55` }} />
                    </div>
                    <div style={{ width: 36, textAlign: "right", color: C.green, fontWeight: 700, fontSize: 9, flexShrink: 0 }}>{val.toFixed(1)}</div>
                  </div>
                );
              })}
            </div>
          </HudCard>
        </Col>
      </Row>

      <HudCard title="UNCONNECTED NODES — ORPHAN ANALYSIS">
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>
          <AlertTriangle size={10} color={C.orange} /><span>NODES WITH NO RELATIONSHIPS — POTENTIAL DATA GAPS</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10 }}>
          {unconnected.map((row, i) => (
            <div key={i} style={{ padding: "10px 12px", border: `1px solid ${C.border}`, background: C.accentFaint, position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em" }}>{String(row.type ?? "—")}</span>
              <CountBadge value={Number(row.total ?? 0)} color={C.orange} />
            </div>
          ))}
        </div>
      </HudCard>
    </Col>
  );
}

// ─── Page component map ───────────────────────────────────────────────────────
const PAGE_COMPONENTS: Record<TabId, React.ComponentType> = {
  "iocs-geo":      IocGeoPage,
  "intrusion-set": IntrusionSetPage,
  "ips-domains":   IpsDomainsPage,
  "techniques":    TechniquesPage,
  "cves":          CvesPage,
  "malware":       MalwarePage,
  "node-status":   NodeStatusPage,
};

// ─── Root page ────────────────────────────────────────────────────────────────
export default function CustomDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("iocs-geo");
  const [clock, setClock] = useState("");
  const { C, isDark, toggle } = useTheme();
  const PageComponent = PAGE_COMPONENTS[activeTab];

  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().replace("T"," ").slice(0,19) + " UTC");
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <ThemeCtx.Provider value={C}>
      <div style={{
        background: C.bg, color: C.white, minHeight: "100vh",
        fontFamily: C.mono, fontSize: 13, position: "relative",
        overflowX: "hidden",
      }}>
        <Scanlines />

        {/* ── Top bar ── */}
        <header style={{
          borderBottom: `1px solid ${C.redDim}`, padding: "10px 24px 0",
          display: "flex", flexDirection: "column",
          background: C.accentFaint, position: "sticky", top: 0, zIndex: 200,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 3, height: 24, background: C.red, boxShadow: C.redGlow, flexShrink: 0 }} />
              <NologinLogo height={26} />
              <div style={{ width: 1, height: 22, background: C.border, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "0.38em" }}>SKYFALL_CTI</div>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.18em" }}>// THREAT_INTELLIGENCE_COMMAND_CENTER</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 10, color: C.muted }}>
              <span style={{ color: C.green, letterSpacing: "0.12em" }}>● NEO4J_CONNECTED</span>
              <span>{clock}</span>
              <button
                onClick={toggle}
                style={{
                  background: "none", border: `1px solid ${C.redDim}`,
                  color: C.muted, cursor: "pointer", padding: "4px 10px",
                  display: "flex", alignItems: "center", gap: 5,
                  fontFamily: C.mono, fontSize: 9, letterSpacing: "0.12em",
                }}
              >
                {isDark ? <Sun size={10} /> : <Moon size={10} />}
                {isDark ? "LIGHT" : "DARK"}
              </button>
            </div>
          </div>
          <div style={{ paddingBottom: 7, paddingLeft: 17 }}>
            <Breadcrumb />
          </div>
        </header>

        {/* ── Main tab nav ── */}
        <nav style={{
          display: "flex", borderBottom: `1px solid ${C.border}`,
          background: C.bg, padding: "0 24px", overflowX: "auto",
        }}>
          {TABS.map((tab) => {
            const on = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 14px", fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.12em", fontFamily: C.mono,
                  border: "none", borderBottom: on ? `2px solid ${C.red}` : "2px solid transparent",
                  background: "transparent", cursor: "pointer", whiteSpace: "nowrap",
                  color: on ? C.red : C.muted, transition: "color 100ms",
                }}
              >
                <tab.icon size={11} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* ── Content ── */}
        <main style={{ padding: "24px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
          <PageComponent />
        </main>

        {/* ── Footer ── */}
        <footer style={{
          borderTop: `1px solid ${C.redDim}`, padding: "18px 24px",
          display: "flex", justifyContent: "flex-end", alignItems: "center",
          background: C.accentFaint,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, opacity: 0.75 }}>
            <span style={{ fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}>POWERED_BY</span>
            <NologinLogo />
          </div>
        </footer>
      </div>
    </ThemeCtx.Provider>
  );
}
