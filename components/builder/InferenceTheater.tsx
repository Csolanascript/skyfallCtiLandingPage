"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ExternalLink, RotateCcw, X, ChevronDown, ChevronUp, Share2 } from "lucide-react";
import { useForge, Brackets } from "./ForgeLayout";

// Dynamic import: ForceGraph2D is browser-only
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

// ── Phase labels ──────────────────────────────────────────────────────────────
const PHASE_LABELS: Record<string, string> = {
  start:                            "INITIALISE BUNDLE",
  merge_nodes:                      "MERGE NODES",
  merge_rels:                       "MERGE RELATIONSHIPS",
  normalize_display_names:          "NORMALIZE DISPLAY NAMES",
  name_reports:                     "NAME REPORTS",
  normalize_location_names:         "NORMALIZE LOCATIONS",
  link_cwe_to_mitre:                "LINK CWE → ATT&CK",
  merge_implicit_rels:              "MERGE IMPLICIT RELS",
  materialize_countries:            "MATERIALIZE COUNTRIES",
  materialize_cities:               "MATERIALIZE CITIES",
  dedup_locations:                  "DEDUP LOCATIONS",
  materialize_otx_campaigns:        "OTX CAMPAIGNS",
  materialize_asn_nodes:            "ASN INFRASTRUCTURE",
  correlate_otx_tags:               "CORRELATE OTX TAGS",
  correlate_ioc_exhibits_mitre:     "IOC ↔ MITRE EXHIBITS",
  run_autocorrelation:              "AUTOCORRELATION C01–C23",
  correlate_vulnerabilities:        "VULNERABILITY CORRELATIONS",
  correlate_infection_chains:       "INFECTION CHAINS",
  extract_malware_from_indicators:  "EXTRACT MALWARE FAMILIES",
  error:                            "ERROR",
};

// ── Type → accent color (matches PaletteGrid) ────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  indicator:      "#E85419",
  malware:        "#FF0033",
  "threat-actor": "#FF4444",
  "intrusion-set":"#CC0022",
  campaign:       "#FF6600",
  vulnerability:  "#FFAA00",
  "attack-pattern":"#9933FF",
  tool:           "#3366FF",
  infrastructure: "#0099FF",
  location:       "#00CC66",
  identity:       "#00AAAA",
  report:         "#888888",
  Indicator:      "#E85419",
  Malware:        "#FF0033",
  ThreatActor:    "#FF4444",
  IntrusionSet:   "#CC0022",
  Campaign:       "#FF6600",
  Vulnerability:  "#FFAA00",
  Technique:      "#9933FF",
  Tool:           "#3366FF",
  Infrastructure: "#0099FF",
  Location:       "#00CC66",
  Identity:       "#00AAAA",
  Report:         "#888888",
};
const nodeColor = (n: { type?: string; forge?: boolean }) => {
  const c = TYPE_COLOR[n.type ?? ""] ?? "#555";
  return n.forge ? c : c + "88";
};

interface PhaseEvent {
  phase: string;
  status: "start" | "done" | "error" | "data";
  node_count?: number;
  rel_count?: number;
  by_type?: Record<string, number>;
  detail?: string;
}
interface CorrRow    { correlation: string; rel_type: string; count: number }
interface GraphNode  { id: string; name: string; type: string; forge: boolean }
interface GraphLink  { source: string; target: string; rel_type: string; correlation: string }

interface Props { bundle: Record<string, unknown>; onClose: () => void }

