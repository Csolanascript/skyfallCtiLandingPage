"use client";

import { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import dynamic from "next/dynamic";
import {
  X, RefreshCw, Zap, Shield, Globe, Server,
  AlertTriangle, Clock, ExternalLink, Bug,
  Users, Target, Activity, Crosshair, Code,
  Sun, Moon,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/lib/theme";

// ── Dynamic imports — no SSR for WebGL ───────────────────────────────────────
const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false });
const IOCGlobeMap  = dynamic(() => import("../intelowl/IOCGlobeMap"),  { ssr: false });

// ── Graph color set (theme-aware) ─────────────────────────────────────────────
type GraphC = {
  bg: string; red: string; redDim: string; white: string; muted: string;
  border: string; mono: string; orange: string; green: string; surface: string;
  cyan: string; gold: string; purple: string;
  panelBg: string; heavyBg: string; legendBg: string; codeBg: string; subtleBg: string;
  textFaint: string; textMid: string; textDim: string; textValue: string;
  rowBorder: string; graphBg: string; linkCol: string;
  labelBg: string; labelText: string; labelMuted: string;
};

const DARK_GC: GraphC = {
  bg: "#000000", red: "#E85419", redDim: "rgba(232,84,25,0.28)", white: "#F5F5F5",
  muted: "rgba(248,248,248,0.82)", border: "rgba(255,255,255,0.20)",
  mono: "'JetBrains Mono','Fira Code','Courier New',monospace",
  orange: "#FF8C00", green: "#00FF41", surface: "rgba(232,84,25,0.04)",
  cyan: "#22d3ee", gold: "#FFD700", purple: "#a855f7",
  panelBg: "rgba(0,0,0,0.32)", heavyBg: "rgba(0,0,0,0.72)", legendBg: "rgba(0,0,0,0.88)",
  codeBg: "rgba(0,0,0,0.5)", subtleBg: "rgba(255,255,255,0.025)",
  textFaint: "rgba(245,245,245,0.62)", textMid: "rgba(250,250,250,0.88)",
  textDim: "rgba(245,245,245,0.72)", textValue: "rgba(255,255,255,0.95)",
  rowBorder: "rgba(255,255,255,0.12)", graphBg: "#000000",
  linkCol: "rgba(255,255,255,0.22)", labelBg: "rgba(0,0,0,0.92)",
  labelText: "#F5F5F5", labelMuted: "rgba(248,248,248,0.80)",
};

const LIGHT_GC: GraphC = {
  bg: "#F0EFE8", red: "#C84010", redDim: "rgba(200,64,16,0.28)", white: "#080808",
  muted: "rgba(8,8,8,0.90)", border: "rgba(0,0,0,0.22)",
  mono: "'JetBrains Mono','Fira Code','Courier New',monospace",
  orange: "#C86000", green: "#006B1A", surface: "rgba(0,0,0,0.04)",
  cyan: "#0369a1", gold: "#7A6200", purple: "#6d28d9",
  panelBg: "rgba(0,0,0,0.03)", heavyBg: "rgba(240,239,232,0.98)", legendBg: "rgba(240,239,232,0.97)",
  codeBg: "rgba(0,0,0,0.06)", subtleBg: "rgba(0,0,0,0.03)",
  textFaint: "rgba(8,8,8,0.60)", textMid: "rgba(8,8,8,0.88)",
  textDim: "rgba(8,8,8,0.72)", textValue: "rgba(0,0,0,0.95)",
  rowBorder: "rgba(0,0,0,0.12)", graphBg: "#F0EFE8",
  linkCol: "rgba(0,0,0,0.20)", labelBg: "rgba(240,239,232,0.97)",
  labelText: "#080808", labelMuted: "rgba(8,8,8,0.80)",
};

const GraphCtx = createContext<GraphC>(DARK_GC);
const useGC = () => useContext(GraphCtx);

const LEFT_W = 420;

// ── Node type colours ─────────────────────────────────────────────────────────
const NODE_COLORS: Record<string, string> = {
  Indicator:      "#E85419",
  IP:             "#22d3ee",
  Identity:       "#a855f7",
  Malware:        "#FF8C00",
  Campaign:       "#FFD700",
  IntrusionSet:   "#f97316",
  Technique:      "#00FF41",
  Vulnerability:  "#ef4444",
  Domain:         "#22c55e",
  Location:       "#3b82f6",
  Infrastructure: "#06b6d4",
};

const NODE_PRIORITY = [
  "Indicator", "IP", "Identity", "Malware", "Campaign",
  "IntrusionSet", "Technique", "Vulnerability", "Domain", "Location", "Infrastructure",
];

