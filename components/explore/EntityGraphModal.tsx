"use client";

import { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import dynamic from "next/dynamic";
import {
  X, RefreshCw, Users, Activity, Bug,
  Target, Globe, Clock, Shield, Server,
  Crosshair, Network, Sun, Moon, type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/lib/theme";

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false });

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
  bg: "#000000", red: "#E85419", redDim: "rgba(232,84,25,0.22)", white: "#D4D4D4",
  muted: "rgba(212,212,212,0.38)", border: "rgba(255,255,255,0.07)",
  mono: "'JetBrains Mono','Fira Code','Courier New',monospace",
  orange: "#FF8C00", green: "#00FF41", surface: "rgba(232,84,25,0.04)",
  cyan: "#22d3ee", gold: "#FFD700", purple: "#a855f7",
  panelBg: "rgba(0,0,0,0.32)", heavyBg: "rgba(0,0,0,0.72)", legendBg: "rgba(0,0,0,0.88)",
  codeBg: "rgba(0,0,0,0.5)", subtleBg: "rgba(255,255,255,0.015)",
  textFaint: "rgba(212,212,212,0.25)", textMid: "rgba(212,212,212,0.6)",
  textDim: "rgba(212,212,212,0.3)", textValue: "rgba(212,212,212,0.75)",
  rowBorder: "rgba(255,255,255,0.04)", graphBg: "#000000",
  linkCol: "rgba(255,255,255,0.14)", labelBg: "rgba(0,0,0,0.92)",
  labelText: "#D4D4D4", labelMuted: "rgba(212,212,212,0.45)",
};

const LIGHT_GC: GraphC = {
  bg: "#F0EFE8", red: "#E85419", redDim: "rgba(232,84,25,0.22)", white: "#1A1A1A",
  muted: "rgba(26,26,26,0.50)", border: "rgba(0,0,0,0.09)",
  mono: "'JetBrains Mono','Fira Code','Courier New',monospace",
  orange: "#E07000", green: "#007A20", surface: "rgba(0,0,0,0.04)",
  cyan: "#0891b2", gold: "#9A7B0A", purple: "#7c3aed",
  panelBg: "rgba(0,0,0,0.03)", heavyBg: "rgba(240,239,232,0.98)", legendBg: "rgba(240,239,232,0.97)",
  codeBg: "rgba(0,0,0,0.04)", subtleBg: "rgba(0,0,0,0.02)",
  textFaint: "rgba(26,26,26,0.20)", textMid: "rgba(26,26,26,0.55)",
  textDim: "rgba(26,26,26,0.30)", textValue: "rgba(26,26,26,0.75)",
  rowBorder: "rgba(0,0,0,0.05)", graphBg: "#F0EFE8",
  linkCol: "rgba(0,0,0,0.12)", labelBg: "rgba(240,239,232,0.97)",
  labelText: "#1A1A1A", labelMuted: "rgba(26,26,26,0.45)",
};

const GraphCtx = createContext<GraphC>(DARK_GC);
const useGC = () => useContext(GraphCtx);

const LEFT_W = 340;

// ── Node type colours ─────────────────────────────────────────────────────────
const NODE_COLORS: Record<string, string> = {
  Indicator:      "#E85419",
  IP:             "#22d3ee",
  Identity:       "#a855f7",
  Malware:        "#FF8C00",
  Campaign:       "#FFD700",
  IntrusionSet:   "#f97316",
  ThreatActor:    "#f97316",
  Technique:      "#00FF41",
  Vulnerability:  "#ef4444",
  Domain:         "#22c55e",
  Location:       "#3b82f6",
  Infrastructure: "#06b6d4",
};

