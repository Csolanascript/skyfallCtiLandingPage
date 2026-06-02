"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import gsap from "gsap";
import { STIX_TYPES, getRelationships } from "@/lib/stix-types";
import type { CanvasEntity, CanvasRelationship } from "@/lib/stix-types";
import { useForge } from "./ForgeLayout";
import EntityCard from "./EntityCard";
import RelationshipDropdown from "./RelationshipDropdown";
import RadialNodeMenu, { getRadialItems, type RadialItem } from "./RadialNodeMenu";
import { CARD_W, CARD_H } from "./card-size";

interface PendingEdge {
  sourceUid: string;
  screenX: number;
  screenY: number;
}

export default function BundleCanvas() {
  const { C, entities, relationships, addEntity, addRelationship, updateEntity, openContext } = useForge();
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef    = useRef<SVGSVGElement>(null);

  const [pendingEdge,   setPendingEdge]   = useState<PendingEdge | null>(null);
  const [mousePos,      setMousePos]      = useState({ x: 0, y: 0 });
  const [relDropdown,   setRelDropdown]   = useState<{
    srcUid: string; tgtUid: string; x: number; y: number;
  } | null>(null);
  const [radialMenu,    setRadialMenu]    = useState<{
    srcUid: string; srcType: string; x: number; y: number;
  } | null>(null);
  // Stable ref so the mouseup closure can always read latest pendingEdge
  const pendingEdgeRef = useRef<PendingEdge | null>(null);

  // ── Drag over / drop from palette
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const typeId = e.dataTransfer.getData("stix-type");
    if (!typeId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 70;
    const y = e.clientY - rect.top  - 30;
    const entry = STIX_TYPES.find((t) => t.id === typeId);
    if (!entry) return;
    const uid = crypto.randomUUID();
    addEntity({ uid, type: entry.id, label: entry.label, data: {}, x, y });
  }, [addEntity]);

  // ── Mouse move (for pending edge ghost line)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  // Keep ref in sync with state so global mouseup closure always has latest value
  useEffect(() => { pendingEdgeRef.current = pendingEdge; }, [pendingEdge]);

  // Cancel pending edge on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setPendingEdge(null); pendingEdgeRef.current = null; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Start edge on drag (mousedown on handle)
  const handleStartEdge = useCallback((uid: string, handlePos: { x: number; y: number }) => {
    const edge = { sourceUid: uid, screenX: handlePos.x, screenY: handlePos.y };
    setPendingEdge(edge);
    pendingEdgeRef.current = edge;
  }, []);

  // ── Global mouseup: complete edge by drag-and-drop
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const edge = pendingEdgeRef.current;
      if (!edge) return;

      // Walk DOM upward from element under cursor to find a card
      let el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      let targetUid: string | null = null;
      while (el) {
        if (el.dataset?.entityUid) { targetUid = el.dataset.entityUid; break; }
        el = el.parentElement;
      }

      if (targetUid && targetUid !== edge.sourceUid) {
        // Dropped onto a different entity → open relationship picker
        const tgt = entities.find((en) => en.uid === targetUid);
        if (tgt) {
          setRelDropdown({
            srcUid: edge.sourceUid,
            tgtUid: targetUid,
            x: tgt.x + CARD_W / 2,
            y: tgt.y,
          });
        }
      } else if (!targetUid && canvasRef.current) {
        // Dropped onto empty canvas space → open radial creation wheel
        const rect = canvasRef.current.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        if (cx >= 0 && cy >= 0 && cx <= rect.width && cy <= rect.height) {
          const src = entities.find((en) => en.uid === edge.sourceUid);
          if (src) {
            const items = getRadialItems(src.type);
            if (items.length > 0) {
              setRadialMenu({ srcUid: edge.sourceUid, srcType: src.type, x: cx, y: cy });
            }
          }
        }
      }

      setPendingEdge(null);
      pendingEdgeRef.current = null;
    };

    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [entities]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Card click: only used for non-edge interactions now
  const handleCardClick = useCallback((_uid: string, _cardPos: { x: number; y: number }) => {
    // Edge completion is handled by global mouseup; nothing extra needed here
  }, []);

  const handleRelationshipConfirm = useCallback((
    srcUid: string, tgtUid: string, relType: string,
    description?: string, confidence?: number,
  ) => {
    const rel: CanvasRelationship = {
      uid: crypto.randomUUID(),
      sourceUid: srcUid,
      targetUid: tgtUid,
      relationshipType: relType,
      description,
      confidence,
    };
    addRelationship(rel);

    // Animate the new SVG path
    if (svgRef.current) {
      const paths = svgRef.current.querySelectorAll<SVGPathElement>(`[data-rel="${rel.uid}"]`);
      paths.forEach((path) => {
        const len = path.getTotalLength ? path.getTotalLength() : 200;
        gsap.fromTo(path,
          { strokeDasharray: len, strokeDashoffset: len },
          { strokeDashoffset: 0, duration: 0.6, ease: "power2.out" },
        );
      });
    }
    setRelDropdown(null);
  }, [addRelationship]);

  // ── Calculate card centers for SVG edges
  const entityById: Record<string, CanvasEntity> = {};
  for (const e of entities) entityById[e.uid] = e;

  // CARD_W / CARD_H imported from card-size.ts

  function edgePath(src: CanvasEntity, tgt: CanvasEntity) {
    const x1 = src.x + CARD_W;
    const y1 = src.y + CARD_H / 2;
    const x2 = tgt.x;
    const y2 = tgt.y + CARD_H / 2;
    const cp = Math.abs(x2 - x1) * 0.4;
    return `M ${x1} ${y1} C ${x1 + cp} ${y1}, ${x2 - cp} ${y2}, ${x2} ${y2}`;
  }

  // ── Radial: user selected an entity type from the wheel
  const handleRadialSelect = useCallback((item: RadialItem) => {
    if (!radialMenu) return;
    const srcEntity = entities.find((e) => e.uid === radialMenu.srcUid);
    if (!srcEntity) { setRadialMenu(null); return; }

    const entry = STIX_TYPES.find((t) => t.id === item.typeId);
    if (!entry) { setRadialMenu(null); return; }

    const newUid = crypto.randomUUID();
    addEntity({
      uid:   newUid,
      type:  entry.id,
      label: entry.label,
      data:  {},
      x:     radialMenu.x - CARD_W / 2,
      y:     radialMenu.y - CARD_H / 2,
    });

    addRelationship({
      uid:              crypto.randomUUID(),
      sourceUid:        radialMenu.srcUid,
      targetUid:        newUid,
      relationshipType: item.relType,
    });

    setRadialMenu(null);
  }, [radialMenu, entities, addEntity, addRelationship]);

  return (
    <div
      ref={canvasRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseMove={handleMouseMove}
      onClick={(e) => {
        if (radialMenu) return; // radial handles its own backdrop
        // Edge completion is handled by global mouseup drag handler
        void e;
      }}
      style={{
        width: "100%", height: "100%", position: "relative", overflow: "hidden",
        background: `radial-gradient(ellipse at 30% 40%, rgba(232,84,25,0.04) 0%, transparent 60%)`,
        cursor: pendingEdge ? "crosshair" : "default",
      }}
    >
      {/* Grid dots */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.04,
        backgroundImage: `radial-gradient(circle, ${C.red} 1px, transparent 1px)`,
        backgroundSize: "32px 32px",
      }} />

      {/* Empty state hint */}
      {entities.length === 0 && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", pointerEvents: "none",
        }}>
          <div style={{
            border: `1px dashed ${C.border}`, padding: "24px 40px",
            textAlign: "center", opacity: 0.4,
          }}>
            <div style={{ fontSize: 12, letterSpacing: "0.2em", color: C.muted }}>
              DRAG ENTITIES FROM THE PALETTE
            </div>
            <div style={{ fontSize: 10, letterSpacing: "0.15em", color: C.muted, marginTop: 8 }}>
              OR CLICK TO PLACE
            </div>
          </div>
        </div>
      )}

      {/* SVG relationship arrows */}
      <svg
        ref={svgRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      >
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill={C.red} fillOpacity="0.8" />
          </marker>
        </defs>

        {relationships.map((r) => {
          const src = entityById[r.sourceUid];
          const tgt = entityById[r.targetUid];
          if (!src || !tgt) return null;
          const d = edgePath(src, tgt);
          return (
            <g key={r.uid}>
              <path
                data-rel={r.uid}
                d={d}
                fill="none"
                stroke={C.red}
                strokeWidth={1.5}
                strokeOpacity={0.7}
                markerEnd="url(#arrowhead)"
              />
              {/* Relationship label */}
              <text
                style={{ fontSize: 9, fontFamily: C.mono, fill: C.muted, fillOpacity: 0.7 }}
                dy={-4}
              >
                <textPath href={`#rpath-${r.uid}`} startOffset="50%" textAnchor="middle">
                  {r.relationshipType}
                </textPath>
              </text>
              <path id={`rpath-${r.uid}`} d={d} fill="none" />
            </g>
          );
        })}

        {/* Ghost line while drawing an edge */}
        {pendingEdge && (() => {
          const src = entityById[pendingEdge.sourceUid];
          if (!src) return null;
          const x1 = src.x + CARD_W;
          const y1 = src.y + CARD_H / 2;
          return (
            <line
              x1={x1} y1={y1} x2={mousePos.x} y2={mousePos.y}
              stroke={C.red} strokeWidth={1} strokeDasharray="4 3" strokeOpacity={0.5}
            />
          );
        })()}
      </svg>

      {/* Entity cards */}
      {entities.map((entity) => (
        <EntityCard
          key={entity.uid}
          entity={entity}
          onStartEdge={handleStartEdge}
          onCardClick={handleCardClick}
          onContextClick={(uid) => openContext(uid)}
          isPendingTarget={!!pendingEdge && pendingEdge.sourceUid !== entity.uid}
          onPositionChange={(uid, x, y) => updateEntity(uid, { x, y })}
        />
      ))}

      {/* Relationship type dropdown (connecting to existing entity) */}
      {relDropdown && (() => {
        const src = entityById[relDropdown.srcUid];
        const tgt = entityById[relDropdown.tgtUid];
        if (!src || !tgt) return null;
        const rels = getRelationships(src.type, tgt.type);
        return (
          <RelationshipDropdown
            srcUid={relDropdown.srcUid}
            tgtUid={relDropdown.tgtUid}
            relationships={rels}
            x={relDropdown.x}
            y={relDropdown.y}
            onConfirm={handleRelationshipConfirm}
            onCancel={() => setRelDropdown(null)}
          />
        );
      })()}

      {/* Radial node creation wheel (empty-space drop) */}
      {radialMenu && (
        <RadialNodeMenu
          srcType={radialMenu.srcType}
          x={radialMenu.x}
          y={radialMenu.y}
          C={C}
          onSelect={handleRadialSelect}
          onCancel={() => setRadialMenu(null)}
        />
      )}
    </div>
  );
}