function primaryLabel(labels: string[]): string {
  for (const p of NODE_PRIORITY) if (labels.includes(p)) return p;
  return labels.find((l) => !["Public", "Kafka", "Disk", "Private"].includes(l)) || labels[0] || "Node";
}
function nodeColor(labels: string[], isCentral: boolean): string {
  if (isCentral) return "#FF1144";
  return NODE_COLORS[primaryLabel(labels)] ?? "#7A7A7A";
}
function nodeSize(labels: string[], isCentral: boolean): number {
  if (isCentral) return 12;
  const pl = primaryLabel(labels);
  return pl === "IP" || pl === "Indicator" ? 5 : 3;
}
function displayName(properties: Record<string, unknown>): string {
  const v = properties.value ?? properties.name ?? properties.pattern;
  if (!v) return "—";
  const s = String(v);
  return s.length > 30 ? s.slice(0, 28) + "…" : s;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function toArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return [val]; }
  }
  return [];
}

function formatDate(d: unknown): string {
  if (!d) return "—";
  try {
    return new Date(String(d)).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return String(d).slice(0, 16); }
}

function num(val: unknown): number {
  if (typeof val === "number") return val;
  const n = parseInt(String(val ?? "0"), 10);
  return isNaN(n) ? 0 : n;
}

function str(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;
  return String(val);
}

function riskProfile(rep: string | null, vt: number, conf: number, C: GraphC) {
  if (rep === "malicious" || vt >= 5)  return { label: "HIGH",   color: C.red    };
  if (rep === "suspicious" || vt >= 1) return { label: "MEDIUM", color: C.orange };
  if (conf >= 75)                       return { label: "MEDIUM", color: C.orange };
  return { label: "LOW", color: C.green };
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface GraphNode {
  id: string;
  labels: string[];
  properties: Record<string, unknown>;
}
interface GraphLink {
  id: string;
  source: string;
  target: string;
  relationship_type: string;
  properties: Record<string, unknown>;
}

interface GraphSummary {
  centralNode:          GraphNode | undefined;
  ipNode:               GraphNode | undefined;
  targetLocationNodes:  GraphNode[];
  originatesFromNodes:  GraphNode[];
  malwareNodes:         GraphNode[];
  campaignNodes:        GraphNode[];
  groupNodes:           GraphNode[];
  techniqueNodes:       GraphNode[];
  vulnNodes:            GraphNode[];
  domainNodes:          GraphNode[];
  infraNodes:           GraphNode[];
}

// ── Graph data extraction ─────────────────────────────────────────────────────
function buildGraphSummary(
  rawNodes: GraphNode[],
  rawLinks: GraphLink[],
  centralId: string | null,
): GraphSummary {
  const centralNode =
    centralId
      ? rawNodes.find((n) => n.id === centralId)
      : rawNodes.find((n) => n.labels.includes("Indicator"));

  const ipNode = rawNodes.find((n) => n.labels.includes("IP"));

  // Source IDs to search from: Indicator + IP node (both may carry geo relationships)
  const sourceIds = new Set([centralNode?.id, ipNode?.id].filter(Boolean) as string[]);

  // TARGETS relationship: countries/locations the IOC attacks
  const targetsRelIds = new Set(
    rawLinks
      .filter((l) => sourceIds.has(l.source) && l.relationship_type === "TARGETS")
      .map((l) => l.target),
  );

  // ORIGINATES_FROM relationship: country/location the IOC comes from
  const originatesRelIds = new Set(
    rawLinks
      .filter((l) => sourceIds.has(l.source) && l.relationship_type === "ORIGINATES_FROM")
      .map((l) => l.target),
  );

  // Outgoing link targets from the central Indicator node (1 hop, all types)
  const outgoingTargetIds = new Set(
    rawLinks
      .filter((l) => l.source === centralNode?.id)
      .map((l) => l.target),
  );

  // 2-hop TARGETS reachable via intermediate nodes
  const twoHopTargetIds = new Set(
    rawLinks
      .filter((l) => outgoingTargetIds.has(l.source) && l.relationship_type === "TARGETS")
      .map((l) => l.target),
  );

  // All directly connected node IDs (both directions)
  const connectedIds = new Set(
    rawLinks
      .filter((l) => l.source === centralNode?.id || l.target === centralNode?.id)
      .flatMap((l) => [l.source, l.target]),
  );
  const adjacentNodes = rawNodes.filter(
    (n) => connectedIds.has(n.id) && n.id !== centralNode?.id,
  );

  const isLocation = (n: GraphNode) => n.labels.some((l) => ["Location", "Country"].includes(l));

  return {
    centralNode,
    ipNode,
    // Only TARGETS-typed location nodes (1 or 2 hops)
    targetLocationNodes: rawNodes.filter(
      (n) => (targetsRelIds.has(n.id) || twoHopTargetIds.has(n.id)) && isLocation(n),
    ),
    // ORIGINATES_FROM-typed location nodes — the attack source country
    originatesFromNodes: rawNodes.filter(
      (n) => originatesRelIds.has(n.id) && isLocation(n),
    ),
    malwareNodes:   adjacentNodes.filter((n) => n.labels.includes("Malware")),
    campaignNodes:  adjacentNodes.filter((n) => n.labels.includes("Campaign")),
    groupNodes:     adjacentNodes.filter((n) =>
      n.labels.includes("IntrusionSet") || n.labels.includes("ThreatActor"),
    ),
    techniqueNodes: adjacentNodes.filter((n) => n.labels.includes("Technique")),
    vulnNodes:      adjacentNodes.filter((n) => n.labels.includes("Vulnerability")),
    domainNodes:    adjacentNodes.filter((n) => n.labels.includes("Domain")),
    infraNodes:     adjacentNodes.filter((n) => n.labels.includes("Infrastructure")),
  };
}

// ── UI atoms ──────────────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, label }: { icon?: LucideIcon; label: string }) {
  const C = useGC();
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: C.red,
      marginBottom: 8, display: "flex", alignItems: "center", gap: 6,
    }}>
      {Icon && <Icon size={11} />}{label}
    </div>
  );
}

