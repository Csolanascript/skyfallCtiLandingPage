"use client";

import React, {
  useState, useEffect, useCallback, useRef,
  createContext, useContext,
} from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Globe, Target, Shield, Network, Layers,
  Bug, AlertTriangle, Database, Loader2, Sun, Moon,
} from "lucide-react";
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
  { id: "ioc-vectors",   label: "IOC VECTORS",   icon: Target        },
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
          color: C.red, marginBottom: 14, display: "flex", alignItems: "center", gap: 6,
        }}>
          <span>▶</span> {title}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color: colorProp }: { label: string; value: string | number; color?: string }) {
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
      <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.muted, marginBottom: 10, textTransform: "uppercase" }}>
        {label}
      </div>
      <div ref={numRef} style={{
        fontSize: 48, fontWeight: 900, color, lineHeight: 1,
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
function DonutChart({ data }: { data: Slice[] }) {
  const C = useC();
  const svgRef = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<number | null>(null);

  const total = (data ?? []).reduce((s, d) => s + (d.value ?? 0), 0);
  const SIZE = 168; const R = 65; const IR = 36;
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

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5, fontSize: 10 }}>
        {slices.map((s, i) => (
          <div
            key={i}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            style={{
              display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
              opacity: active !== null && active !== i ? 0.4 : 1,
              transition: "opacity 150ms",
            }}
          >
            <div style={{ width: 8, height: 8, background: s.col, flexShrink: 0,
              boxShadow: active === i ? `0 0 8px ${s.col}` : "none", transition: "box-shadow 150ms",
            }} />
            <span style={{
              color: active === i ? C.white : C.muted, flex: 1, minWidth: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              transition: "color 150ms",
            }}>
              {fmt(s.label)}
            </span>
            <span style={{ color: s.col, fontWeight: 700, flexShrink: 0 }}>{s.pct}%</span>
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


// ─── Dashboard pages ──────────────────────────────────────────────────────────
function IocGeoPage() {
  const C = useC();
  const { data: d, loading, error } = useFetch<Record<string, unknown>>("/api/dashboard/iocs-geo");
  if (loading) return <PageLoading />;
  if (error)   return <PageError />;
  const data = d ?? {} as Record<string, unknown>;
  return (
    <Col>
      <Stats cols={3}>
        <StatCard label="TOTAL IOCs"     value={String(data.total_iocs ?? "—")} />
        <StatCard label="CAMPAIGNS"      value={String(data.campaigns_total ?? "—")} />
        <StatCard label="TOTAL ASN"      value={String(data.total_asn ?? "—")} />
        <StatCard label="TOTAL IPs"      value={String(data.total_ips ?? "—")} color={C.white} />
        <StatCard label="COUNTRIES"      value={String(data.total_countries ?? "—")} color={C.white} />
        <StatCard label="ATTACK VECTORS" value={String(data.attack_vectors_total ?? "—")} color={C.white} />
      </Stats>
      <Row>
        <HudCard title="COUNTRY OF ORIGIN (IOC)">
          <BarList data={(data.country_origin as Slice[]) ?? []} />
        </HudCard>
        <HudCard title="IOC TYPES BREAKDOWN">
          <DonutChart data={(data.ioc_types as Slice[]) ?? []} />
        </HudCard>
      </Row>
      <Row>
        <HudCard title="IOC HOSTING — TOP ASN ORGS">
          <DonutChart data={(data.ioc_hosting as Slice[]) ?? []} />
        </HudCard>
        <HudCard title="ASN INFRASTRUCTURE TYPES">
          <BarList data={(data.asn_types as Slice[]) ?? []} />
        </HudCard>
      </Row>
      <HudCard title="IPs WITH MOST CONNECTIONS">
        <HudTable columns={["ip_address","connection_count"]} rows={(data.top_ips as Record<string,unknown>[]) ?? []} />
      </HudCard>
    </Col>
  );
}

function IocVectorsPage() {
  const { data: d, loading, error } = useFetch<Record<string, unknown>>("/api/dashboard/ioc-vectors");
  if (loading) return <PageLoading />;
  if (error)   return <PageError />;
  const data = d ?? {} as Record<string, unknown>;
  return (
    <Col>
      <HudCard title="LAST ANALYZED IPs">
        <HudTable columns={["ip_address","asn","country","last_updated"]} rows={(data.last_analyzed as Record<string,unknown>[]) ?? []} />
      </HudCard>
      <HudCard title="CORRELATED IPs — LAST 7 DAYS">
        <HudTable columns={["ip","asn","country","attack_pattern"]} rows={(data.correlated_ips as Record<string,unknown>[]) ?? []} />
      </HudCard>
    </Col>
  );
}

function IntrusionSetPage() {
  const { data: d, loading, error } = useFetch<Record<string, unknown>>("/api/dashboard/intrusion-set");
  if (loading) return <PageLoading />;
  if (error)   return <PageError />;
  const data = d ?? {} as Record<string, unknown>;
  return (
    <Col>
      <HudCard title="MOST DANGEROUS GROUPS — RANKED BY CAMPAIGNS">
        <HudTable columns={["group","campaigns","total"]} rows={(data.most_dangerous as Record<string,unknown>[]) ?? []} />
      </HudCard>
      <HudCard title="KNOWN INTRUSION SET ALIASES">
        <HudTable columns={["name","aliases"]} rows={(data.aliases as Record<string,unknown>[]) ?? []} />
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
              <HudTable columns={["domain_name","last_seen"]} rows={(data.last_domains as Record<string,unknown>[]) ?? []} />
            </HudCard>
            <HudCard title="TOP LEVEL DOMAIN DISTRIBUTION">
              <DonutChart data={(data.top_tlds as Slice[]) ?? []} />
            </HudCard>
          </Row>
          <HudCard title="DOMAINS RESOLVING TO SAME IP">
            <HudTable columns={["domain","resolved_ip"]} rows={(data.domain_ip as Record<string,unknown>[]) ?? []} />
          </HudCard>
        </Col>
      )}

      {subTab === "dns" && (
        <Col>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 16 }}>
            <FlagPill label="CLOUDFLARE MALICIOUS FLAGS" value={flags.cloudflare_flags ?? 0} />
            <FlagPill label="DNS4EU MALICIOUS FLAGS"     value={flags.dns4eu_flags      ?? 0} />
            <FlagPill label="ULTRADNS MALICIOUS FLAGS"   value={flags.ultradns_flags    ?? 0} />
            <FlagPill label="TOTAL DOMAINS ANALYZED"     value={flags.total_analyzed    ?? 0} color={C.white} />
          </div>
          <HudCard title="DNS FLAG RATE — VISUAL BREAKDOWN">
            <BarList data={[
              { label: "Cloudflare", value: flags.cloudflare_flags ?? 0 },
              { label: "DNS4EU",     value: flags.dns4eu_flags      ?? 0 },
              { label: "UltraDNS",   value: flags.ultradns_flags    ?? 0 },
            ]} />
          </HudCard>
          <HudCard title="COVERAGE VS TOTAL ANALYZED">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12 }}>
              {(["cloudflare_flags","dns4eu_flags","ultradns_flags"] as const).map((k, i) => {
                const v = flags[k] ?? 0;
                const total = flags.total_analyzed || 1;
                const pct = Math.round((v / total) * 100);
                const labels = ["CLOUDFLARE","DNS4EU","ULTRADNS"];
                return (
                  <div key={k} style={{ textAlign: "center", padding: 16, border: `1px solid ${C.redDim}`, position: "relative" }}>
                    <Brackets size={7} />
                    <div style={{ fontSize: 32, fontWeight: 900, color: C.red, textShadow: C.redGlow }}>{pct}%</div>
                    <div style={{ fontSize: 8, color: C.muted, letterSpacing: "0.18em", marginTop: 4 }}>{labels[i]} FLAG RATE</div>
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
              <DonutChart data={(data.indicator_types as Slice[]) ?? []} />
            </HudCard>
            <HudCard title="INDICATORS — MULTIPLE MALWARE FAMILIES">
              <HudTable
                columns={["indicator","connection_count","malware_families"]}
                rows={(data.indicator_malware as Record<string,unknown>[]) ?? []}
              />
            </HudCard>
          </Row>
        </Col>
      )}
    </Col>
  );
}

function TechniquesPage() {
  const { data: d, loading, error } = useFetch<Record<string, unknown>>("/api/dashboard/techniques");
  if (loading) return <PageLoading />;
  if (error)   return <PageError />;
  const data = d ?? {} as Record<string, unknown>;
  return (
    <Col>
      <HudCard title="MOST TARGETED PLATFORMS">
        <BarList data={(data.targeted_os as Slice[]) ?? []} />
      </HudCard>
      <Row>
        <HudCard title="BIGGEST INTRUSION SETS — MALWARE ARSENAL">
          <HudTable columns={["threat_actor","malware_tools","tool_count"]} rows={(data.biggest_groups as Record<string,unknown>[]) ?? []} />
        </HudCard>
        <HudCard title="MOST USED TECHNIQUES">
          <HudTable columns={["technique_name","actor_count"]} rows={(data.most_used_techniques as Record<string,unknown>[]) ?? []} />
        </HudCard>
      </Row>
      <Row>
        <HudCard title="BEST MITIGATIONS">
          <HudTable columns={["mitigation","techniques_covered"]} rows={(data.mitigations as Record<string,unknown>[]) ?? []} />
        </HudCard>
        <HudCard title="UNMITIGATED TECHNIQUES">
          <HudTable columns={["technique","technique_id"]} rows={(data.unmitigated as Record<string,unknown>[]) ?? []} />
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
  const epss  = (data.highest_epss as Record<string,unknown>[]) ?? [];
  return (
    <Col>
      <Stats cols={4}>
        <StatCard label="TOTAL CVEs"           value={String(data.total_cves ?? "—")} />
        <StatCard label="KEV (KNOWN EXPLOITED)" value={String((data.known_exploited as unknown[])?.length ?? "—")} color={C.orange} />
        <StatCard label="TOP EPSS SCORE"       value={String(epss[0]?.exploit_probability ?? "—")} color={C.white} />
        <StatCard label="TARGETED SOFTWARE"    value={String((data.targeted_software as unknown[])?.length ?? "—")} color={C.white} />
      </Stats>
      <Row>
        <HudCard title="HIGHEST EXPLOIT PROBABILITY (EPSS)">
          <HudTable columns={["cve","severity","exploit_probability"]} rows={epss} />
        </HudCard>
        <HudCard title="ATTACK VECTOR DISTRIBUTION">
          <DonutChart data={(data.attack_vectors as Slice[]) ?? []} />
        </HudCard>
      </Row>
      <HudCard title="KNOWN EXPLOITED CVEs (KEV) — ORDERED BY CVSS">
        <HudTable columns={["cve","cvss","title"]} rows={(data.known_exploited as Record<string,unknown>[]) ?? []} />
      </HudCard>
      <HudCard title="MOST TARGETED SOFTWARE">
        <HudTable columns={["product","cpe_code","total_vulns"]} rows={(data.targeted_software as Record<string,unknown>[]) ?? []} />
      </HudCard>
      <HudCard title="PATCH REFERENCES">
        <HudTable columns={["cve","type","fix_url"]} rows={(data.url_fixes as Record<string,unknown>[]) ?? []} />
      </HudCard>
    </Col>
  );
}

function MalwarePage() {
  const { data: d, loading, error } = useFetch<Record<string, unknown>>("/api/dashboard/malware");
  if (loading) return <PageLoading />;
  if (error)   return <PageError />;
  const data = d ?? {} as Record<string, unknown>;
  return (
    <Col>
      <Row>
        <HudCard title="MOST TARGETED PLATFORMS">
          <DonutChart data={(data.targeted_platforms as Slice[]) ?? []} />
        </HudCard>
        <HudCard title="TOP MITRE CONTRIBUTORS">
          <HudTable columns={["contributor","malware_reported"]} rows={(data.top_reporters as Record<string,unknown>[]) ?? []} />
        </HudCard>
      </Row>
      <HudCard title="MALWARE ARSENAL BY APT GROUP">
        <HudTable columns={["group_name","tools_used","arsenal_size"]} rows={(data.apt_malware as Record<string,unknown>[]) ?? []} />
      </HudCard>
      <HudCard title="SHARED MALWARE — USED BY MULTIPLE GROUPS">
        <HudTable columns={["shared_malware","groups","group_count"]} rows={(data.shared_malware as Record<string,unknown>[]) ?? []} />
      </HudCard>
      <Row>
        <HudCard title="MALWARE ALIASES">
          <HudTable columns={["primary_name","known_aliases"]} rows={(data.aliases as Record<string,unknown>[]) ?? []} />
        </HudCard>
        <HudCard title="NAIKON — SHARED TECHNIQUES">
          <HudTable columns={["shared_technique","used_in_malware_families","mitre_id"]} rows={(data.shared_techniques as Record<string,unknown>[]) ?? []} />
        </HudCard>
      </Row>
    </Col>
  );
}

function NodeStatusPage() {
  const { data: d, loading, error } = useFetch<Record<string, unknown>>("/api/dashboard/node-status");
  if (loading) return <PageLoading />;
  if (error)   return <PageError />;
  const data = d ?? {} as Record<string, unknown>;
  return (
    <Col>
      <Row>
        <HudCard title="NODE TYPE DISTRIBUTION">
          <DonutChart data={(data.node_types as Slice[]) ?? []} />
        </HudCard>
        <HudCard title="RELATIONSHIP TYPE DISTRIBUTION">
          <DonutChart data={(data.rel_types as Slice[]) ?? []} />
        </HudCard>
      </Row>
      <HudCard title="INGESTION MEDIUM">
        <BarList data={(data.ingestion_type as Slice[]) ?? []} />
      </HudCard>
      <Row>
        <HudCard title="NODE TYPES — DATA DENSITY (AVG PROPERTIES)">
          <HudTable columns={["type","avg_properties"]} rows={(data.data_density as Record<string,unknown>[]) ?? []} />
        </HudCard>
        <HudCard title="UNCONNECTED NODES">
          <HudTable columns={["type","total"]} rows={(data.unconnected as Record<string,unknown>[]) ?? []} />
        </HudCard>
      </Row>
    </Col>
  );
}

// ─── Page component map ───────────────────────────────────────────────────────
const PAGE_COMPONENTS: Record<TabId, React.ComponentType> = {
  "iocs-geo":      IocGeoPage,
  "ioc-vectors":   IocVectorsPage,
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
