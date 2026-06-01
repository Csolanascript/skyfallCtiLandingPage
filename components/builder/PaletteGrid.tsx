"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Target, Bug, UserCog, Shield, Flag, AlertTriangle, Layers, Wrench,
  Server, MapPin, Users, FileText, Eye, Code, Award, Wifi, Globe, Link,
  LucideIcon,
} from "lucide-react";
import { STIX_TYPES } from "@/lib/stix-types";
import { useForge } from "./ForgeLayout";
import type { CanvasEntity } from "@/lib/stix-types";

const ICON_MAP: Record<string, LucideIcon> = {
  Target, Bug, UserCog, Shield, Flag, AlertTriangle, Layers, Wrench,
  Server, MapPin, Users, FileText, Eye, Code, Award, Wifi,
  Globe2: Globe, LinkIcon: Link,
};

export default function PaletteGrid() {
  const { C, addEntity } = useForge();
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!gridRef.current) return;
    const items = gridRef.current.querySelectorAll<HTMLElement>("[data-palette-item]");
    gsap.fromTo(
      items,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: "power2.out" },
    );
  }, { scope: gridRef });

  const handleDragStart = (e: React.DragEvent, typeId: string) => {
    e.dataTransfer.setData("stix-type", typeId);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleClick = (typeId: string) => {
    const entry = STIX_TYPES.find((t) => t.id === typeId);
    if (!entry) return;
    const uid = crypto.randomUUID();
    const entity: CanvasEntity = {
      uid,
      type:  entry.id,
      label: entry.label,
      data:  {},
      x:     80 + Math.random() * 200,
      y:     80 + Math.random() * 200,
    };
    addEntity(entity);
  };

  const handleHover = (el: HTMLElement, enter: boolean, color: string) => {
    gsap.to(el, {
      boxShadow: enter ? `0 0 18px ${color}88, 0 0 6px ${color}44` : "none",
      duration: 0.2,
    });
  };

  return (
    <div ref={gridRef}>
      <div style={{
        fontSize: 8, fontWeight: 700, letterSpacing: "0.22em",
        color: C.red, marginBottom: 10, paddingLeft: 4,
      }}>
        ▶ ENTITY TYPES
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {STIX_TYPES.map((t) => {
          const Icon = ICON_MAP[t.icon] ?? Target;
          return (
            <div
              key={t.id}
              data-palette-item
              draggable
              onDragStart={(e) => handleDragStart(e, t.id)}
              onClick={() => handleClick(t.id)}
              onMouseEnter={(e) => handleHover(e.currentTarget as HTMLElement, true, t.color)}
              onMouseLeave={(e) => handleHover(e.currentTarget as HTMLElement, false, t.color)}
              style={{
                position: "relative",
                border: `1px solid ${C.border}`,
                background: C.surface,
                padding: "10px 6px",
                cursor: "grab",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                userSelect: "none",
              }}
              role="button"
              tabIndex={0}
              aria-label={`Add ${t.label}`}
              onKeyDown={(e) => e.key === "Enter" && handleClick(t.id)}
            >
              {/* Bracket corner */}
              <div style={{ position: "absolute", top: -1, left: -1, width: 6, height: 6, borderTop: `1px solid ${t.color}`, borderLeft: `1px solid ${t.color}` }} />
              <div style={{ position: "absolute", top: -1, right: -1, width: 6, height: 6, borderTop: `1px solid ${t.color}`, borderRight: `1px solid ${t.color}` }} />
              <div style={{ position: "absolute", bottom: -1, left: -1, width: 6, height: 6, borderBottom: `1px solid ${t.color}`, borderLeft: `1px solid ${t.color}` }} />
              <div style={{ position: "absolute", bottom: -1, right: -1, width: 6, height: 6, borderBottom: `1px solid ${t.color}`, borderRight: `1px solid ${t.color}` }} />

              <Icon size={28} color={t.color} strokeWidth={1.5} />
              <span style={{
                fontSize: 7, fontWeight: 700, letterSpacing: "0.14em",
                color: C.muted, textAlign: "center", lineHeight: 1.2,
              }}>
                {t.label.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{
        marginTop: 12, fontSize: 7, color: C.muted, opacity: 0.5,
        textAlign: "center", letterSpacing: "0.1em",
      }}>
        CLICK OR DRAG TO CANVAS
      </div>
    </div>
  );
}