function RepBadge({ rep }: { rep: string | null }) {
  const C = useGC();
  if (!rep) return null;
  const color =
    rep === "malicious" ? C.red :
    rep === "suspicious" ? C.orange :
    rep === "safe" || rep === "benign" ? C.green : C.muted;
  return (
    <span style={{
      padding: "2px 7px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
      border: `1px solid ${color}55`, color, background: `${color}18`, flexShrink: 0,
    }}>
      {rep.toUpperCase()}
    </span>
  );
}

function Chip({
  label, color, bg,
}: { label: string; color?: string; bg?: string }) {
  const C = useGC();
  const clr = color ?? C.muted;
  return (
    <span style={{
      padding: "3px 9px", fontSize: 11, letterSpacing: "0.06em",
      border: `1px solid ${clr}44`, color: clr,
      background: bg ?? `${clr}0d`,
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function Row({ k, v, vColor }: { k: string; v: string; vColor?: string }) {
  const C = useGC();
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
      <span style={{ color: C.muted, flexShrink: 0 }}>{k}</span>
      <span style={{ color: vColor ?? C.white, textAlign: "right", wordBreak: "break-all" }}>{v}</span>
    </div>
  );
}

function Divider() {
  const C = useGC();
  return <div style={{ height: 1, background: C.border, margin: "4px 0" }} />;
}

// ── Left Summary Panel ────────────────────────────────────────────────────────
function IOCSummaryPanel({
  iocValue, summary, loading,
}: {
  iocValue: string;
  summary: GraphSummary | null;
  loading: boolean;
}) {
  const C = useGC();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 140, gap: 8, color: C.red, fontSize: 10, letterSpacing: "0.2em" }}>
        <RefreshCw size={11} className="animate-spin" /> LOADING_GRAPH...
      </div>
    );
  }

  const s = summary;
  const c = s?.centralNode;
  const ip = s?.ipNode;

  // — Indicator fields (from graph node) —
  const confidence  = num(c?.properties.confidence);
  const vtMalicious = num(c?.properties.x_vt_malicious);
  const vtTotal     = num(c?.properties.x_vt_total_engines ?? c?.properties["x_vt_total"]);
  const csRep       = str(c?.properties.x_crowdsec_reputation);
  const abuseRep    = num(c?.properties.x_abuseipdb_total_reports);
  const abuseScore  = num(c?.properties.x_abuseipdb_abuse_confidence_score);
  const decayScore  = c?.properties.x_decay_score != null ? num(c.properties.x_decay_score) : null;
  const behaviors   = toArray(c?.properties.x_crowdsec_behaviors);
  const blocklists  = toArray(c?.properties.x_crowdsec_blocklists);
  const mitreProps  = toArray(c?.properties.x_crowdsec_mitre_techniques);
  const types       = toArray(c?.properties.indicator_types ?? c?.properties["x_indicator_types"]);
  const analyzers   = toArray(c?.properties.x_analyzers_processed);
  const vtLink      = str(c?.properties.x_vt_permalink);
  const abuseLink   = str(c?.properties.x_abuseipdb_permalink);
  const csLink      = str(c?.properties.x_crowdsec_link);
  const stixPattern = str(c?.properties.pattern);

  // — IP / Geo fields —
  const srcLat  = ip?.properties.x_latitude != null ? Number(ip.properties.x_latitude) : null;
  const srcLng  = ip?.properties.x_longitude != null ? Number(ip.properties.x_longitude) : null;
  const country = str(ip?.properties.country);
  const countryCode = str(ip?.properties.country_code);
  const city    = str(ip?.properties.city);
  const asn     = str(ip?.properties.asn);
  const asnOrg  = str(ip?.properties.x_as_organization);
  const tz      = str(ip?.properties.timezone ?? ip?.properties.time_zone ?? ip?.properties.x_timezone);

  // — Risk —
  const risk = riskProfile(csRep, vtMalicious, confidence, C);

  // — Globe targets: Location nodes via TARGETS relationship —
  const globeTargets = (s?.targetLocationNodes ?? []).map((n, _, arr) => ({
    country: String(n.properties.name ?? n.properties.country ?? n.properties.value ?? ""),
    value: 1,
    percent: arr.length ? 100 / arr.length : 100,
  })).filter((t) => t.country.length > 0);

  // — Globe source: ORIGINATES_FROM nodes as fallback when IP has no geo props —
  const originatesNode = s?.originatesFromNodes?.[0];
  const originatesCountry = originatesNode
    ? str(originatesNode.properties.name ?? originatesNode.properties.country ?? originatesNode.properties.value)
    : null;

  // — Adjacent context —
  const malware  = s?.malwareNodes  ?? [];
  const campaigns= s?.campaignNodes ?? [];
  const groups   = s?.groupNodes    ?? [];
  const techniques = [
    ...new Set([
      ...(s?.techniqueNodes ?? []).map((n) => str(n.properties.x_mitre_id ?? n.properties.name ?? n.properties.value) ?? ""),
      ...mitreProps,
    ].filter(Boolean)),
  ];
  const vulns    = s?.vulnNodes     ?? [];
  const domains  = s?.domainNodes   ?? [];

  const hasSource = srcLat !== null || country !== null || countryCode !== null || originatesCountry !== null;

  return (
    <div style={{ padding: "14px 14px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Header ── */}
      <div>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.2em", marginBottom: 4 }}>
          ▶ IOC_INTELLIGENCE_BRIEF
        </div>
        <div style={{
          fontSize: 15, fontWeight: 900, color: C.white,
          letterSpacing: "0.04em", wordBreak: "break-all", lineHeight: 1.3,
        }}>
          {iocValue}
        </div>
      </div>

      {/* ── Risk + Confidence ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
        {[
          { label: "RISK LEVEL",  value: risk.label,            color: risk.color },
          { label: "CONFIDENCE",  value: `${confidence}/100`,   color: C.white    },
        ].map((s) => (
          <div key={s.label} style={{
            padding: "8px 10px", border: `1px solid ${s.color}44`,
            background: `${s.color}08`, position: "relative",
          }}>
            <div style={{ fontSize: 9, color: C.muted, marginBottom: 3, letterSpacing: "0.15em" }}>{s.label}</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: s.color, textShadow: `0 0 12px ${s.color}60` }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Reputation signals ── */}
      <div>
        <SectionTitle icon={Shield} label="REPUTATION SIGNALS" />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>

          {/* VirusTotal */}
          <div style={{ padding: "8px 10px", border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em" }}>VIRUSTOTAL</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: vtMalicious > 0 ? C.red : C.green }}>
                {vtMalicious}{vtTotal > 0 ? `/${vtTotal}` : ""} engines
              </span>
              {!!vtLink && <a href={vtLink!} target="_blank" rel="noopener noreferrer" style={{ color: C.muted, display: "flex" }}><ExternalLink size={10} /></a>}
            </div>
          </div>

          {/* CrowdSec */}
          <div style={{ padding: "8px 10px", border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: behaviors.length > 0 ? 6 : 0 }}>
              <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em" }}>CROWDSEC</span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <RepBadge rep={csRep} />
                {!!csLink && <a href={csLink!} target="_blank" rel="noopener noreferrer" style={{ color: C.muted, display: "flex" }}><ExternalLink size={10} /></a>}
              </div>
            </div>
            {behaviors.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {behaviors.slice(0, 5).map((b, i) => (
                  <span key={i} style={{ fontSize: 9, padding: "2px 6px", background: "rgba(232,84,25,0.09)", color: C.muted, border: `1px solid ${C.redDim}` }}>
                    {b}
                  </span>
                ))}
                {behaviors.length > 5 && <span style={{ fontSize: 9, color: C.muted }}>+{behaviors.length - 5}</span>}
              </div>
            )}
            {blocklists.length > 0 && (
              <div style={{ marginTop: 4, fontSize: 10, color: C.textDim }}>
                Blocklists: {blocklists.slice(0, 3).join(", ")}{blocklists.length > 3 ? ` +${blocklists.length - 3}` : ""}
              </div>
            )}
          </div>

          {/* AbuseIPDB */}
          <div style={{ padding: "8px 10px", border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em" }}>ABUSEIPDB</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: abuseRep > 0 ? C.orange : C.muted }}>
                {abuseRep} reports{abuseScore > 0 ? ` · ${abuseScore}%` : ""}
              </span>
              {!!abuseLink && <a href={abuseLink!} target="_blank" rel="noopener noreferrer" style={{ color: C.muted, display: "flex" }}><ExternalLink size={10} /></a>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Geographic origin + targets ── */}
      <div>
        <SectionTitle icon={Globe} label="GEOGRAPHIC ORIGIN" />
        {hasSource ? (
          <>
            <IOCGlobeMap
              observable={iocValue}
              sourceLatitude={srcLat}
              sourceLongitude={srcLng}
              sourceCountry={countryCode ?? country ?? originatesCountry}
              targets={globeTargets}
            />
            <div style={{ marginTop: 6, padding: "8px 10px", border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 5 }}>
              {!!(country || city || originatesCountry) && (
                <Row
                  k="ORIGIN"
                  v={[city, country ?? originatesCountry].filter(Boolean).join(", ") + (countryCode ? ` [${countryCode}]` : "")}
                />
              )}
              {!!tz && <Row k="TIMEZONE" v={tz} />}
              {!!(asn || asnOrg) && (
                <Row k="ASN" v={[asn ? `AS${asn}` : "", asnOrg].filter(Boolean).join(" · ")} />
              )}
              {globeTargets.length > 0 && (
                <Row
                  k="TARGETS"
                  v={globeTargets.map((t) => t.country).join(", ")}
                  vColor={C.red}
                />
              )}
            </div>
          </>
        ) : (
          <div style={{ padding: "10px", border: `1px solid ${C.border}`, fontSize: 11, color: C.muted }}>
            No geo coordinates in IP node
          </div>
        )}
      </div>

      {/* ── Threat actors ── */}
      {groups.length > 0 && (
        <div>
          <SectionTitle icon={Users} label="THREAT ACTORS" />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {groups.map((n, i) => {
              const name = str(n.properties.name ?? n.properties.value) ?? "Unknown";
              const aliases = toArray(n.properties.aliases);
              return (
                <div key={i} style={{ padding: "7px 10px", border: `1px solid rgba(168,85,247,0.3)`, background: "rgba(168,85,247,0.05)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.purple }}>{name}</div>
                  {aliases.length > 0 && (
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                      {aliases.slice(0, 3).join(" · ")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Malware families ── */}
      {malware.length > 0 && (
        <div>
          <SectionTitle icon={Bug} label="MALWARE FAMILIES" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {malware.map((n, i) => (
              <Chip
                key={i}
                label={str(n.properties.name ?? n.properties.value) ?? "?"}
                color={C.orange}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Related campaigns ── */}
      {campaigns.length > 0 && (
        <div>
          <SectionTitle icon={Activity} label="RELATED CAMPAIGNS" />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {campaigns.map((n, i) => {
              const name = str(n.properties.name ?? n.properties.value) ?? "Unknown";
              const desc = str(n.properties.description);
              return (
                <div key={i} style={{ padding: "7px 10px", border: `1px solid rgba(255,215,0,0.25)`, background: "rgba(255,215,0,0.03)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>{name}</div>
                  {!!desc && (
                    <div style={{
                      fontSize: 10, color: C.muted, marginTop: 2, lineHeight: 1.4,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {desc}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {vulns.length > 0 && (
        <div>
          <SectionTitle icon={Crosshair} label="VULNERABILITIES" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {vulns.map((n, i) => (
              <Chip
                key={i}
                label={str(n.properties.x_cve_id ?? n.properties.name ?? n.properties.value) ?? "?"}
                color="#ef4444"
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Domains ── */}
      {domains.length > 0 && (
        <div>
          <SectionTitle icon={Server} label="RELATED DOMAINS" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {domains.map((n, i) => (
              <Chip
                key={i}
                label={str(n.properties.value ?? n.properties.name) ?? "?"}
                color={C.green}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── MITRE ATT&CK ── */}
      {techniques.length > 0 && (
        <div>
          <SectionTitle icon={Target} label="MITRE ATT&CK" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {techniques.map((t, i) => (
              <Chip key={i} label={t} color={C.cyan} />
            ))}
          </div>
        </div>
      )}

      {/* ── Indicator types ── */}
      {types.length > 0 && (
        <div>
          <SectionTitle icon={AlertTriangle} label="INDICATOR TYPES" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {types.map((t, i) => (
              <Chip key={i} label={t.toUpperCase().replace(/-/g, " ")} color={C.red} />
            ))}
          </div>
        </div>
      )}

      {/* ── STIX Pattern ── */}
      {!!stixPattern && (
        <div>
          <SectionTitle icon={Code} label="STIX PATTERN" />
          <div style={{
            padding: "8px 10px", background: C.codeBg,
            border: `1px solid ${C.border}`, fontSize: 11, color: C.muted,
            wordBreak: "break-all", lineHeight: 1.6,
          }}>
            {stixPattern}
          </div>
        </div>
      )}

      {/* ── Decay score ── */}
      {decayScore !== null && (
        <div>
          <SectionTitle label="DECAY SCORE — RELEVANCE INDEX" />
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", border: `1px solid ${C.border}` }}>
            <div style={{ flex: 1, height: 3, background: C.border }}>
              <div style={{ width: `${Math.min(100, decayScore)}%`, height: "100%", background: C.orange, transition: "width 600ms ease" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.orange, minWidth: 28, textAlign: "right" }}>
              {decayScore}
            </span>
          </div>
        </div>
      )}

      {/* ── Analyzers ── */}
      {analyzers.length > 0 && (
        <div>
          <SectionTitle label="ANALYZERS PROCESSED" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {analyzers.map((a, i) => (
              <Chip key={i} label={a} />
            ))}
          </div>
        </div>
      )}

      {/* ── Timestamps ── */}
      {!!(c && (c.properties.created || c.properties.modified)) && (
        <div>
          <SectionTitle icon={Clock} label="TIMESTAMPS" />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Divider />
            {!!c.properties.created  && <Row k="CREATED"  v={formatDate(c.properties.created)}  />}
            {!!c.properties.modified && <Row k="MODIFIED" v={formatDate(c.properties.modified)} />}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Node properties panel ─────────────────────────────────────────────────────
function NodePanel({
  node, onClose, onNavigate,
}: { node: GraphNode; onClose: () => void; onNavigate?: (value: string) => void }) {
  const C  = useGC();
  const pl    = primaryLabel(node.labels);
  const color = NODE_COLORS[pl] ?? "#7A7A7A";
  const ipVal = node.properties.value as string | undefined;
  const SKIP  = new Set(["id", "type"]);
  const entries = Object.entries(node.properties).filter(
    ([k]) => !SKIP.has(k) && node.properties[k] != null,
  );

  return (
    <div style={{
      width: 300, flexShrink: 0, display: "flex", flexDirection: "column",
      borderLeft: `1px solid ${C.border}`, background: C.heavyBg,
      fontFamily: C.mono, overflow: "hidden",
    }}>
      <div style={{
        padding: "10px 14px", borderBottom: `1px solid ${C.border}`,
        background: C.codeBg, display: "flex",
        justifyContent: "space-between", alignItems: "center", flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.2em", marginBottom: 3 }}>NODE PROPERTIES</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{pl.toUpperCase()}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer", padding: "4px 8px", fontSize: 10, letterSpacing: "0.1em", fontFamily: C.mono }}>✕</button>
      </div>

      <div style={{ padding: "8px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", flexWrap: "wrap", gap: 4, flexShrink: 0 }}>
        {node.labels.map((l) => (
          <span key={l} style={{ padding: "2px 7px", fontSize: 10, letterSpacing: "0.08em", border: `1px solid ${C.redDim}`, color: C.muted }}>{l}</span>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
        {entries.map(([k, v]) => (
          <div key={k} style={{ marginBottom: 9, paddingBottom: 7, borderBottom: `1px solid ${C.rowBorder}` }}>
            <div style={{ fontSize: 10, color: C.textDim, letterSpacing: "0.14em", marginBottom: 3 }}>
              {k.toUpperCase().replace(/_/g, " ")}
            </div>
            <div style={{ fontSize: 12, color: C.textValue, wordBreak: "break-all", lineHeight: 1.5, maxHeight: 60, overflow: "hidden" }}>
              {Array.isArray(v) ? v.join(", ") : String(v)}
            </div>
          </div>
        ))}
      </div>

      {ipVal && onNavigate && (
        <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={() => onNavigate(ipVal)} style={{
            width: "100%", padding: "10px 0", background: C.red, border: "none",
            color: "#fff", fontFamily: C.mono, fontWeight: 900, fontSize: 12, letterSpacing: "0.18em",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            boxShadow: "0 0 18px rgba(232,84,25,0.35)",
          }}>
            <Zap size={12} /> INVESTIGATE IOC
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
interface Props {
  iocValue: string;
  onClose: () => void;
  onInvestigate: (ip: string) => void;
}

export default function IOCGraphModal({ iocValue, onClose, onInvestigate }: Props) {
  const { isDark, toggle } = useTheme();
  const C = isDark ? DARK_GC : LIGHT_GC;

  const [rawNodes,     setRawNodes]     = useState<GraphNode[]>([]);
  const [rawLinks,     setRawLinks]     = useState<GraphLink[]>([]);
  const [centralId,    setCentralId]    = useState<string | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [dims,         setDims]         = useState({ w: 800, h: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);

  // Resize observer on the graph canvas container
  useEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      setDims({ w: containerRef.current.clientWidth, h: containerRef.current.clientHeight });
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ESC to close
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // Fetch graph — includes adjacent context nodes
  useEffect(() => {
    setLoading(true);
    setError(null);
    setSelectedNode(null);
    setCentralId(null);

    const cypher = `
      MATCH (center:Indicator)
      WHERE center.pattern CONTAINS $value
         OR center.name = $value
         OR center.value = $value
      WITH center LIMIT 1
      OPTIONAL MATCH (center)-[:BASED_ON]->(ip:IP)
      WITH center, ip
      OPTIONAL MATCH (center)-[r1]-(n1)
      OPTIONAL MATCH (center)-[:INDICATES]->(target)-[r2]-(n2)
      OPTIONAL MATCH (ip)-[r3]-(n3)
      RETURN center, ip, r1, n1, target, r2, n2, r3, n3
    `;

    fetch("/api/graph/run-query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: cypher, params: { value: iocValue }, limit: 200 }),
    })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => {
        if (d.status !== "ok") throw new Error(d.detail ?? "Query failed");

        const nodes: GraphNode[] = d.graph.nodes ?? [];
        const links: GraphLink[] = d.graph.relationships ?? [];

        const central =
          nodes.find((n) => n.labels.includes("Indicator") && String(n.properties.pattern ?? "").includes(iocValue)) ??
          nodes.find((n) => n.labels.includes("Indicator")) ??
          null;

        setCentralId(central?.id ?? null);
        setRawNodes(nodes);
        setRawLinks(links);
        setLoading(false);
      })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, [iocValue]);

  // Derive summary from graph nodes (source of truth)
  const graphSummary = useMemo(
    () => (rawNodes.length > 0 ? buildGraphSummary(rawNodes, rawLinks, centralId) : null),
    [rawNodes, rawLinks, centralId],
  );

  // Build force-graph data
  const fgData = useMemo(() => {
    const nodes = rawNodes.map((n) => ({
      ...n,
      __color:   nodeColor(n.labels, n.id === centralId),
      __val:     nodeSize(n.labels, n.id === centralId),
      __label:   displayName(n.properties),
      __central: n.id === centralId,
    }));
    const nodeIds = new Set(nodes.map((n) => n.id));
    const links = rawLinks
      .filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target))
      .map((l) => ({ ...l, __type: l.relationship_type }));
    return { nodes, links };
  }, [rawNodes, rawLinks, centralId]);

  const handleEngineStop = useCallback(() => { graphRef.current?.zoomToFit(400, 40); }, []);
  const handleNodeClick  = useCallback((node: unknown) => {
    const n = node as GraphNode;
    setSelectedNode(rawNodes.find((r) => r.id === n.id) ?? n);
  }, [rawNodes]);

  const legendEntries = Object.entries(NODE_COLORS).filter(([label]) =>
    rawNodes.some((n) => n.labels.includes(label)),
  );

  return (
    <GraphCtx.Provider value={C}>
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: C.bg, display: "flex", flexDirection: "column", fontFamily: C.mono }}>

      {/* ── Header ── */}
      <header style={{
        borderBottom: `1px solid ${C.redDim}`, padding: "9px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: C.surface, flexShrink: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 3, height: 20, background: C.red, boxShadow: "0 0 18px rgba(232,84,25,0.6)" }} />
          <div>
            <div style={{ fontSize: 7, color: C.muted, letterSpacing: "0.2em", marginBottom: 3 }}>▶ NEO4J_GRAPH_EXPLORER</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: C.white, letterSpacing: "0.04em" }}>{iocValue}</div>
          </div>
          {!loading && !error && (
            <div style={{ fontSize: 8, color: C.muted, letterSpacing: "0.1em", padding: "3px 10px", border: `1px solid ${C.border}`, display: "flex", gap: 16 }}>
              <span>{rawNodes.length} <span style={{ color: C.textFaint }}>NODES</span></span>
              <span>{rawLinks.length} <span style={{ color: C.textFaint }}>EDGES</span></span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => onInvestigate(iocValue)} style={{
            padding: "6px 14px", background: C.red, border: "none", color: "#fff", fontFamily: C.mono,
            fontWeight: 900, fontSize: 9, letterSpacing: "0.18em", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, boxShadow: "0 0 14px rgba(232,84,25,0.35)",
          }}>
            <Zap size={10} /> INVESTIGATE
          </button>
          <button onClick={toggle} style={{
            background: "none", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer",
            padding: "6px 10px", fontFamily: C.mono, fontSize: 9, letterSpacing: "0.1em",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            {isDark ? <Sun size={9} /> : <Moon size={9} />}
            {isDark ? "LIGHT" : "DARK"}
          </button>
          <button onClick={onClose} style={{
            background: "none", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer",
            padding: "6px 14px", fontFamily: C.mono, fontSize: 9, letterSpacing: "0.1em",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <X size={9} /> CLOSE [ESC]
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        {/* ─ Left: Summary ─ */}
        <div style={{
          width: LEFT_W, flexShrink: 0,
          borderRight: `1px solid ${C.border}`,
          background: C.panelBg,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{ padding: "8px 14px", borderBottom: `1px solid ${C.border}`, background: C.codeBg, fontSize: 10, color: C.muted, letterSpacing: "0.15em", flexShrink: 0 }}>
            INDICATOR INTELLIGENCE BRIEF
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <IOCSummaryPanel
              iocValue={iocValue}
              summary={graphSummary}
              loading={loading}
            />
          </div>
        </div>

        {/* ─ Center: Graph canvas ─ */}
        <div ref={containerRef} style={{ flex: 1, position: "relative", overflow: "hidden" }}>

          {loading && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, zIndex: 10 }}>
              <RefreshCw size={18} className="animate-spin" style={{ color: C.red }} />
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.25em" }}>QUERYING_NEO4J_GRAPH...</div>
            </div>
          )}

          {error && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, zIndex: 10 }}>
              <div style={{ fontSize: 11, color: C.red, letterSpacing: "0.2em" }}>[ERROR] GRAPH_QUERY_FAILED</div>
              <div style={{ fontSize: 9, color: C.muted, maxWidth: 360, textAlign: "center" }}>{error}</div>
            </div>
          )}

          {!loading && !error && rawNodes.length === 0 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, zIndex: 10 }}>
              <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.2em" }}>NO_GRAPH_DATA_FOUND</div>
              <div style={{ fontSize: 9, color: C.textFaint }}>Indicator not found in Neo4j graph database</div>
            </div>
          )}

          {!loading && !error && rawNodes.length > 0 && (
            <ForceGraph3D
              ref={graphRef}
              graphData={fgData}
              width={dims.w - (selectedNode ? 300 : 0)}
              height={dims.h}
              backgroundColor={C.graphBg}
              nodeColor={(n: unknown) => (n as { __color: string }).__color}
              nodeVal={(n: unknown) => (n as { __val: number }).__val}
              nodeLabel={(n: unknown) => {
                const node = n as { __label: string; labels: string[] };
                const label = primaryLabel(node.labels);
                const color = NODE_COLORS[label] ?? "#7A7A7A";
                return `<div style="background:${C.labelBg};border:1px solid ${color};padding:5px 9px;font-family:monospace;font-size:11px;color:${C.labelText};line-height:1.5">${node.__label}<br/><span style="font-size:9px;color:${C.labelMuted};letter-spacing:0.1em">${label.toUpperCase()}</span></div>`;
              }}
              nodeOpacity={0.92}
              nodeResolution={16}
              linkColor={() => C.linkCol}
              linkOpacity={0.4}
              linkWidth={0.5}
              linkDirectionalParticles={2}
              linkDirectionalParticleSpeed={0.0035}
              linkDirectionalParticleColor={() => C.red}
              linkDirectionalParticleWidth={1.5}
              linkLabel={(l: unknown) => (l as { __type: string }).__type ?? ""}
              onNodeClick={handleNodeClick}
              enableNodeDrag
              enableNavigationControls
              showNavInfo={false}
              onEngineStop={handleEngineStop}
            />
          )}

          {/* Legend */}
          {legendEntries.length > 0 && !loading && (
            <div style={{ position: "absolute", bottom: 20, left: 20, background: C.legendBg, border: `1px solid ${C.border}`, padding: "12px 16px", zIndex: 5, minWidth: 140 }}>
              <div style={{ fontSize: 7, color: C.muted, letterSpacing: "0.22em", marginBottom: 10 }}>▶ NODE TYPES</div>
              {legendEntries.map(([label, color]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, fontSize: 8, color: C.textMid, letterSpacing: "0.08em" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: color, boxShadow: `0 0 6px ${color}99` }} />
                  {label.toUpperCase()}
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 8, color: C.textMid, letterSpacing: "0.08em" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF1144", boxShadow: "0 0 10px #FF114499", flexShrink: 0 }} />
                  FOCAL IOC
                </div>
              </div>
            </div>
          )}

          {/* Controls hint */}
          {!loading && !error && rawNodes.length > 0 && (
            <div style={{ position: "absolute", bottom: 20, right: selectedNode ? 320 : 20, fontSize: 7, color: C.textFaint, letterSpacing: "0.1em", lineHeight: 1.8 }}>
              <div>DRAG — rotate</div>
              <div>SCROLL — zoom</div>
              <div>CLICK NODE — details</div>
              <div>RIGHT DRAG — pan</div>
            </div>
          )}
        </div>

        {/* ─ Right: Node detail panel ─ */}
        {selectedNode && (
          <NodePanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onNavigate={(val) => { onClose(); onInvestigate(val); }}
          />
        )}
      </div>
    </div>
    </GraphCtx.Provider>
  );
}