const NODE_PRIORITY = [
  "Campaign", "IntrusionSet", "ThreatActor", "Indicator", "IP", "Identity",
  "Malware", "Technique", "Vulnerability", "Domain", "Location", "Infrastructure",
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
  if (isCentral) return 14;
  const pl = primaryLabel(labels);
  if (pl === "Campaign" || pl === "IntrusionSet" || pl === "ThreatActor") return 8;
  if (pl === "Malware" || pl === "Technique") return 5;
  return 3;
}
function displayName(properties: Record<string, unknown>): string {
  const v = properties.name ?? properties.value ?? properties.pattern;
  if (!v) return "—";
  const s = String(v);
  return s.length > 32 ? s.slice(0, 30) + "…" : s;
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

export type EntityType = "campaign" | "group" | "technique" | "malware" | "vulnerability";

interface EntitySummary {
  central:          GraphNode | undefined;
  actorNodes:       GraphNode[];
  campaignNodes:    GraphNode[];
  malwareNodes:     GraphNode[];
  techniqueNodes:   GraphNode[];
  indicatorNodes:   GraphNode[];
  locationNodes:    GraphNode[];
  infraNodes:       GraphNode[];
  vulnNodes:        GraphNode[];
  identityNodes:    GraphNode[];
  mitigationNodes:  GraphNode[];
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
function str(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;
  return String(val);
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

function buildEntitySummary(
  rawNodes: GraphNode[],
  rawLinks: GraphLink[],
  centralId: string | null,
  entityType: EntityType,
): EntitySummary {
  const central = centralId
    ? rawNodes.find((n) => n.id === centralId)
    : rawNodes.find((n) =>
        entityType === "campaign"
          ? n.labels.includes("Campaign")
          : entityType === "technique"
            ? n.labels.includes("Technique")
            : entityType === "vulnerability"
              ? n.labels.includes("Vulnerability")
              : n.labels.includes("IntrusionSet") || n.labels.includes("ThreatActor"),
      );

  const connectedIds = new Set(
    rawLinks
      .filter((l) => l.source === central?.id || l.target === central?.id)
      .flatMap((l) => [l.source, l.target]),
  );
  const adjacent = rawNodes.filter((n) => connectedIds.has(n.id) && n.id !== central?.id);

  // For groups, pull campaigns via 2nd hop too
  const allCampaignIds = new Set(
    rawLinks
      .filter((l) => l.target === central?.id || l.source === central?.id)
      .flatMap((l) => [l.source, l.target])
      .filter((id) => rawNodes.find((n) => n.id === id && n.labels.includes("Campaign"))),
  );

  return {
    central,
    actorNodes:      adjacent.filter((n) => n.labels.includes("IntrusionSet") || n.labels.includes("ThreatActor")),
    campaignNodes:   rawNodes.filter((n) => allCampaignIds.has(n.id) && n.labels.includes("Campaign")),
    malwareNodes:    adjacent.filter((n) => n.labels.includes("Malware")),
    techniqueNodes:  adjacent.filter((n) => n.labels.includes("Technique")),
    indicatorNodes:  adjacent.filter((n) => n.labels.includes("Indicator")),
    locationNodes:   adjacent.filter((n) => n.labels.includes("Location") || n.labels.includes("Country")),
    infraNodes:      adjacent.filter((n) => n.labels.includes("Infrastructure")),
    vulnNodes:       adjacent.filter((n) => n.labels.includes("Vulnerability")),
    identityNodes:   adjacent.filter((n) => n.labels.includes("Identity")),
    mitigationNodes: adjacent.filter((n) => n.labels.includes("Mitigation")),
  };
}

// ── Cypher queries ────────────────────────────────────────────────────────────
const CAMPAIGN_QUERY = `
  MATCH (c:Campaign) WHERE c.name = $name
  WITH c
  OPTIONAL MATCH (c)-[r1]-(n1)
  OPTIONAL MATCH (c)-[:ATTRIBUTED_TO]->(g:IntrusionSet)-[r2]-(n2)
  OPTIONAL MATCH (c)-[:USES]->(m:Malware)-[r3]-(n3)
  RETURN c, r1, n1, g, r2, n2, m, r3, n3
`;

const GROUP_QUERY = `
  MATCH (g)
  WHERE (g:IntrusionSet OR g:ThreatActor) AND g.name = $name
  WITH g LIMIT 1
  OPTIONAL MATCH (g)-[r1]-(n1)
  OPTIONAL MATCH (g)<-[:ATTRIBUTED_TO]-(c:Campaign)-[r2]-(n2)
  RETURN g, r1, n1, c, r2, n2
`;

const MALWARE_QUERY = `
  MATCH (m:Malware) WHERE m.name = $name
  WITH m LIMIT 1
  OPTIONAL MATCH (m)-[r1]-(n1)
  RETURN m, r1, n1
`;

const TECHNIQUE_QUERY = `
  MATCH (t:Technique)
  WHERE t.external_id = $name OR t.name = $name
  WITH t LIMIT 1
  OPTIONAL MATCH (t)<-[r1:USES]-(g:IntrusionSet)
  OPTIONAL MATCH (t)<-[r2:USES]-(m:Malware)
  OPTIONAL MATCH (t)<-[r3:MITIGATES]-(mit:Mitigation)
  OPTIONAL MATCH (t)-[r4:USES]->(vuln:Vulnerability)
  RETURN t, r1, g, r2, m, r3, mit, r4, vuln
`;

const VULNERABILITY_QUERY = `
  MATCH (v:Vulnerability)
  WHERE v.x_cve_id = $name OR v.name = $name
  WITH v LIMIT 1
  OPTIONAL MATCH (v)-[r1:TARGETS]->(s:Software)
  OPTIONAL MATCH (v)-[r2:USES]->(t:Technique)
  OPTIONAL MATCH (n:Note)-[r3]->(v)
  RETURN v, r1, s, r2, t, r3, n
`;

// ── UI atoms ──────────────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, label }: { icon?: LucideIcon; label: string }) {
  const C = useGC();
  return (
    <div style={{
      fontSize: 7, fontWeight: 700, letterSpacing: "0.22em", color: C.red,
      marginBottom: 7, display: "flex", alignItems: "center", gap: 5,
    }}>
      {Icon && <Icon size={8} />}{label}
    </div>
  );
}

function Chip({ label, color }: { label: string; color?: string }) {
  const C = useGC();
  const clr = color ?? C.muted;
  return (
    <span style={{
      padding: "2px 7px", fontSize: 8, letterSpacing: "0.07em",
      border: `1px solid ${clr}44`, color: clr,
      background: `${clr}0d`, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function KV({ k, v, vColor }: { k: string; v: string; vColor?: string }) {
  const C = useGC();
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 9 }}>
      <span style={{ color: C.muted, flexShrink: 0 }}>{k}</span>
      <span style={{ color: vColor ?? C.white, textAlign: "right", wordBreak: "break-all" }}>{v}</span>
    </div>
  );
}

// ── Entity Summary Panel ──────────────────────────────────────────────────────
function EntitySummaryPanel({
  entityType, entityName, summary, loading,
}: {
  entityType: EntityType;
  entityName: string;
  summary: EntitySummary | null;
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

  const c              = summary?.central;
  const isCampaign     = entityType === "campaign";
  const isTechnique    = entityType === "technique";

  // Extract arrays upfront to avoid non-null assertions in JSX
  const actorNodes      = summary?.actorNodes      ?? [];
  const campaignNodes   = summary?.campaignNodes   ?? [];
  const malwareNodes    = summary?.malwareNodes    ?? [];
  const techniqueNodes  = summary?.techniqueNodes  ?? [];
  const locationNodes   = summary?.locationNodes   ?? [];
  const indicatorNodes  = summary?.indicatorNodes  ?? [];
  const vulnNodes       = summary?.vulnNodes       ?? [];
  const infraNodes      = summary?.infraNodes      ?? [];
  const identityNodes   = summary?.identityNodes   ?? [];
  const mitigationNodes = summary?.mitigationNodes ?? [];

  const description        = str(c?.properties.description);
  const aliases            = toArray(c?.properties.aliases);
  const firstSeen          = str(c?.properties.first_seen ?? c?.properties.created);
  const lastSeen           = str(c?.properties.last_seen  ?? c?.properties.modified);
  const objective          = str(c?.properties.objective);
  const resourceLevel      = str(c?.properties.resource_level);
  const primaryMotivation  = str(c?.properties.primary_motivation);

  // Technique-specific
  const mitreId   = str(c?.properties.external_id ?? c?.properties.x_mitre_id);
  const platforms = toArray(c?.properties.x_mitre_platforms);

  const headerLabel  = isTechnique ? "TECHNIQUE_BRIEF" : isCampaign ? "CAMPAIGN_BRIEF" : "THREAT_ACTOR_BRIEF";
  const headerColor  = isTechnique ? C.cyan : isCampaign ? C.gold : C.purple;

  return (
    <div style={{ padding: "14px 14px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: 7, color: C.muted, letterSpacing: "0.2em", marginBottom: 4 }}>
          ▶ {headerLabel}
        </div>
        {isTechnique && mitreId && (
          <div style={{ fontSize: 10, fontWeight: 700, color: C.cyan, letterSpacing: "0.12em", marginBottom: 4 }}>
            {mitreId}
          </div>
        )}
        <div style={{
          fontSize: 13, fontWeight: 900, letterSpacing: "0.04em", lineHeight: 1.3,
          color: headerColor, wordBreak: "break-all",
        }}>
          {entityName}
        </div>
        {aliases.length > 0 && (
          <div style={{ fontSize: 8, color: C.muted, marginTop: 4 }}>
            {aliases.slice(0, 4).join(" · ")}
            {aliases.length > 4 && ` +${aliases.length - 4}`}
          </div>
        )}
        {isTechnique && platforms.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 6 }}>
            {platforms.map((p, i) => (
              <span key={i} style={{
                padding: "1px 5px", fontSize: 7, letterSpacing: "0.08em",
                border: `1px solid ${C.cyan}44`, color: C.cyan, background: `${C.cyan}0d`,
              }}>{p}</span>
            ))}
          </div>
        )}
      </div>

      {description ? (
        <div style={{
          padding: "9px 11px", border: `1px solid ${C.border}`,
          fontSize: 9, color: "rgba(212,212,212,0.65)", lineHeight: 1.6,
          background: C.subtleBg,
        }}>
          {description}
        </div>
      ) : null}

      {(firstSeen || lastSeen || objective || resourceLevel || primaryMotivation) ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 5, padding: "9px 11px", border: `1px solid ${C.border}` }}>
          {firstSeen         ? <KV k="FIRST SEEN"  v={formatDate(firstSeen)} /> : null}
          {lastSeen          ? <KV k="LAST SEEN"   v={formatDate(lastSeen)}  /> : null}
          {objective         ? <KV k="OBJECTIVE"   v={objective}             /> : null}
          {resourceLevel     ? <KV k="RESOURCES"   v={resourceLevel}         /> : null}
          {primaryMotivation ? <KV k="MOTIVATION"  v={primaryMotivation}     /> : null}
        </div>
      ) : null}

      {isCampaign && actorNodes.length > 0 ? (
        <div>
          <SectionTitle icon={Users} label="ATTRIBUTED THREAT ACTOR" />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {actorNodes.map((n, i) => {
              const name = str(n.properties.name ?? n.properties.value) ?? "Unknown";
              const al   = toArray(n.properties.aliases);
              return (
                <div key={i} style={{ padding: "7px 10px", border: `1px solid rgba(249,115,22,0.3)`, background: "rgba(249,115,22,0.04)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.orange }}>{name}</div>
                  {al.length > 0 ? (
                    <div style={{ fontSize: 7, color: C.muted, marginTop: 2 }}>
                      {al.slice(0, 3).join(" · ")}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {!isCampaign && campaignNodes.length > 0 ? (
        <div>
          <SectionTitle icon={Activity} label={`CAMPAIGNS (${campaignNodes.length})`} />
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {campaignNodes.slice(0, 6).map((n, i) => {
              const name = str(n.properties.name ?? n.properties.value) ?? "Unknown";
              const desc = str(n.properties.description);
              return (
                <div key={i} style={{ padding: "5px 9px", border: `1px solid rgba(255,215,0,0.2)`, background: "rgba(255,215,0,0.02)" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.gold }}>{name}</div>
                  {desc ? (
                    <div style={{ fontSize: 7, color: C.muted, marginTop: 2, lineHeight: 1.4, overflow: "hidden", maxHeight: 36 }}>
                      {desc}
                    </div>
                  ) : null}
                </div>
              );
            })}
            {campaignNodes.length > 6 ? (
              <div style={{ fontSize: 8, color: C.muted, padding: "3px 9px" }}>
                +{campaignNodes.length - 6} more campaigns
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {malwareNodes.length > 0 ? (
        <div>
          <SectionTitle icon={Bug} label="MALWARE FAMILIES" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {malwareNodes.map((n, i) => (
              <Chip key={i} label={str(n.properties.name ?? n.properties.value) ?? "?"} color={C.orange} />
            ))}
          </div>
        </div>
      ) : null}

      {techniqueNodes.length > 0 ? (
        <div>
          <SectionTitle icon={Target} label="MITRE ATT&CK" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {techniqueNodes.map((n, i) => (
              <Chip key={i} label={str(n.properties.x_mitre_id ?? n.properties.name ?? n.properties.value) ?? "?"} color={C.cyan} />
            ))}
          </div>
        </div>
      ) : null}

      {locationNodes.length > 0 ? (
        <div>
          <SectionTitle icon={Globe} label="TARGETED LOCATIONS" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {locationNodes.map((n, i) => (
              <Chip key={i} label={str(n.properties.name ?? n.properties.country ?? n.properties.value) ?? "?"} color={C.cyan} />
            ))}
          </div>
        </div>
      ) : null}

      {indicatorNodes.length > 0 ? (
        <div>
          <SectionTitle icon={Shield} label={`INDICATORS (${indicatorNodes.length})`} />
          <div style={{ padding: "8px 10px", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 8, color: C.red, fontWeight: 700, letterSpacing: "0.12em" }}>
              {indicatorNodes.length} linked indicator{indicatorNodes.length !== 1 ? "s" : ""}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 6 }}>
              {indicatorNodes.slice(0, 5).map((n, i) => {
                const val = str(n.properties.value ?? n.properties.pattern) ?? "—";
                return (
                  <div key={i} style={{ fontSize: 8, color: C.muted, fontFamily: C.mono, wordBreak: "break-all" }}>
                    {val.length > 40 ? val.slice(0, 38) + "…" : val}
                  </div>
                );
              })}
              {indicatorNodes.length > 5 ? (
                <div style={{ fontSize: 7, color: "rgba(212,212,212,0.25)" }}>
                  +{indicatorNodes.length - 5} more
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {vulnNodes.length > 0 ? (
        <div>
          <SectionTitle icon={Crosshair} label="VULNERABILITIES" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {vulnNodes.map((n, i) => (
              <Chip key={i} label={str(n.properties.x_cve_id ?? n.properties.name ?? n.properties.value) ?? "?"} color="#ef4444" />
            ))}
          </div>
        </div>
      ) : null}

      {infraNodes.length > 0 ? (
        <div>
          <SectionTitle icon={Server} label="INFRASTRUCTURE" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {infraNodes.map((n, i) => (
              <Chip key={i} label={str(n.properties.value ?? n.properties.name) ?? "?"} color="#06b6d4" />
            ))}
          </div>
        </div>
      ) : null}

      {identityNodes.length > 0 ? (
        <div>
          <SectionTitle icon={Network} label="TARGETED SECTORS" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {identityNodes.map((n, i) => (
              <Chip key={i} label={str(n.properties.name ?? n.properties.value) ?? "?"} color={C.purple} />
            ))}
          </div>
        </div>
      ) : null}

      {mitigationNodes.length > 0 ? (
        <div>
          <SectionTitle icon={Shield} label={`MITIGATIONS (${mitigationNodes.length})`} />
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {mitigationNodes.slice(0, 5).map((n, i) => {
              const name = str(n.properties.name ?? n.properties.value) ?? "Unknown";
              const desc = str(n.properties.description);
              return (
                <div key={i} style={{ padding: "6px 9px", border: `1px solid rgba(0,255,65,0.2)`, background: "rgba(0,255,65,0.02)" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.green }}>{name}</div>
                  {desc ? (
                    <div style={{ fontSize: 7, color: C.muted, marginTop: 2, lineHeight: 1.4, maxHeight: 28, overflow: "hidden" }}>
                      {desc}
                    </div>
                  ) : null}
                </div>
              );
            })}
            {mitigationNodes.length > 5 ? (
              <div style={{ fontSize: 8, color: C.muted, padding: "2px 9px" }}>+{mitigationNodes.length - 5} more</div>
            ) : null}
          </div>
        </div>
      ) : null}

      {c && (c.properties.created || c.properties.modified || c.properties.first_seen || c.properties.last_seen) ? (
        <div>
          <SectionTitle icon={Clock} label="TIMESTAMPS" />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ height: 1, background: C.border }} />
            {c.properties.first_seen  ? <KV k="FIRST SEEN"  v={formatDate(c.properties.first_seen)}  /> : null}
            {c.properties.last_seen   ? <KV k="LAST SEEN"   v={formatDate(c.properties.last_seen)}   /> : null}
            {c.properties.created     ? <KV k="CREATED"     v={formatDate(c.properties.created)}     /> : null}
            {c.properties.modified    ? <KV k="MODIFIED"    v={formatDate(c.properties.modified)}    /> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Node properties panel ─────────────────────────────────────────────────────
function NodePanel({ node, onClose }: { node: GraphNode; onClose: () => void }) {
  const C  = useGC();
  const pl    = primaryLabel(node.labels);
  const color = NODE_COLORS[pl] ?? "#7A7A7A";
  const SKIP  = new Set(["id", "type"]);
  const entries = Object.entries(node.properties).filter(
    ([k]) => !SKIP.has(k) && node.properties[k] != null,
  );

  return (
    <div style={{
      width: 280, flexShrink: 0, display: "flex", flexDirection: "column",
      borderLeft: `1px solid ${C.border}`, background: C.heavyBg,
      fontFamily: C.mono, overflow: "hidden",
    }}>
      <div style={{
        padding: "10px 14px", borderBottom: `1px solid ${C.border}`,
        background: C.codeBg, display: "flex",
        justifyContent: "space-between", alignItems: "center", flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 7, color: C.muted, letterSpacing: "0.2em", marginBottom: 3 }}>NODE PROPERTIES</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.white }}>{pl.toUpperCase()}</span>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: "none", border: `1px solid ${C.border}`, color: C.muted,
          cursor: "pointer", padding: "3px 6px", fontSize: 8, letterSpacing: "0.1em", fontFamily: C.mono,
        }}>✕</button>
      </div>

      <div style={{ padding: "7px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", flexWrap: "wrap", gap: 4, flexShrink: 0 }}>
        {node.labels.map((l) => (
          <span key={l} style={{ padding: "1px 5px", fontSize: 7, letterSpacing: "0.08em", border: `1px solid ${C.redDim}`, color: C.muted }}>{l}</span>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
        {entries.map(([k, v]) => (
          <div key={k} style={{ marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${C.rowBorder}` }}>
            <div style={{ fontSize: 7, color: C.textDim, letterSpacing: "0.15em", marginBottom: 2 }}>
              {k.toUpperCase().replace(/_/g, " ")}
            </div>
            <div style={{ fontSize: 9, color: C.textValue, wordBreak: "break-all", lineHeight: 1.5, maxHeight: 52, overflow: "hidden" }}>
              {Array.isArray(v) ? v.join(", ") : String(v)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
interface Props {
  entityType: EntityType;
  entityName: string;
  onClose: () => void;
}

export default function EntityGraphModal({ entityType, entityName, onClose }: Props) {
  const [rawNodes,     setRawNodes]     = useState<GraphNode[]>([]);
  const [rawLinks,     setRawLinks]     = useState<GraphLink[]>([]);
  const { isDark, toggle } = useTheme();
  const C = isDark ? DARK_GC : LIGHT_GC;

  const [centralId,    setCentralId]    = useState<string | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [dims,         setDims]         = useState({ w: 800, h: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);

  const accentColor =
    entityType === "campaign"      ? C.gold    :
    entityType === "technique"     ? C.cyan    :
    entityType === "vulnerability" ? C.orange  : C.purple;
  const entityLabel =
    entityType === "campaign"      ? "CAMPAIGN"      :
    entityType === "technique"     ? "TECHNIQUE"     :
    entityType === "vulnerability" ? "VULNERABILITY" : "THREAT ACTOR";

  // Resize observer
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

  // Fetch graph
  useEffect(() => {
    setLoading(true);
    setError(null);
    setSelectedNode(null);
    setCentralId(null);

    const query =
      entityType === "campaign"      ? CAMPAIGN_QUERY      :
      entityType === "technique"     ? TECHNIQUE_QUERY     :
      entityType === "malware"       ? MALWARE_QUERY       :
      entityType === "vulnerability" ? VULNERABILITY_QUERY : GROUP_QUERY;

    fetch("/api/graph/run-query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, params: { name: entityName }, limit: 300 }),
    })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => {
        if (d.status !== "ok") throw new Error(d.detail ?? "Query failed");

        const nodes: GraphNode[] = d.graph.nodes ?? [];
        const links: GraphLink[] = d.graph.relationships ?? [];

        const central =
          entityType === "campaign"
            ? nodes.find((n) => n.labels.includes("Campaign") && String(n.properties.name ?? "") === entityName)
              ?? nodes.find((n) => n.labels.includes("Campaign"))
            : entityType === "technique"
              ? nodes.find((n) => n.labels.includes("Technique") &&
                  (String(n.properties.external_id ?? "") === entityName || String(n.properties.name ?? "") === entityName))
                ?? nodes.find((n) => n.labels.includes("Technique"))
            : entityType === "malware"
              ? nodes.find((n) => n.labels.includes("Malware") && String(n.properties.name ?? "") === entityName)
                ?? nodes.find((n) => n.labels.includes("Malware"))
              : nodes.find((n) =>
                  (n.labels.includes("IntrusionSet") || n.labels.includes("ThreatActor")) &&
                  String(n.properties.name ?? "") === entityName,
                )
                ?? nodes.find((n) => n.labels.includes("IntrusionSet") || n.labels.includes("ThreatActor"))
            ?? null;

        setCentralId(central?.id ?? null);
        setRawNodes(nodes);
        setRawLinks(links);
        setLoading(false);
      })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, [entityType, entityName]);

  const entitySummary = useMemo(
    () => rawNodes.length > 0 ? buildEntitySummary(rawNodes, rawLinks, centralId, entityType) : null,
    [rawNodes, rawLinks, centralId, entityType],
  );

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
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: C.bg, display: "flex", flexDirection: "column",
      fontFamily: C.mono,
    }}>
      {/* ── Header ── */}
      <header style={{
        borderBottom: `1px solid ${accentColor}44`, padding: "9px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: `${accentColor}06`, flexShrink: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 3, height: 20, background: accentColor, boxShadow: `0 0 18px ${accentColor}88` }} />
          <div>
            <div style={{ fontSize: 7, color: C.muted, letterSpacing: "0.2em", marginBottom: 3 }}>
              ▶ {entityLabel}_GRAPH_EXPLORER
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: accentColor, letterSpacing: "0.04em" }}>
              {entityName}
            </div>
          </div>
          {!loading && !error && (
            <div style={{
              fontSize: 8, color: C.muted, letterSpacing: "0.1em",
              padding: "3px 10px", border: `1px solid ${C.border}`, display: "flex", gap: 16,
            }}>
              <span>{rawNodes.length} <span style={{ color: C.textFaint }}>NODES</span></span>
              <span>{rawLinks.length} <span style={{ color: C.textFaint }}>EDGES</span></span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={toggle} style={{
            background: "none", border: `1px solid ${C.border}`, color: C.muted,
            cursor: "pointer", padding: "6px 10px", fontFamily: C.mono,
            fontSize: 9, letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 5,
          }}>
            {isDark ? <Sun size={9} /> : <Moon size={9} />}
            {isDark ? "LIGHT" : "DARK"}
          </button>
          <button onClick={onClose} style={{
            background: "none", border: `1px solid ${C.border}`, color: C.muted,
            cursor: "pointer", padding: "6px 14px", fontFamily: C.mono,
            fontSize: 9, letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 5,
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
          <div style={{
            padding: "6px 14px", borderBottom: `1px solid ${C.border}`,
            background: C.codeBg, fontSize: 7, color: C.muted,
            letterSpacing: "0.15em", flexShrink: 0,
          }}>
            {entityLabel} INTELLIGENCE BRIEF
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <EntitySummaryPanel
              entityType={entityType}
              entityName={entityName}
              summary={entitySummary}
              loading={loading}
            />
          </div>
        </div>

        {/* ─ Center: Graph canvas ─ */}
        <div ref={containerRef} style={{ flex: 1, position: "relative", overflow: "hidden" }}>

          {loading && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, zIndex: 10 }}>
              <RefreshCw size={18} className="animate-spin" style={{ color: accentColor }} />
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
              <div style={{ fontSize: 9, color: C.textFaint }}>
                {entityLabel} not found in Neo4j graph database
              </div>
            </div>
          )}

          {!loading && !error && rawNodes.length > 0 && (
            <ForceGraph3D
              ref={graphRef}
              graphData={fgData}
              width={dims.w - (selectedNode ? 280 : 0)}
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
              linkDirectionalParticleSpeed={0.003}
              linkDirectionalParticleColor={() => accentColor}
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
            <div style={{
              position: "absolute", bottom: 20, left: 20,
              background: C.legendBg, border: `1px solid ${C.border}`,
              padding: "12px 16px", zIndex: 5, minWidth: 140,
            }}>
              <div style={{ fontSize: 7, color: C.muted, letterSpacing: "0.22em", marginBottom: 10 }}>▶ NODE TYPES</div>
              {legendEntries.map(([label, color]) => (
                <div key={label} style={{
                  display: "flex", alignItems: "center", gap: 7,
                  marginBottom: 5, fontSize: 8, color: C.textMid, letterSpacing: "0.08em",
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: color, boxShadow: `0 0 6px ${color}99` }} />
                  {label.toUpperCase()}
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 8, color: C.textMid, letterSpacing: "0.08em" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF1144", boxShadow: "0 0 10px #FF114499", flexShrink: 0 }} />
                  FOCAL NODE
                </div>
              </div>
            </div>
          )}

          {/* Controls hint */}
          {!loading && !error && rawNodes.length > 0 && (
            <div style={{
              position: "absolute", bottom: 20, right: selectedNode ? 300 : 20,
              fontSize: 7, color: C.textFaint, letterSpacing: "0.1em", lineHeight: 1.8,
            }}>
              <div>DRAG — rotate</div>
              <div>SCROLL — zoom</div>
              <div>CLICK NODE — details</div>
              <div>RIGHT DRAG — pan</div>
            </div>
          )}
        </div>

        {/* ─ Right: Node detail panel ─ */}
        {selectedNode && (
          <NodePanel node={selectedNode} onClose={() => setSelectedNode(null)} />
        )}
      </div>
    </div>
    </GraphCtx.Provider>
  );
}