export default function InferenceTheater({ bundle, onClose }: Props) {
  const { C } = useForge();
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);

  const [phases,       setPhases]       = useState<PhaseEvent[]>([]);
  const [isDone,       setIsDone]       = useState(false);
  const [hasError,     setHasError]     = useState(false);
  const [bundleId,     setBundleId]     = useState<string | null>(null);
  const [totalNodes,   setTotalNodes]   = useState(0);
  const [totalRels,    setTotalRels]    = useState(0);
  const [correlations, setCorrelations] = useState<CorrRow[]>([]);
  const [graphNodes,   setGraphNodes]   = useState<GraphNode[]>([]);
  const [graphLinks,   setGraphLinks]   = useState<GraphLink[]>([]);
  const [showCorr,     setShowCorr]     = useState(false);
  const [showGraph,    setShowGraph]    = useState(false);
  const graphRef = useRef<HTMLDivElement>(null);

  // 30-second timeout
  useEffect(() => {
    const t = setTimeout(() => {
      if (!isDone) { setHasError(true); setIsDone(true); }
    }, 30_000);
    return () => clearTimeout(t);
  }, [isDone]);

  // Entry animation
  useGSAP(() => {
    if (!panelRef.current) return;
    gsap.fromTo(panelRef.current,
      { opacity: 0, scale: 0.96, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "power2.out" },
    );
  }, { scope: panelRef });

  const animateRow = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    gsap.fromTo(el, { opacity: 0, x: -18 }, { opacity: 1, x: 0, duration: 0.28, ease: "power2.out" });
  }, []);

  const animateCounter = useCallback((el: HTMLSpanElement | null, target: number) => {
    if (!el || target <= 0) return;
    const obj = { n: 0 };
    gsap.to(obj, {
      n: target, duration: 0.8, ease: "power2.out",
      onUpdate() { el.textContent = Math.round(obj.n).toString(); },
    });
  }, []);

  // Animate graph panel open
  useEffect(() => {
    if (showGraph && graphRef.current) {
      gsap.fromTo(graphRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
    }
  }, [showGraph]);

  // ── SSE consumer
  useEffect(() => {
    const token =
      process.env.NEXT_PUBLIC_FORGE_TOKEN ||
      (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("forge-token") : null) || "";

    const ctrl = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/stix/build", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Forge-Token": token },
          body: JSON.stringify({ bundle }),
          signal: ctrl.signal,
        });

        if (!res.ok || !res.body) { setHasError(true); setIsDone(true); return; }

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let currentEvent = "data";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7).trim();
              continue;
            }
            if (!line.startsWith("data: ")) { currentEvent = "data"; continue; }

            try {
              const payload = JSON.parse(line.slice(6));

              if (currentEvent === "done" || payload.phase === "done") {
                setIsDone(true);
                if (panelRef.current) {
                  gsap.to(panelRef.current, {
                    borderColor: C.green, boxShadow: `0 0 30px ${C.green}44`,
                    duration: 0.4, yoyo: true, repeat: 2,
                    onComplete: () => {
                      if (panelRef.current)
                        gsap.set(panelRef.current, { borderColor: `${C.red}44`, boxShadow: "none" });
                    },
                  });
                }
                currentEvent = "data";
                continue;
              }

              if (currentEvent === "correlations") {
                setCorrelations(payload.correlations ?? []);
                currentEvent = "data";
                continue;
              }

              if (currentEvent === "graph") {
                setGraphNodes(payload.nodes ?? []);
                setGraphLinks(payload.links ?? []);
                currentEvent = "data";
                continue;
              }

              // Standard phase event
              const event = payload as PhaseEvent;
              if (event.phase === "start") {
                setBundleId((payload as { bundle_id?: string }).bundle_id ?? null);
                setTotalNodes((payload as { nodes?: number }).nodes ?? 0);
                setTotalRels((payload as { rels?: number }).rels ?? 0);
              }
              if (event.phase === "error") setHasError(true);
              if (event.status === "done" || event.status === "start" || event.phase === "start") {
                setPhases((prev) => {
                  if (prev.find((p) => p.phase === event.phase && p.status === event.status)) return prev;
                  return [...prev, event];
                });
              }
            } catch { /* ignore */ }
            currentEvent = "data";
          }
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") { setHasError(true); setIsDone(true); }
      }
    })();

    return () => ctrl.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => {
    if (!panelRef.current) { onClose(); return; }
    gsap.to(panelRef.current, {
      opacity: 0, scale: 0.96, y: 20, duration: 0.22, ease: "power2.in",
      onComplete: onClose,
    });
  }, [onClose]);

  const donePhases = phases.filter((p) => p.status === "done").length;
  const progress   = isDone ? 100 : Math.round((donePhases / 18) * 100);
  const totalCorr  = correlations.reduce((s, r) => s + r.count, 0);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400,
      background: "rgba(0,0,0,0.88)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: C.mono,
    }}>
      <div ref={panelRef} style={{
        width: 600, maxHeight: "92vh",
        border: `1px solid ${C.red}44`,
        background: "#050505",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}>
        <Brackets />

        {/* Header */}
        <div style={{
          padding: "12px 18px", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.22em", color: C.red, fontWeight: 700 }}>
              ▶ NEO4J INFERENCE ENGINE
            </div>
            {bundleId && (
              <div style={{ fontSize: 7, color: C.muted, opacity: 0.5, marginTop: 2 }}>
                {bundleId.slice(0, 52)}
              </div>
            )}
          </div>
          <div style={{ fontSize: 9, color: totalNodes > 0 ? C.green : C.muted }}>
            {totalNodes}N · {totalRels}R
          </div>
          <button
            onClick={handleClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 4, opacity: isDone ? 1 : 0.45 }}
            aria-label="Close"
            title={isDone ? "Close" : "Cancel"}
          >
            <X size={14} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: C.border, flexShrink: 0 }}>
          <div style={{
            height: "100%",
            background: isDone ? (hasError ? "#FF4444" : C.green) : C.red,
            width: `${progress}%`,
            transition: "width 0.4s ease",
          }} />
        </div>

        {/* Scrollable body */}
        <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: "10px 18px" }}>

          {/* Phase list */}
          {phases.map((p, i) => {
            const label      = PHASE_LABELS[p.phase] ?? p.phase.replace(/_/g, " ").toUpperCase();
            const isDonePhase = p.status === "done";
            const isError     = p.phase === "error" || p.status === "error";
            return (
              <div
                key={`${p.phase}-${p.status}-${i}`}
                ref={(el) => { if (el) animateRow(el); }}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "5px 0",
                  borderBottom: i < phases.length - 1 ? `1px solid ${C.border}22` : "none",
                }}
              >
                <div style={{ width: 14, flexShrink: 0, marginTop: 2 }}>
                  {isError     ? <span style={{ color: "#FF4444", fontSize: 10 }}>✗</span>
                  : isDonePhase ? <span style={{ color: C.green,  fontSize: 10 }}>✓</span>
                  :               <span style={{ color: C.red,    fontSize: 8  }}>▶</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 8, letterSpacing: "0.12em",
                    color: isError ? "#FF4444" : isDonePhase ? C.white : C.muted,
                    opacity: isDonePhase ? 1 : 0.65,
                  }}>
                    {label}
                  </div>
                  {isDonePhase && (p.node_count !== undefined || p.rel_count !== undefined) && (
                    <div style={{ fontSize: 7, color: C.muted, opacity: 0.6, marginTop: 2 }}>
                      {p.node_count !== undefined && (
                        <span>
                          <span ref={(el) => animateCounter(el, p.node_count!)}>{p.node_count}</span> nodes
                        </span>
                      )}
                      {p.rel_count !== undefined && p.rel_count > 0 && (
                        <span> · <span ref={(el) => animateCounter(el, p.rel_count!)}>{p.rel_count}</span> rels</span>
                      )}
                    </div>
                  )}
                  {isDonePhase && p.by_type && Object.keys(p.by_type).length > 0 && (
                    <div style={{ fontSize: 7, color: C.muted, opacity: 0.5, marginTop: 2 }}>
                      {Object.entries(p.by_type).slice(0, 5).map(([t, n]) => `${t}:${n}`).join(" · ")}
                    </div>
                  )}
                  {isError && p.detail && (
                    <div style={{ fontSize: 7, color: "#FF4444", marginTop: 3 }}>{p.detail}</div>
                  )}
                </div>
              </div>
            );
          })}

          {!isDone && phases.length === 0 && (
            <div style={{ fontSize: 8, color: C.muted, opacity: 0.5, padding: "12px 0", letterSpacing: "0.1em" }}>
              CONNECTING TO INFERENCE ENGINE…
            </div>
          )}

          {/* ── Correlation breakdown ── */}
          {isDone && correlations.length > 0 && (
            <div style={{ marginTop: 14, borderTop: `1px solid ${C.border}33`, paddingTop: 10 }}>
              <button
                onClick={() => setShowCorr(!showCorr)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%",
                  background: "none", border: `1px solid ${C.border}44`,
                  color: C.muted, fontFamily: C.mono, fontSize: 8,
                  letterSpacing: "0.14em", padding: "5px 10px", cursor: "pointer",
                }}
                aria-expanded={showCorr}
              >
                {showCorr ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                <span style={{ flex: 1, textAlign: "left" }}>
                  CORRELATIONS CREATED
                </span>
                <span style={{ color: C.green, fontWeight: 700 }}>
                  {totalCorr} EDGES
                </span>
              </button>

              {showCorr && (
                <div style={{ marginTop: 6, fontSize: 7.5, color: C.muted }}>
                  {/* Header row */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 100px 50px",
                    gap: 8, padding: "3px 6px",
                    borderBottom: `1px solid ${C.border}44`,
                    fontSize: 7, letterSpacing: "0.12em", color: C.red, opacity: 0.7,
                  }}>
                    <span>CORRELATION</span>
                    <span>REL TYPE</span>
                    <span style={{ textAlign: "right" }}>COUNT</span>
                  </div>
                  {correlations.map((row, i) => (
                    <div
                      key={i}
                      ref={(el) => { if (el && showCorr) animateRow(el); }}
                      style={{
                        display: "grid", gridTemplateColumns: "1fr 100px 50px",
                        gap: 8, padding: "4px 6px",
                        background: i % 2 === 0 ? C.altRow : "transparent",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ color: C.white, opacity: 0.85, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.correlation}
                      </span>
                      <span style={{ color: C.orange, opacity: 0.8, fontSize: 7 }}>
                        {row.rel_type}
                      </span>
                      <span style={{ textAlign: "right", color: C.green, fontWeight: 700 }}>
                        {row.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Graph preview ── */}
          {isDone && graphNodes.length > 0 && (
            <div style={{ marginTop: 10, borderTop: `1px solid ${C.border}33`, paddingTop: 10 }}>
              <button
                onClick={() => setShowGraph(!showGraph)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%",
                  background: "none", border: `1px solid ${C.border}44`,
                  color: C.muted, fontFamily: C.mono, fontSize: 8,
                  letterSpacing: "0.14em", padding: "5px 10px", cursor: "pointer",
                }}
                aria-expanded={showGraph}
              >
                {showGraph ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                <Share2 size={10} style={{ marginLeft: 2 }} />
                <span style={{ flex: 1, textAlign: "left" }}>
                  GRAPH PREVIEW
                </span>
                <span style={{ color: C.muted, opacity: 0.6 }}>
                  {graphNodes.length}N · {graphLinks.length}R
                </span>
              </button>

              {showGraph && (
                <div ref={graphRef} style={{
                  marginTop: 6, height: 340,
                  border: `1px solid ${C.border}33`,
                  background: "#020202",
                  position: "relative", overflow: "hidden",
                }}>
                  <ForceGraph2D
                    graphData={{ nodes: graphNodes as never[], links: graphLinks as never[] }}
                    width={560}
                    height={340}
                    backgroundColor="#020202"
                    nodeColor={(n) => nodeColor(n as GraphNode)}
                    nodeRelSize={5}
                    nodeLabel={(n) => `${(n as GraphNode).name}\n[${(n as GraphNode).type}]`}
                    linkColor={(l) => {
                      const corr = (l as GraphLink).correlation;
                      if (corr?.includes("CHAIN")) return "#FF880088";
                      if (corr?.includes("MITRE")) return "#9933FF88";
                      if (corr?.includes("CVE"))   return "#FFAA0088";
                      return "#ffffff22";
                    }}
                    linkLabel={(l) => `${(l as GraphLink).rel_type}${(l as GraphLink).correlation ? " · " + (l as GraphLink).correlation : ""}`}
                    linkDirectionalArrowLength={4}
                    linkDirectionalArrowRelPos={1}
                    linkWidth={1.5}
                    nodeCanvasObjectMode={() => "after"}
                    nodeCanvasObject={(node, ctx, globalScale) => {
                      const n   = node as GraphNode & { x?: number; y?: number };
                      const lbl = n.name.slice(0, 18);
                      const fs  = Math.max(8 / globalScale, 3);
                      ctx.font           = `${fs}px monospace`;
                      ctx.textAlign      = "center";
                      ctx.textBaseline   = "top";
                      ctx.fillStyle      = n.forge ? "#ffffff" : "#aaaaaa";
                      ctx.globalAlpha    = 0.85;
                      ctx.fillText(lbl, n.x ?? 0, (n.y ?? 0) + 7);
                      ctx.globalAlpha    = 1;
                      // Forge nodes: bright ring
                      if (n.forge) {
                        ctx.beginPath();
                        ctx.arc(n.x ?? 0, n.y ?? 0, 7, 0, 2 * Math.PI);
                        ctx.strokeStyle = nodeColor(n);
                        ctx.lineWidth   = 1.5 / globalScale;
                        ctx.stroke();
                      }
                    }}
                  />
                  <div style={{
                    position: "absolute", bottom: 6, right: 8,
                    fontSize: 7, color: C.muted, opacity: 0.4, letterSpacing: "0.1em",
                  }}>
                    ● FORGE NODE &nbsp; ○ CORRELATED
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isDone && (
          <div style={{
            padding: "12px 18px", borderTop: `1px solid ${C.border}`,
            display: "flex", flexDirection: "column", gap: 8, flexShrink: 0,
          }}>
            <div style={{ fontSize: 8, color: hasError ? "#FF4444" : C.green, letterSpacing: "0.1em" }}>
              {hasError
                ? "✗ INGESTION COMPLETED WITH ERRORS"
                : `✓ BUNDLE INGESTED — ${donePhases} PHASES · ${totalCorr} CORRELATIONS CREATED`}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {bundleId && !hasError && <OasisVizButton bundleId={bundleId} C={C} />}
              <button
                onClick={handleClose}
                style={{
                  fontSize: 8, letterSpacing: "0.12em", padding: "5px 10px",
                  border: `1px solid ${C.border}`,
                  background: "transparent", color: C.muted,
                  cursor: "pointer", fontFamily: C.mono,
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                <RotateCcw size={10} /> FORGE ANOTHER
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── OASIS Visualizer button ───────────────────────────────────────────────────
function OasisVizButton({ bundleId, C }: { bundleId: string; C: import("@/lib/theme").ColorSet }) {
  const [hint, setHint] = React.useState("");

  const handleClick = async () => {
    const origin = window.location.origin;
    const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");

    if (isLocalhost) {
      try {
        const res  = await fetch(`/api/stix/bundle/${encodeURIComponent(bundleId)}`);
        const json = await res.json();
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
        const burl = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href = burl; a.download = `${bundleId}.json`; a.click();
        URL.revokeObjectURL(burl);
        setHint("JSON downloaded — upload it in STIX Visualizer");
      } catch { setHint("Could not fetch bundle"); }
      window.open("https://oasis-open.github.io/cti-stix-visualization/", "_blank", "noopener,noreferrer");
    } else {
      const bundleUrl = `${origin}/api/stix/bundle/${encodeURIComponent(bundleId)}`;
      window.open(
        `https://oasis-open.github.io/cti-stix-visualization/?url=${encodeURIComponent(bundleUrl)}`,
        "_blank", "noopener,noreferrer",
      );
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <button
        onClick={handleClick}
        style={{
          fontSize: 8, letterSpacing: "0.12em", padding: "5px 12px",
          border: `1px solid ${C.green}`,
          background: `${C.green}18`, color: C.green,
          cursor: "pointer", fontFamily: C.mono, fontWeight: 700,
          display: "flex", alignItems: "center", gap: 5,
        }}
        title="Open in OASIS STIX Visualizer"
        aria-label="Open OASIS STIX Visualizer"
      >
        <ExternalLink size={10} /> STIX VISUALIZER
      </button>
      {hint && (
        <span style={{ fontSize: 7, color: C.green, opacity: 0.7, letterSpacing: "0.08em" }}>{hint}</span>
      )}
    </div>
  );
}
