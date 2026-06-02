"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import {
  Target, Bug, UserCog, Shield, Flag, AlertTriangle, Layers, Wrench,
  Server, MapPin, Users, FileText, Eye, Code, Award, Wifi, Globe, Link,
  LucideIcon,
} from "lucide-react";
import { STIX_TYPES, SRO_MATRIX } from "@/lib/stix-types";
import type { ColorSet } from "@/lib/theme";

const ICON_MAP: Record<string, LucideIcon> = {
  Target, Bug, UserCog, Shield, Flag, AlertTriangle, Layers, Wrench,
  Server, MapPin, Users, FileText, Eye, Code, Award, Wifi,
  Globe2: Globe, LinkIcon: Link,
};

export interface RadialItem {
  typeId:   string;
  label:    string;
  icon:     string;
  color:    string;
  relType:  string;  // primary relationship from src→this type
}

interface Props {
  srcType: string;
  x:       number;   // canvas coordinates
  y:       number;
  C:       ColorSet;
  onSelect: (item: RadialItem) => void;
  onCancel: () => void;
}

const RADIUS   = 158;   // px from center to item
const ITEM_SIZE = 84;   // px width/height of each item

/** Returns RadialItem list for a given source STIX type */
export function getRadialItems(srcType: string): RadialItem[] {
  const srcMap = SRO_MATRIX[srcType] ?? {};

  // Collect specific target types with their primary rel
  const items: RadialItem[] = [];
  const added = new Set<string>();

  // Specific pairs first
  for (const [tgtType, rels] of Object.entries(srcMap)) {
    if (tgtType === "*") continue;
    const entry = STIX_TYPES.find((t) => t.id === tgtType);
    if (!entry) continue;
    if (added.has(tgtType)) continue;
    added.add(tgtType);
    items.push({
      typeId:  tgtType,
      label:   entry.label,
      icon:    entry.icon,
      color:   entry.color,
      relType: rels[0] ?? "related-to",
    });
  }

  // Fallback: if very few specific targets, add common ones with related-to
  const fallback = ["malware", "indicator", "threat-actor", "vulnerability", "location", "identity"];
  for (const tgt of fallback) {
    if (added.has(tgt) || added.size >= 10) continue;
    const entry = STIX_TYPES.find((t) => t.id === tgt);
    if (!entry) continue;
    added.add(tgt);
    items.push({ typeId: tgt, label: entry.label, icon: entry.icon, color: entry.color, relType: "related-to" });
  }

  return items.slice(0, 10);
}

export default function RadialNodeMenu({ srcType, x, y, C, onSelect, onCancel }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const items      = getRadialItems(srcType);
  const n          = items.length;
  const itemRefs   = useRef<(HTMLButtonElement | null)[]>([]);

  // Entry animation: items scale in from center with stagger
  useEffect(() => {
    const els = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
    gsap.fromTo(els,
      { opacity: 0, scale: 0.2 },
      { opacity: 1, scale: 1, duration: 0.28, stagger: 0.04, ease: "back.out(1.6)" },
    );
    // Fade-in backdrop
    if (overlayRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.18 });
    }
  }, []);

  const close = () => {
    const els = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
    gsap.to(els, { opacity: 0, scale: 0.2, duration: 0.18, stagger: 0.02, ease: "power2.in",
      onComplete: onCancel });
  };

  const handleSelect = (item: RadialItem, idx: number) => {
    const el = itemRefs.current[idx];
    if (el) {
      gsap.to(el, { scale: 1.3, opacity: 0, duration: 0.2, ease: "power2.in",
        onComplete: () => onSelect(item) });
    } else {
      onSelect(item);
    }
    // Fade others
    itemRefs.current.forEach((e, i) => {
      if (e && i !== idx) gsap.to(e, { opacity: 0, scale: 0.1, duration: 0.15 });
    });
  };

  return (
    <>
      {/* Transparent backdrop to catch outside clicks */}
      <div
        ref={overlayRef}
        onClick={close}
        style={{ position: "absolute", inset: 0, zIndex: 60 }}
      />

      {/* Center dot */}
      <div style={{
        position: "absolute",
        left: x - 8, top: y - 8,
        width: 16, height: 16,
        borderRadius: "50%",
        background: C.red,
        boxShadow: `0 0 12px ${C.red}`,
        zIndex: 62, pointerEvents: "none",
      }} />

      {/* Items */}
      {items.map((item, idx) => {
        // Distribute items in a full circle, starting from top
        const angle  = (idx / n) * 2 * Math.PI - Math.PI / 2;
        const ix     = x + RADIUS * Math.cos(angle) - ITEM_SIZE / 2;
        const iy     = y + RADIUS * Math.sin(angle) - ITEM_SIZE / 2;
        const Icon   = ICON_MAP[item.icon] ?? Target;

        return (
          <button
            key={item.typeId}
            ref={el => { itemRefs.current[idx] = el; }}
            onClick={(e) => { e.stopPropagation(); handleSelect(item, idx); }}
            onMouseEnter={e => {
              gsap.to(e.currentTarget, { scale: 1.12, duration: 0.15 });
            }}
            onMouseLeave={e => {
              gsap.to(e.currentTarget, { scale: 1, duration: 0.15 });
            }}
            style={{
              position: "absolute",
              left: ix, top: iy,
              width: ITEM_SIZE, height: ITEM_SIZE,
              zIndex: 61,
              border:     `2px solid ${item.color}88`,
              background: `${item.color}18`,
              cursor:     "pointer",
              display:    "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap:        4,
              padding:    0,
              fontFamily: C.mono,
            }}
            aria-label={`Create ${item.label} (${item.relType})`}
          >
            {/* Bracket corners */}
            {[
              { top: -1, left: -1, borderTop:    `1px solid ${item.color}`, borderLeft:  `1px solid ${item.color}` },
              { top: -1, right:-1, borderTop:    `1px solid ${item.color}`, borderRight: `1px solid ${item.color}` },
              { bottom:-1,left:-1, borderBottom: `1px solid ${item.color}`, borderLeft:  `1px solid ${item.color}` },
              { bottom:-1,right:-1,borderBottom: `1px solid ${item.color}`, borderRight: `1px solid ${item.color}` },
            ].map((s, i) => (
              <div key={i} style={{ position: "absolute", width: 8, height: 8, ...s }} />
            ))}

            <Icon size={28} color={item.color} strokeWidth={1.5} />

            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
              color: item.color, textAlign: "center", lineHeight: 1.1,
            }}>
              {item.label.toUpperCase().replace(" ", "\n")}
            </span>

            {/* Relationship badge */}
            <span style={{
              position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)",
              fontSize: 8, letterSpacing: "0.08em",
              color: C.muted, opacity: 0.75,
              whiteSpace: "nowrap",
              background: "#050505",
              padding: "1px 5px",
              border: `1px solid ${C.border}44`,
            }}>
              {item.relType}
            </span>
          </button>
        );
      })}
    </>
  );
}
