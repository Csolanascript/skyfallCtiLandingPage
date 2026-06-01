"use client";

import React, { useRef, useCallback, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { X, Pencil, MoveRight, Network } from "lucide-react";
import {
  Target, Bug, UserCog, Shield, Flag, AlertTriangle, Layers, Wrench,
  Server, MapPin, Users, FileText, Eye, Code, Award, Wifi, Globe, Link,
  LucideIcon,
} from "lucide-react";
import { STIX_TYPES } from "@/lib/stix-types";
import type { CanvasEntity } from "@/lib/stix-types";
import { useForge } from "./ForgeLayout";
import { CARD_W, CARD_H } from "./card-size";

const ICON_MAP: Record<string, LucideIcon> = {
  Target, Bug, UserCog, Shield, Flag, AlertTriangle, Layers, Wrench,
  Server, MapPin, Users, FileText, Eye, Code, Award, Wifi,
  Globe2: Globe, LinkIcon: Link,
};

interface Props {
  entity: CanvasEntity;
  onStartEdge: (uid: string, pos: { x: number; y: number }) => void;
  onCardClick: (uid: string, pos: { x: number; y: number }) => void;
  onContextClick: (uid: string) => void;
  isPendingTarget: boolean;
  onPositionChange: (uid: string, x: number, y: number) => void;
}

export default function EntityCard({
  entity, onStartEdge, onCardClick, onContextClick, isPendingTarget, onPositionChange,
}: Props) {
  const { C, removeEntity, openEditor } = useForge();
  const cardRef  = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const didDrag  = useRef(false);
  const offset   = useRef({ x: 0, y: 0 });

  const typeEntry   = STIX_TYPES.find((t) => t.id === entity.type);
  const color       = typeEntry?.color ?? C.red;
  const IconComp    = ICON_MAP[typeEntry?.icon ?? "Target"] ?? Target;
  const displayName =
    (entity.data.name  as string | undefined) ||
    (entity.data.value as string | undefined) ||
    entity.label;

  // Extra info line (T-ID for techniques, country_code for locations, value for IoCs)
  const subLine = (() => {
    const d = entity.data;
    if (d.external_id) return String(d.external_id);
    if (d.x_mitre_id)  return String(d.x_mitre_id);
    if (d.country_code) return String(d.country_code);
    if (d.value && d.value !== displayName) return String(d.value).slice(0, 28);
    return null;
  })();

  // Entry animation
  useGSAP(() => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current,
      { opacity: 0, scale: 0.85 },
      { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(1.5)" },
    );
  }, { scope: cardRef });

  // Drag logic
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    e.stopPropagation();
    dragging.current = true;
    didDrag.current  = false;
    offset.current = { x: e.clientX - entity.x, y: e.clientY - entity.y };
  }, [entity.x, entity.y]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !cardRef.current) return;
      didDrag.current = true;
      const x = e.clientX - offset.current.x;
      const y = e.clientY - offset.current.y;
      gsap.set(cardRef.current, { x, y });
      onPositionChange(entity.uid, x, y);
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [entity.uid, onPositionChange]);

  const handleCardClick = useCallback(() => {
    if (didDrag.current) return; // ignore click after drag
    onCardClick(entity.uid, { x: entity.x + CARD_W / 2, y: entity.y + CARD_H / 2 });
  }, [entity, onCardClick]);

  const handleStartEdge = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cardRef.current) return;
    onStartEdge(entity.uid, { x: entity.x + CARD_W, y: entity.y + CARD_H / 2 });
    gsap.to(cardRef.current, { boxShadow: `0 0 18px ${color}88`, duration: 0.2 });
    setTimeout(() => {
      if (cardRef.current) gsap.to(cardRef.current, { boxShadow: "none", duration: 0.3 });
    }, 1000);
  }, [entity, color, onStartEdge]);

  const pendingStyle: React.CSSProperties = isPendingTarget ? {
    boxShadow: `0 0 12px ${color}cc, 0 0 4px ${color}`,
    borderColor: color,
  } : {};

  return (
    <div
      ref={cardRef}
      onMouseDown={handleMouseDown}
      onClick={handleCardClick}
      style={{
        position: "absolute",
        transform: `translate(${entity.x}px, ${entity.y}px)`,
        width: CARD_W,
        height: CARD_H,
        border: `1px solid ${color}66`,
        background: `${color}12`,
        cursor: isPendingTarget ? "crosshair" : "grab",
        userSelect: "none",
        ...pendingStyle,
      }}
      aria-label={`Entity: ${displayName}`}
    >
      {/* Bracket corners */}
      <div style={{ position: "absolute", top: -1, left: -1, width: 7, height: 7, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
      <div style={{ position: "absolute", top: -1, right: -1, width: 7, height: 7, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
      <div style={{ position: "absolute", bottom: -1, left: -1, width: 7, height: 7, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
      <div style={{ position: "absolute", bottom: -1, right: -1, width: 7, height: 7, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />

      {/* Content */}
      <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", boxSizing: "border-box" }}>
        {/* Top row: icon + type label + action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <IconComp size={18} color={color} strokeWidth={1.5} />
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", color, flex: 1 }}>
            {entity.label.toUpperCase()}
          </span>
          {/* Context (relations) */}
          <button
            data-no-drag
            onClick={(e) => { e.stopPropagation(); onContextClick(entity.uid); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: C.muted, opacity: 0.6, lineHeight: 1 }}
            aria-label="View Neo4j relations"
            title="Neo4j relations"
          >
            <Network size={11} />
          </button>
          {/* Edit */}
          <button
            data-no-drag
            onClick={(e) => { e.stopPropagation(); openEditor(entity.uid); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: C.muted, opacity: 0.6, lineHeight: 1 }}
            aria-label="Edit entity"
          >
            <Pencil size={11} />
          </button>
          {/* Delete */}
          <button
            data-no-drag
            onClick={(e) => { e.stopPropagation(); removeEntity(entity.uid); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#FF4444", opacity: 0.6, lineHeight: 1 }}
            aria-label="Remove entity"
          >
            <X size={11} />
          </button>
        </div>

        {/* Name line */}
        <div style={{ fontSize: 10, color: C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: CARD_W - 20, fontWeight: 500 }}>
          {displayName}
        </div>

        {/* Sub-line: T-ID / country / value */}
        {subLine && (
          <div style={{ fontSize: 8, color, opacity: 0.8, letterSpacing: "0.1em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {subLine}
          </div>
        )}
      </div>

      {/* Edge handle */}
      <button
        data-no-drag
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleStartEdge}
        style={{
          position: "absolute", right: -10, top: "50%", transform: "translateY(-50%)",
          width: 20, height: 20, borderRadius: "50%",
          background: C.bg, border: `2px solid ${color}`,
          cursor: "crosshair",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
        }}
        aria-label="Connect to another entity"
        title="Drag to connect"
      >
        <MoveRight size={9} color={color} />
      </button>
    </div>
  );
}
