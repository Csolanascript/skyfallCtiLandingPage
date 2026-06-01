"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { QueryGraphNode, QueryGraphRelationship } from "@/lib/query-types";

// ── Layout constants ──────────────────────────────────────────────────────────
const W        = 300;
const HEADER_H = 26;
const CANVAS_H = 210;
const TOTAL_H  = HEADER_H + CANVAS_H;

// ── Node colours (identical to IOCGraphModal) ─────────────────────────────────
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
  return labels.find((l) => !["Public", "Kafka", "Disk", "Private"].includes(l)) ?? labels[0] ?? "Node";
}

function nColor(labels: string[], isCentral: boolean): string {
  if (isCentral) return "#FF1144";
  return NODE_COLORS[primaryLabel(labels)] ?? "#7A7A7A";
}

function nName(props: Record<string, unknown>): string {
  const v = props.value ?? props.name ?? props.pattern ?? props.ip_value ?? props.title;
  if (!v) return "—";
  const s = String(v);
  return s.length > 20 ? s.slice(0, 18) + "…" : s;
}

// ── Canvas renderer ───────────────────────────────────────────────────────────
function drawGraph(
  canvas: HTMLCanvasElement,
  nodes: QueryGraphNode[],
  links: QueryGraphRelationship[],
  centralId: string,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, W, CANVAS_H);
  ctx.fillStyle = "#080808";
  ctx.fillRect(0, 0, W, CANVAS_H);

  for (let y = 0; y < CANVAS_H; y += 4) {
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(0, y, W, 1);
  }

  if (nodes.length === 0) {
    ctx.fillStyle = "rgba(212,212,212,0.2)";
    ctx.font = "8px 'JetBrains Mono',monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("NO_GRAPH_DATA", W / 2, CANVAS_H / 2);
    return;
  }

  const center   = nodes.find((n) => n.id === centralId) ?? nodes[0];
  const adjacent = nodes.filter((n) => n.id !== center.id).slice(0, 12);
  const cx = W / 2;
  const cy = CANVAS_H / 2 + 4;
  const radius = Math.min(W, CANVAS_H) * 0.34;

  const pos: Record<string, { x: number; y: number }> = {};
  pos[center.id] = { x: cx, y: cy };
  adjacent.forEach((n, i) => {
    const angle = (i / adjacent.length) * Math.PI * 2 - Math.PI / 2;
    pos[n.id] = { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  });

  // Links
  for (const link of links) {
    const s = pos[link.source];
    const t = pos[link.target];
    if (!s || !t) continue;
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(t.x, t.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = "5px 'JetBrains Mono',monospace";
    ctx.fillStyle = "rgba(212,212,212,0.14)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(link.relationship_type.slice(0, 14), (s.x + t.x) / 2, (s.y + t.y) / 2);
  }

  // Nodes (adjacent first, center on top)
  for (const node of [...adjacent, center]) {
    const p = pos[node.id];
    if (!p) continue;
    const isCentral = node.id === center.id;
    const color = nColor(node.labels, isCentral);
    const r = isCentral ? 13 : 7;

    if (isCentral) {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
      g.addColorStop(0, `${color}55`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = `${color}22`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = isCentral ? 2 : 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.stroke();

    if (!isCentral) {
      ctx.font = "5px 'JetBrains Mono',monospace";
      ctx.fillStyle = `${color}99`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(primaryLabel(node.labels).slice(0, 10).toUpperCase(), p.x, p.y - r - 2);
    }

    ctx.font = `${isCentral ? 7 : 6}px 'JetBrains Mono',monospace`;
    ctx.fillStyle = isCentral ? "#ffffff" : "rgba(212,212,212,0.55)";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(nName(node.properties), p.x, p.y + r + 2);
  }

  const extra = nodes.length - adjacent.length - 1;
  if (extra > 0) {
    ctx.font = "6px 'JetBrains Mono',monospace";
    ctx.fillStyle = "rgba(212,212,212,0.2)";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(`+${extra} more`, W - 8, CANVAS_H - 6);
  }
}

// ── Queries — identical structure to the full modals ──────────────────────────
const IOC_QUERY = `
  MATCH (center:Indicator)
  WHERE center.pattern CONTAINS $value
     OR center.name = $value
     OR center.value = $value
  WITH center LIMIT 1
  OPTIONAL MATCH (center)-[r1]-(n1)
  RETURN center, r1, n1
`;

const CAMPAIGN_QUERY = `
  MATCH (center:Campaign) WHERE center.name = $name
  WITH center
  OPTIONAL MATCH (center)-[r1]-(n1)
  RETURN center, r1, n1
`;

// Matches both IntrusionSet and ThreatActor labels
const GROUP_QUERY = `
  MATCH (center)
  WHERE (center:IntrusionSet OR center:ThreatActor) AND center.name = $name
  WITH center LIMIT 1
  OPTIONAL MATCH (center)-[r1]-(n1)
  RETURN center, r1, n1
`;

const TECHNIQUE_QUERY = `
  MATCH (center:Technique)
  WHERE center.external_id = $name OR center.name = $name
  WITH center LIMIT 1
  OPTIONAL MATCH (center)<-[r1]-(g:IntrusionSet)
  OPTIONAL MATCH (center)<-[r2]-(m:Malware)
  OPTIONAL MATCH (center)<-[r3:MITIGATES]-(mit:Mitigation)
  RETURN center, r1, g, r2, m, r3, mit
`;

const MALWARE_QUERY = `
  MATCH (center:Malware) WHERE center.name = $name
  WITH center LIMIT 1
  OPTIONAL MATCH (center)-[r1]-(n1)
  RETURN center, r1, n1
`;

const VULNERABILITY_QUERY = `
  MATCH (center:Vulnerability)
  WHERE center.x_cve_id = $name
  WITH center LIMIT 1
  OPTIONAL MATCH (center)-[r1:TARGETS]->(s:Software)
  OPTIONAL MATCH (center)-[r2:USES]->(t:Technique)
  RETURN center, r1, s, r2, t
`;

function queryConfig(type: NodePreviewType, value: string): { query: string; params: Record<string, string> } {
  if (type === "ioc")           return { query: IOC_QUERY,           params: { value } };
  if (type === "campaign")      return { query: CAMPAIGN_QUERY,      params: { name: value } };
  if (type === "technique")     return { query: TECHNIQUE_QUERY,     params: { name: value } };
  if (type === "malware")       return { query: MALWARE_QUERY,       params: { name: value } };
  if (type === "vulnerability") return { query: VULNERABILITY_QUERY, params: { name: value } };
  return                               { query: GROUP_QUERY,         params: { name: value } };
}

function centralLabelFor(type: NodePreviewType): string {
  if (type === "ioc")           return "Indicator";
  if (type === "campaign")      return "Campaign";
  if (type === "technique")     return "Technique";
  if (type === "malware")       return "Malware";
  if (type === "vulnerability") return "Vulnerability";
  return "IntrusionSet";
}

// ── Public types ──────────────────────────────────────────────────────────────
export type NodePreviewType = "ioc" | "campaign" | "group" | "technique" | "malware" | "vulnerability";

interface Props {
  type:   NodePreviewType;
  value:  string;
  mouseX: number;
  mouseY: number;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function NodeHoverPreview({ type, value, mouseX, mouseY }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  const accentColor =
    type === "ioc"           ? "#E85419" :
    type === "campaign"      ? "#FFD700" :
    type === "technique"     ? "#00FF41" :
    type === "malware"       ? "#FF8C00" :
    type === "vulnerability" ? "#f97316" : "#a855f7";

  // Fetch graph data whenever type or value changes
  useEffect(() => {
    setStatus("loading");
    const controller = new AbortController();
    const { query, params } = queryConfig(type, value);

    fetch("/api/graph/run-query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, params, limit: 25 }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (data?.status !== "ok") { setStatus("error"); return; }

        const nodes: QueryGraphNode[]        = data.graph?.nodes         ?? [];
        const links: QueryGraphRelationship[] = data.graph?.relationships ?? [];

        const label     = centralLabelFor(type);
        const centralId = nodes.find((n) =>
          type === "group"
            ? n.labels.includes("IntrusionSet") || n.labels.includes("ThreatActor")
            : n.labels.includes(label)
        )?.id ?? nodes[0]?.id ?? "";

        setStatus("done");
        requestAnimationFrame(() => {
          if (canvasRef.current) drawGraph(canvasRef.current, nodes, links, centralId);
        });
      })
      .catch((err) => {
        if (String(err) !== "AbortError" && err?.name !== "AbortError") setStatus("error");
      });

    return () => controller.abort();
  }, [type, value]); // position changes do NOT re-fetch

  // Position: right of cursor, clamped to viewport
  const vw   = typeof window !== "undefined" ? window.innerWidth  : 1200;
  const vh   = typeof window !== "undefined" ? window.innerHeight : 800;
  const left = Math.min(mouseX + 18, vw - W - 8);
  const top  = Math.max(8, Math.min(mouseY - TOTAL_H / 2, vh - TOTAL_H - 8));

  const typeLabel =
    type === "ioc"           ? "INDICATOR"     :
    type === "campaign"      ? "CAMPAIGN"      :
    type === "technique"     ? "TECHNIQUE"     :
    type === "malware"       ? "MALWARE"       :
    type === "vulnerability" ? "VULNERABILITY" : "THREAT_ACTOR";

  const panel = (
    <div style={{
      position: "fixed", left, top, width: W, height: TOTAL_H,
      background: "#080808",
      border: `1px solid ${accentColor}44`,
      borderLeft: `2px solid ${accentColor}`,
      zIndex: 99999, pointerEvents: "none",
      fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
      overflow: "hidden",
      boxShadow: `0 0 30px ${accentColor}18, 0 12px 40px rgba(0,0,0,0.85)`,
    }}>
      {/* Bracket corners */}
      {([
        { top: -1, left:  -1, borderTop:    `1px solid ${accentColor}`, borderLeft:  `1px solid ${accentColor}` },
        { top: -1, right: -1, borderTop:    `1px solid ${accentColor}`, borderRight: `1px solid ${accentColor}` },
        { bottom: -1, left:  -1, borderBottom: `1px solid ${accentColor}`, borderLeft:  `1px solid ${accentColor}` },
        { bottom: -1, right: -1, borderBottom: `1px solid ${accentColor}`, borderRight: `1px solid ${accentColor}` },
      ] as React.CSSProperties[]).map((s, i) => (
        <div key={i} style={{ position: "absolute", width: 7, height: 7, ...s }} />
      ))}

      {/* Header */}
      <div style={{
        height: HEADER_H, padding: "0 10px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: `${accentColor}0a`,
      }}>
        <span style={{ fontSize: 7, color: accentColor, letterSpacing: "0.2em", fontWeight: 700 }}>
          ▶ {typeLabel}_PREVIEW
        </span>
        <span style={{
          fontSize: 7, color: "rgba(212,212,212,0.25)", letterSpacing: "0.04em",
          maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {value}
        </span>
      </div>

      {/* Canvas area */}
      <div style={{ position: "relative", width: W, height: CANVAS_H }}>
        {status === "loading" && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            <div style={{
              width: 18, height: 18,
              border: `2px solid ${accentColor}33`,
              borderTop: `2px solid ${accentColor}`,
              borderRadius: "50%",
              animation: "nhp-spin 0.8s linear infinite",
            }} />
            <span style={{ fontSize: 7, color: accentColor, letterSpacing: "0.18em" }}>QUERYING_NEO4J</span>
            <style>{`@keyframes nhp-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {status === "error" && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 8, color: "rgba(212,212,212,0.18)", letterSpacing: "0.15em" }}>
              NO_GRAPH_DATA
            </span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={W}
          height={CANVAS_H}
          style={{ display: status === "done" ? "block" : "none", width: W, height: CANVAS_H }}
        />
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(panel, document.body);
}
