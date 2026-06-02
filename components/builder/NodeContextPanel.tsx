"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { X, PlusCircle, ArrowRight, ArrowLeft } from "lucide-react";
import {
  Target, Bug, UserCog, Shield, Flag, AlertTriangle, Layers, Wrench,
  Server, MapPin, Users, FileText, Eye, Code, Award, Wifi, Globe, Link,
  LucideIcon,
} from "lucide-react";
import { STIX_TYPES, getRelationships, ALL_RELATIONSHIP_TYPES } from "@/lib/stix-types";
import type { CanvasEntity, CanvasRelationship } from "@/lib/stix-types";
import { useForge } from "./ForgeLayout";

const ICON_MAP: Record<string, LucideIcon> = {
  Target, Bug, UserCog, Shield, Flag, AlertTriangle, Layers, Wrench,
  Server, MapPin, Users, FileText, Eye, Code, Award, Wifi,
  Globe2: Globe, LinkIcon: Link,
};

interface NeighborRow {
  rel_type:      string;
  direction:     "out" | "in";
  neighbor_id:   string;
  neighbor_name: string;
  neighbor_type: string;
  external_id:   string | null;
  confidence:    number;
  correlation:   string;
}

interface Props {
  entityUid: string;
  onClose: () => void;
}

// STIX type → Neo4j label mapping (reverse of catalog)
const STIX_TYPE_MAP: Record<string, string> = {
  Indicator: "indicator", Malware: "malware", ThreatActor: "threat-actor",
  IntrusionSet: "intrusion-set", Campaign: "campaign", Vulnerability: "vulnerability",
  Technique: "attack-pattern", Tool: "tool", Infrastructure: "infrastructure",
  Location: "location", Identity: "identity", Report: "report",
  IP: "ipv4-addr", Domain: "domain-name", URL: "url", Email: "email-addr",
  File: "file", Certificate: "x509-certificate", Software: "software",
};

function typeColor(stixType: string): string {
  return STIX_TYPES.find((t) => t.id === stixType)?.color ?? "#555";
}

