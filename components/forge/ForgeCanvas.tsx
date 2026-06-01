"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { STIX_TYPES, getRelationships } from "@/lib/stix-forge-types";
import type { CanvasEntity, CanvasRelationship } from "@/lib/stix-forge-types";

export const CARD_W = 164;
export const CARD_H = 72;

const R    = "#E85419";
const MONO = "'JetBrains Mono','Share Tech Mono',monospace";
const MUTED = "rgba(212,212,212,0.45)";

const TYPE_GLYPHS: Record<string, string> = {
  "indicator":     "⊕",
  "malware":       "☣",
  "threat-actor":  "⚠",
  "intrusion-set": "◈",
  "campaign":      "⚑",
  "vulnerability": "◬",
  "attack-pattern":"⚙",
  "tool":          "⚒",
  "infrastructure":"▣",
  "location":      "◉",
  "identity":      "◍",
  "report":        "▤",
  "sighting":      "◎",
  "software":      "‹›",
  "ipv4-addr":     "◆",
  "domain-name":   "◇",
  "url":           "↗",
};

interface RelDropdownState {
  srcUid: string;
  tgtUid: string;
  x: number;
  y: number;
  types: string[];
}

interface DragState {
  uid: string;
  startPX: number;
  startPY: number;
  origX: number;
  origY: number;
}

interface Props {
  entities: CanvasEntity[];
  relationships: CanvasRelationship[];
  onUpdatePosition: (uid: string, x: number, y: number) => void;
  onEdit: (uid: string) => void;
  onDelete: (uid: string) => void;
  onAddRelationship: (r: CanvasRelationship) => void;
}