export default function NodeContextPanel({ entityUid, onClose }: Props) {
  const { C, entities, relationships, addEntity, addRelationship } = useForge();
  const panelRef = useRef<HTMLDivElement>(null);

  const entity   = entities.find((e) => e.uid === entityUid);
  const typeEntry = entity ? STIX_TYPES.find((t) => t.id === entity.type) : null;
  const color     = typeEntry?.color ?? C.red;
  const IconComp  = ICON_MAP[typeEntry?.icon ?? "Target"] ?? Target;

  const [neighbors,   setNeighbors]   = useState<NeighborRow[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [addQuery,    setAddQuery]    = useState("");
  const [addResults,  setAddResults]  = useState<Array<{ id: string; name: string; type: string; external_id?: string }>>([]);
  const [addSearching, setAddSearching] = useState(false);
  const [selectedNeighbor, setSelectedNeighbor] = useState<{ id: string; name: string; type: string } | null>(null);
  const [selectedRelType,  setSelectedRelType]  = useState("related-to");
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Entry animation
  useGSAP(() => {
    if (!panelRef.current) return;
    gsap.fromTo(panelRef.current, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" });
  }, { scope: panelRef });

  // Fetch existing Neo4j neighbors
  useEffect(() => {
    if (!entity?.stixId) return;
    setLoading(true);
    fetch(`/api/stix/neighbors/${encodeURIComponent(entity.stixId)}`)
      .then((r) => r.json())
      .then((d) => setNeighbors(d.neighbors ?? []))
      .catch(() => setNeighbors([]))
      .finally(() => setLoading(false));
  }, [entity?.stixId]);

  // Search for entities to connect
  const searchEntities = useCallback(async (q: string) => {
    setAddSearching(true);
    try {
      const res  = await fetch(`/api/stix/catalog?q=${encodeURIComponent(q)}&limit=15`);
      const data = await res.json();
      setAddResults(data.results ?? []);
    } catch {
      setAddResults([]);
    } finally {
      setAddSearching(false);
    }
  }, []);

  const handleAddQueryChange = (q: string) => {
    setAddQuery(q);
    setSelectedNeighbor(null);
    clearTimeout(debounce.current);
    if (q.length >= 2) {
      debounce.current = setTimeout(() => searchEntities(q), 250);
    } else {
      setAddResults([]);
    }
  };

  // Update rel type suggestions when neighbor type changes
  useEffect(() => {
    if (!entity || !selectedNeighbor) return;
    const rels = getRelationships(entity.type, STIX_TYPE_MAP[selectedNeighbor.type] ?? selectedNeighbor.type);
    setSelectedRelType(rels[0] ?? "related-to");
  }, [entity, selectedNeighbor]);

  const canvasEntityIds = new Set(entities.map((e) => e.stixId).filter(Boolean));

  // Add a neighbour to canvas + create relationship
  const handleAddToCanvas = (n: NeighborRow) => {
    if (!entity) return;
    const stixType = STIX_TYPE_MAP[n.neighbor_type] ?? "identity";

    // Check if already on canvas
    const existing = entities.find((e) => e.stixId === n.neighbor_id);
    const targetUid = existing?.uid ?? (() => {
      const uid = crypto.randomUUID();
      const newEntity: CanvasEntity = {
        uid,
        stixId:     n.neighbor_id,
        type:       stixType,
        label:      STIX_TYPES.find((t) => t.id === stixType)?.label ?? n.neighbor_type,
        name:       n.neighbor_name,
        data:       { name: n.neighbor_name, external_id: n.external_id ?? undefined },
        x:          entity.x + 240 + Math.random() * 60,
        y:          entity.y + (Math.random() - 0.5) * 100,
        isExisting: true,
      };
      addEntity(newEntity);
      return uid;
    })();

    // Add relationship if not already present
    const srcUid = n.direction === "out" ? entity.uid  : targetUid;
    const tgtUid = n.direction === "out" ? targetUid   : entity.uid;
    const alreadyConnected = relationships.some(
      (r) => r.sourceUid === srcUid && r.targetUid === tgtUid && r.relationshipType === n.rel_type,
    );
    if (!alreadyConnected) {
      addRelationship({
        uid: crypto.randomUUID(),
        sourceUid:        srcUid,
        targetUid:        tgtUid,
        relationshipType: n.rel_type.toLowerCase().replace(/_/g, "-"),
      });
    }
  };

  // Connect a searched entity to this node
  const handleConnect = () => {
    if (!entity || !selectedNeighbor) return;
    const stixType = STIX_TYPE_MAP[selectedNeighbor.type] ?? "identity";
    const existing = entities.find((e) => e.stixId === selectedNeighbor.id);
    const targetUid = existing?.uid ?? (() => {
      const uid = crypto.randomUUID();
      addEntity({
        uid,
        stixId:     selectedNeighbor.id,
        type:       stixType,
        label:      STIX_TYPES.find((t) => t.id === stixType)?.label ?? selectedNeighbor.type,
        name:       selectedNeighbor.name,
        data:       { name: selectedNeighbor.name },
        x:          entity.x + 250,
        y:          entity.y,
        isExisting: true,
      });
      return uid;
    })();

    addRelationship({
      uid: crypto.randomUUID(),
      sourceUid:        entity.uid,
      targetUid:        targetUid,
      relationshipType: selectedRelType,
    });
    setSelectedNeighbor(null);
    setAddQuery("");
    setAddResults([]);
  };

  if (!entity) return null;

  const displayName =
    (entity.data.name  as string | undefined) ||
    (entity.data.value as string | undefined) ||
    entity.label;

  const relOptions = selectedNeighbor
    ? getRelationships(entity.type, STIX_TYPE_MAP[selectedNeighbor.type] ?? selectedNeighbor.type)
    : [...ALL_RELATIONSHIP_TYPES];

  const INPUT: React.CSSProperties = {
    background: C.bg, border: `1px solid ${C.border}`,
    color: C.white, fontFamily: C.mono, fontSize: 11,
    padding: "6px 10px", outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    <div
      ref={panelRef}
      style={{
        width: 360, height: "100%", overflowY: "auto",
        borderLeft: `1px solid ${color}44`,
        background: "#030303",
        display: "flex", flexDirection: "column",
        fontFamily: C.mono, flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{
        padding: "16px 18px", borderBottom: `1px solid ${C.border}33`,
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
      }}>
        <IconComp size={19} color={color} strokeWidth={1.5} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", color, fontWeight: 700 }}>
            {entity.label.toUpperCase()}
          </div>
          <div style={{ fontSize: 12, color: C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 4, flexShrink: 0 }}
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Stix ID info */}
      {!entity.stixId && (
        <div style={{ padding: "10px 18px", fontSize: 9, color: "#FFAA00", opacity: 0.8, letterSpacing: "0.1em", borderBottom: `1px solid ${C.border}22` }}>
          ⚠ NOT IN NEO4J YET — BUILD FIRST TO SEE EXISTING RELATIONS
        </div>
      )}

      {/* ── Existing Neo4j connections ── */}
      <div style={{ padding: "12px 18px", flex: 1 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.18em", color: C.muted, opacity: 0.6, marginBottom: 10 }}>
          ▶ NEO4J CONNECTIONS
          {neighbors.length > 0 && (
            <span style={{ marginLeft: 8, color: C.green }}>{neighbors.length}</span>
          )}
        </div>

        {loading && (
          <div style={{ fontSize: 10, color: C.muted, opacity: 0.5 }}>LOADING…</div>
        )}

        {!loading && !entity.stixId && (
          <div style={{ fontSize: 10, color: C.muted, opacity: 0.4, letterSpacing: "0.1em" }}>
            No Neo4j ID
          </div>
        )}

        {!loading && entity.stixId && neighbors.length === 0 && (
          <div style={{ fontSize: 10, color: C.muted, opacity: 0.4, letterSpacing: "0.1em" }}>
            No connections found
          </div>
        )}

        {neighbors.map((n, i) => {
          const alreadyOnCanvas = canvasEntityIds.has(n.neighbor_id);
          const nColor = typeColor(STIX_TYPE_MAP[n.neighbor_type] ?? "");
          return (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                padding: "6px 0", borderBottom: `1px solid ${C.border}18`,
              }}
            >
              {/* Direction arrow */}
              <div style={{ paddingTop: 2, flexShrink: 0 }}>
                {n.direction === "out"
                  ? <ArrowRight size={13} color={color} />
                  : <ArrowLeft  size={13} color={C.muted} />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* rel_type */}
                <div style={{ fontSize: 9, color: C.orange, letterSpacing: "0.1em", opacity: 0.85 }}>
                  {n.rel_type.replace(/_/g, "-").toLowerCase()}
                </div>
                {/* neighbor name + type */}
                <div style={{ fontSize: 11, color: nColor || C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {n.external_id ? `[${n.external_id}] ` : ""}
                  {n.neighbor_name.slice(0, 36)}
                </div>
                <div style={{ fontSize: 9, color: C.muted, opacity: 0.5 }}>
                  {n.neighbor_type}
                  {n.correlation && ` · ${n.correlation.split("_")[0]}`}
                </div>
              </div>

              {/* Add to canvas */}
              <button
                onClick={() => handleAddToCanvas(n)}
                disabled={alreadyOnCanvas}
                style={{
                  background: "none",
                  border: `1px solid ${alreadyOnCanvas ? C.border : C.green}`,
                  color: alreadyOnCanvas ? C.muted : C.green,
                  fontFamily: C.mono, fontSize: 9, letterSpacing: "0.1em",
                  padding: "3px 8px", cursor: alreadyOnCanvas ? "default" : "pointer",
                  flexShrink: 0, opacity: alreadyOnCanvas ? 0.4 : 1,
                  whiteSpace: "nowrap",
                }}
                title={alreadyOnCanvas ? "Already on canvas" : "Add to canvas"}
              >
                {alreadyOnCanvas ? "ON CANVAS" : "+ ADD"}
              </button>
            </div>
          );
        })}

        {/* ── Add new relationship ── */}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.border}33` }}>
          <div style={{ fontSize: 9, letterSpacing: "0.18em", color: C.muted, opacity: 0.6, marginBottom: 10 }}>
            ▶ CONNECT TO ENTITY
          </div>

          {/* Entity search */}
          <div style={{ position: "relative", marginBottom: 6 }}>
            <input
              type="text"
              value={addQuery}
              onChange={(e) => handleAddQueryChange(e.target.value)}
              placeholder="Search entity by name or ID…"
              style={INPUT}
              aria-label="Search entity to connect"
            />
            {addSearching && (
              <span style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 7, color: C.muted, opacity: 0.5 }}>…</span>
            )}
          </div>

          {/* Search results */}
          {addResults.length > 0 && !selectedNeighbor && (
            <div style={{ border: `1px solid ${C.border}44`, background: "#0a0a0a", maxHeight: 150, overflowY: "auto", marginBottom: 8 }}>
              {addResults.map((r) => (
                <div
                  key={r.id}
                  onClick={() => { setSelectedNeighbor(r); setAddQuery(r.name); setAddResults([]); }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.rowHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  style={{ padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "baseline", gap: 8 }}
                  role="option"
                >
                  {r.external_id && (
                    <span style={{ fontSize: 9, color: "#9933FF", fontWeight: 700, flexShrink: 0 }}>{r.external_id}</span>
                  )}
                  <span style={{ fontSize: 11, color: C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{r.name}</span>
                  <span style={{ fontSize: 9, color: C.muted, opacity: 0.5, flexShrink: 0 }}>{r.type}</span>
                </div>
              ))}
            </div>
          )}

          {/* Selected + relationship type */}
          {selectedNeighbor && (
            <div style={{ marginBottom: 8, padding: "8px 10px", border: `1px solid ${C.border}44`, background: "#0d0d0d" }}>
              <div style={{ fontSize: 10, color: C.green, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                → {selectedNeighbor.name}
              </div>
              <select
                value={selectedRelType}
                onChange={(e) => setSelectedRelType(e.target.value)}
                style={{ ...INPUT, padding: "4px 6px", cursor: "pointer", marginBottom: 6 }}
                aria-label="Relationship type"
              >
                {relOptions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => { setSelectedNeighbor(null); setAddQuery(""); }}
                  style={{ flex: 1, fontSize: 9, padding: "5px 0", border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontFamily: C.mono }}
                >
                  CLEAR
                </button>
                <button
                  onClick={handleConnect}
                  style={{ flex: 2, fontSize: 9, padding: "5px 0", border: `1px solid ${color}`, background: `${color}22`, color, cursor: "pointer", fontFamily: C.mono, fontWeight: 700 }}
                >
                  <PlusCircle size={11} style={{ display: "inline", marginRight: 4 }} />
                  CONNECT
                </button>
              </div>
            </div>
          )}

          {/* STIX relationship type hint */}
          {selectedNeighbor && (
            <div style={{ fontSize: 9, color: C.muted, opacity: 0.4, letterSpacing: "0.08em" }}>
              {entity.type} → {selectedRelType} → {STIX_TYPE_MAP[selectedNeighbor.type] ?? selectedNeighbor.type}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