export default function ForgeCanvas({
  entities, relationships,
  onUpdatePosition, onEdit, onDelete, onAddRelationship,
}: Props) {
  const canvasRef  = useRef<HTMLDivElement>(null);
  const svgRef     = useRef<SVGSVGElement>(null);

  const [dragging,    setDragging]    = useState<DragState | null>(null);
  const [pendingEdge, setPendingEdge] = useState<string | null>(null); // sourceUid
  const [mousePos,    setMousePos]    = useState({ x: 0, y: 0 });
  const [relDrop,     setRelDrop]     = useState<RelDropdownState | null>(null);

  const entityMap = Object.fromEntries(entities.map((e) => [e.uid, e]));

  // ── Cancel connecting mode on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { setPendingEdge(null); setRelDrop(null); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // ── Mouse tracking for ghost edge line
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    if (dragging) {
      const dx = e.clientX - dragging.startPX;
      const dy = e.clientY - dragging.startPY;
      onUpdatePosition(dragging.uid, Math.max(0, dragging.origX + dx), Math.max(0, dragging.origY + dy));
    }
  }, [dragging, onUpdatePosition]);

  const handlePointerUp = useCallback(() => setDragging(null), []);

  // ── SVG edge path
  function edgePath(src: CanvasEntity, tgt: CanvasEntity): string {
    const x1 = src.x + CARD_W;
    const y1 = src.y + CARD_H / 2;
    const x2 = tgt.x;
    const y2 = tgt.y + CARD_H / 2;
    const cp = Math.abs(x2 - x1) * 0.4 + 24;
    return `M ${x1} ${y1} C ${x1 + cp} ${y1}, ${x2 - cp} ${y2}, ${x2} ${y2}`;
  }

  // ── Complete edge: called when user clicks a target entity while in connecting mode
  const completeEdge = useCallback((tgtUid: string, clickX: number, clickY: number) => {
    if (!pendingEdge || pendingEdge === tgtUid) { setPendingEdge(null); return; }
    const srcType = entityMap[pendingEdge]?.type ?? "";
    const tgtType = entityMap[tgtUid]?.type ?? "";
    const types   = getRelationships(srcType, tgtType);
    setRelDrop({ srcUid: pendingEdge, tgtUid, x: clickX, y: clickY, types });
    setPendingEdge(null);
  }, [pendingEdge, entityMap]);

  const confirmRelationship = useCallback((relType: string) => {
    if (!relDrop) return;
    onAddRelationship({
      uid:              crypto.randomUUID(),
      sourceUid:        relDrop.srcUid,
      targetUid:        relDrop.tgtUid,
      relationshipType: relType,
    });
    setRelDrop(null);
  }, [relDrop, onAddRelationship]);

  const srcEntity = pendingEdge ? entityMap[pendingEdge] : null;

  return (
    <div
      ref={canvasRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={() => { if (pendingEdge) setPendingEdge(null); if (relDrop) setRelDrop(null); }}
      style={{
        width: "100%", height: "100%", position: "relative", overflow: "hidden",
        cursor: pendingEdge ? "crosshair" : "default",
        background: "radial-gradient(ellipse at 30% 40%, rgba(232,84,25,0.04) 0%, transparent 60%)",
      }}
    >
      {/* Dot grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.03,
        backgroundImage: `radial-gradient(circle, ${R} 1px, transparent 1px)`,
        backgroundSize: "32px 32px",
      }} />

      {/* Empty state */}
      {entities.length === 0 && !pendingEdge && (
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center", pointerEvents: "none",
        }}>
          <div style={{
            border: "1px dashed rgba(255,255,255,0.1)", padding: "24px 48px",
            textAlign: "center", fontFamily: MONO,
          }}>
            <div style={{ fontSize: 9, letterSpacing: "0.22em", color: MUTED }}>
              ← CLICK ENTITY TYPE TO ADD
            </div>
            <div style={{ fontSize: 7, letterSpacing: "0.15em", color: "rgba(212,212,212,0.25)", marginTop: 5 }}>
              THEN CLICK LINK TO CONNECT
            </div>
          </div>
        </div>
      )}

      {/* Connecting mode hint */}
      {pendingEdge && (
        <div style={{
          position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
          background: `${R}22`, border: `1px solid ${R}55`,
          padding: "5px 16px", fontFamily: MONO, fontSize: 8,
          letterSpacing: "0.2em", color: R, pointerEvents: "none", zIndex: 10,
        }}>
          CLICK TARGET ENTITY TO CONNECT · ESC TO CANCEL
        </div>
      )}

      {/* SVG overlay for relationships + ghost line */}
      <svg ref={svgRef} style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        pointerEvents: "none", overflow: "visible",
      }}>
        <defs>
          <marker id="fg-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill={R} fillOpacity="0.75" />
          </marker>
        </defs>

        {relationships.map((r) => {
          const src = entityMap[r.sourceUid];
          const tgt = entityMap[r.targetUid];
          if (!src || !tgt) return null;
          const d = edgePath(src, tgt);
          const pid = `rp-${r.uid}`;
          return (
            <g key={r.uid}>
              <path d={d} fill="none" stroke={R} strokeWidth={1.5} strokeOpacity={0.6} markerEnd="url(#fg-arr)" />
              <path id={pid} d={d} fill="none" />
              <text style={{ fontSize: 7, fontFamily: MONO, fill: MUTED, fillOpacity: 0.7 }}>
                <textPath href={`#${pid}`} startOffset="50%" textAnchor="middle">
                  {r.relationshipType}
                </textPath>
              </text>
            </g>
          );
        })}

        {/* Ghost line while in connecting mode */}
        {srcEntity && (
          <line
            x1={srcEntity.x + CARD_W}
            y1={srcEntity.y + CARD_H / 2}
            x2={mousePos.x}
            y2={mousePos.y}
            stroke={R} strokeWidth={1.5} strokeDasharray="5 3" strokeOpacity={0.55}
          />
        )}
      </svg>

      {/* Entity cards */}
      {entities.map((entity) => {
        const typeEntry  = STIX_TYPES.find((t) => t.id === entity.type);
        const color      = typeEntry?.color ?? R;
        const glyph      = TYPE_GLYPHS[entity.type] ?? "◈";
        const isTarget   = !!pendingEdge && pendingEdge !== entity.uid;
        const isSrc      = pendingEdge === entity.uid;

        return (
          <div
            key={entity.uid}
            style={{
              position: "absolute",
              left: entity.x,
              top: entity.y,
              width: CARD_W,
              height: CARD_H,
              background: isSrc ? `${color}18` : "#090909",
              border: `1px solid ${isTarget ? color + "88" : isSrc ? color + "88" : "rgba(255,255,255,0.07)"}`,
              cursor: pendingEdge ? (isTarget ? "pointer" : "default") : "grab",
              userSelect: "none",
              fontFamily: MONO,
              boxShadow: isTarget ? `0 0 16px ${color}33` : "none",
              transition: "box-shadow 150ms, border-color 150ms",
              zIndex: isSrc ? 2 : 1,
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (pendingEdge) {
                if (isTarget) {
                  const rect = canvasRef.current!.getBoundingClientRect();
                  completeEdge(entity.uid, e.clientX - rect.left, e.clientY - rect.top);
                }
                return;
              }
              // start drag
              setDragging({
                uid: entity.uid,
                startPX: e.clientX,
                startPY: e.clientY,
                origX: entity.x,
                origY: entity.y,
              });
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (!pendingEdge) onEdit(entity.uid);
            }}
          >
            {/* Top color bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color }} />

            {/* Bracket corners */}
            {([
              { top: -1,  left:  -1, borderTop:    `1px solid ${color}`, borderLeft:  `1px solid ${color}` },
              { top: -1,  right: -1, borderTop:    `1px solid ${color}`, borderRight: `1px solid ${color}` },
              { bottom:-1,left:  -1, borderBottom: `1px solid ${color}`, borderLeft:  `1px solid ${color}` },
              { bottom:-1,right: -1, borderBottom: `1px solid ${color}`, borderRight: `1px solid ${color}` },
            ] as React.CSSProperties[]).map((style, i) => (
              <div key={i} style={{ position: "absolute", width: 7, height: 7, ...style }} />
            ))}

            {/* Card body */}
            <div style={{ padding: "8px 10px 4px", display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 11, color, lineHeight: 1 }}>{glyph}</span>
                <span style={{ fontSize: 7, letterSpacing: "0.14em", color, fontWeight: 700, lineHeight: 1 }}>
                  {entity.label.toUpperCase()}
                </span>
              </div>
              <div style={{
                fontSize: 9, letterSpacing: "0.05em",
                color: entity.name ? "#D4D4D4" : "rgba(212,212,212,0.28)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {entity.name ?? "— unnamed —"}
              </div>
            </div>

            {/* Bottom action strip */}
            <div style={{
              position: "absolute", bottom: 0, right: 0,
              display: "flex", gap: 0,
            }}>
              {[
                { label: "EDIT", color: "rgba(212,212,212,0.35)", action: () => onEdit(entity.uid) },
                { label: "LINK", color: `${color}99`,             action: () => setPendingEdge(entity.uid) },
                { label: "DEL",  color: "rgba(255,50,50,0.4)",    action: () => onDelete(entity.uid) },
              ].map(({ label, color: c, action }) => (
                <button
                  key={label}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); action(); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: c, fontSize: 7, padding: "3px 7px",
                    fontFamily: MONO, letterSpacing: "0.12em",
                    lineHeight: 1,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Relationship type picker */}
      {relDrop && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            left: Math.min(relDrop.x, (canvasRef.current?.clientWidth ?? 800) - 180),
            top: Math.min(relDrop.y, (canvasRef.current?.clientHeight ?? 600) - 200),
            zIndex: 50,
            background: "#0a0a0a",
            border: `1px solid ${R}55`,
            minWidth: 168,
            fontFamily: MONO,
          }}
        >
          <div style={{
            padding: "6px 10px", fontSize: 7, letterSpacing: "0.2em",
            color: R, borderBottom: `1px solid ${R}33`, background: `${R}0a`,
          }}>
            ▶ SELECT RELATIONSHIP TYPE
          </div>
          {relDrop.types.map((t) => (
            <div
              key={t}
              onClick={() => confirmRelationship(t)}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${R}15`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              style={{
                padding: "7px 12px", fontSize: 9, color: "#D4D4D4",
                letterSpacing: "0.08em", cursor: "pointer",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              {t}
            </div>
          ))}
          <div
            onClick={() => setRelDrop(null)}
            style={{
              padding: "6px 12px", fontSize: 7, color: "rgba(212,212,212,0.35)",
              letterSpacing: "0.14em", cursor: "pointer", textAlign: "center",
            }}
          >
            CANCEL
          </div>
        </div>
      )}
    </div>
  );
}
