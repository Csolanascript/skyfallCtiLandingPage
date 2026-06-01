"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Shield, Download, Trash2, ChevronLeft, FileJson,
  Target, Bug, UserCog, AlertTriangle, Layers, Wrench,
  Server, MapPin, Users, FileText, Eye, Code, Award, Wifi, Globe, Link as LinkIcon,
  Flag, Database, CheckCircle, LucideIcon,
} from "lucide-react";
import { STIX_TYPES, downloadBundle } from "@/lib/stix-forge-types";
import type { CanvasEntity, CanvasRelationship } from "@/lib/stix-forge-types";
import ForgeCanvas from "./ForgeCanvas";
import EntityFormModal from "./EntityFormModal";

const R    = "#E85419";
const MONO = "'JetBrains Mono','Share Tech Mono',monospace";
const MUTED = "rgba(212,212,212,0.45)";
const BRD  = "rgba(255,255,255,0.08)";
const GRN  = "#00FF41";

// ─── Inline styles ───────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
@keyframes fg-flicker { 0%,100%{opacity:1}93%{opacity:1}94%{opacity:0.4}96%{opacity:0.7}97%{opacity:1} }
@keyframes fg-pulse { 0%,100%{opacity:0.5}50%{opacity:1} }
.fg-flicker { animation: fg-flicker 5s infinite; }
.fg-pulse { animation: fg-pulse 2s ease-in-out infinite; }
.fg-btn:hover { opacity:1 !important; }
::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-track { background:#000; }
::-webkit-scrollbar-thumb { background:rgba(232,84,25,0.3); }
`;

// ─── Icon map ────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  Target, Bug, UserCog, Shield, Flag, AlertTriangle, Layers, Wrench,
  Server, MapPin, Users, FileText, Eye, Code, Award, Wifi,
  Globe2: Globe, LinkIcon,
};

// ─── Bracket corners ─────────────────────────────────────────────────────────
function Brackets({ color = R, size = 8 }: { color?: string; size?: number }) {
  return (
    <>
      <div style={{ position:"absolute", top:-1, left:-1, width:size, height:size, borderTop:`2px solid ${color}`, borderLeft:`2px solid ${color}` }} />
      <div style={{ position:"absolute", top:-1, right:-1, width:size, height:size, borderTop:`2px solid ${color}`, borderRight:`2px solid ${color}` }} />
      <div style={{ position:"absolute", bottom:-1, left:-1, width:size, height:size, borderBottom:`2px solid ${color}`, borderLeft:`2px solid ${color}` }} />
      <div style={{ position:"absolute", bottom:-1, right:-1, width:size, height:size, borderBottom:`2px solid ${color}`, borderRight:`2px solid ${color}` }} />
    </>
  );
}

// ─── Scanlines ───────────────────────────────────────────────────────────────
function Scanlines() {
  return (
    <div style={{
      position:"fixed", inset:0, pointerEvents:"none", zIndex:9998,
      background:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.06) 3px,rgba(0,0,0,0.06) 4px)",
    }} />
  );
}

// ─── Bundle stats in left panel ───────────────────────────────────────────────
function BundlePanel({
  entities, relationships, onDownload, onClear,
}: {
  entities: CanvasEntity[];
  relationships: CanvasRelationship[];
  onDownload: () => void;
  onClear: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const typeCount: Record<string, number> = {};
  for (const e of entities) typeCount[e.type] = (typeCount[e.type] ?? 0) + 1;

  const handleCopyJson = () => {
    import("@/lib/stix-forge-types").then(({ buildBundle }) => {
      const bundle = buildBundle(entities, relationships);
      navigator.clipboard.writeText(JSON.stringify(bundle, null, 2)).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    });
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
      <div style={{ fontSize:7, letterSpacing:"0.22em", color:R, marginBottom:10, paddingLeft:4, fontWeight:700 }}>
        ▶ BUNDLE CONTENTS
      </div>

      {entities.length === 0 ? (
        <div style={{ fontSize:8, color:MUTED, letterSpacing:"0.1em", textAlign:"center", padding:"16px 4px", opacity:0.5 }}>
          EMPTY
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:3, marginBottom:10 }}>
          {Object.entries(typeCount).map(([type, count]) => {
            const entry = STIX_TYPES.find((t) => t.id === type);
            return (
              <div key={type} style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"4px 8px", border:`1px solid ${entry?.color ?? R}22`,
                background:`${entry?.color ?? R}08`,
              }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background: entry?.color ?? R, flexShrink:0 }} />
                <span style={{ flex:1, fontSize:8, color:"#D4D4D4", letterSpacing:"0.08em", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {entry?.label ?? type}
                </span>
                <span style={{ fontSize:9, color: entry?.color ?? R, fontWeight:700 }}>{count}</span>
              </div>
            );
          })}
          {relationships.length > 0 && (
            <div style={{
              display:"flex", alignItems:"center", gap:6,
              padding:"4px 8px", border:`1px solid ${R}22`, background:`${R}08`,
            }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background: R, flexShrink:0 }} />
              <span style={{ flex:1, fontSize:8, color:"#D4D4D4", letterSpacing:"0.08em" }}>relationships</span>
              <span style={{ fontSize:9, color: R, fontWeight:700 }}>{relationships.length}</span>
            </div>
          )}
        </div>
      )}

      {entities.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          <button
            onClick={onDownload}
            className="fg-btn"
            style={{
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              border:`1px solid ${R}`, background:`${R}22`, color:R,
              fontFamily:MONO, fontSize:8, letterSpacing:"0.18em", fontWeight:700,
              padding:"8px 0", cursor:"pointer", opacity:0.9, position:"relative",
            }}
          >
            <Brackets size={6} />
            <Download size={10} />
            DOWNLOAD JSON
          </button>
          <button
            onClick={handleCopyJson}
            className="fg-btn"
            style={{
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              border:`1px solid ${BRD}`, background:"transparent", color: copied ? GRN : MUTED,
              fontFamily:MONO, fontSize:8, letterSpacing:"0.18em",
              padding:"6px 0", cursor:"pointer", opacity:0.85,
            }}
          >
            {copied ? <><CheckCircle size={10} /> COPIED!</> : <><FileJson size={10} /> COPY JSON</>}
          </button>
          <button
            onClick={onClear}
            className="fg-btn"
            style={{
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              border:`1px solid rgba(255,50,50,0.3)`, background:"transparent",
              color:"rgba(255,50,50,0.5)",
              fontFamily:MONO, fontSize:7, letterSpacing:"0.18em",
              padding:"5px 0", cursor:"pointer", opacity:0.8,
            }}
          >
            <Trash2 size={9} /> CLEAR CANVAS
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Palette grid ─────────────────────────────────────────────────────────────
function PaletteGrid({ onAdd }: { onAdd: (typeId: string) => void }) {
  return (
    <div>
      <div style={{ fontSize:7, fontWeight:700, letterSpacing:"0.22em", color:R, marginBottom:10, paddingLeft:4 }}>
        ▶ ENTITY TYPES
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5 }}>
        {STIX_TYPES.map((t) => {
          const Icon = ICON_MAP[t.icon] ?? Target;
          return (
            <button
              key={t.id}
              onClick={() => onAdd(t.id)}
              style={{
                position:"relative", border:`1px solid rgba(255,255,255,0.07)`,
                background:"#0a0a0a", padding:"9px 4px",
                cursor:"pointer", display:"flex", flexDirection:"column",
                alignItems:"center", gap:5, userSelect:"none",
                transition:"border-color 150ms, background 150ms",
                fontFamily:MONO,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = `${t.color}66`;
                el.style.background = `${t.color}0a`;
                el.style.boxShadow = `0 0 14px ${t.color}44`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(255,255,255,0.07)";
                el.style.background = "#0a0a0a";
                el.style.boxShadow = "none";
              }}
              aria-label={`Add ${t.label}`}
            >
              <div style={{ position:"absolute", top:-1, left:-1, width:5, height:5, borderTop:`1px solid ${t.color}`, borderLeft:`1px solid ${t.color}` }} />
              <div style={{ position:"absolute", top:-1, right:-1, width:5, height:5, borderTop:`1px solid ${t.color}`, borderRight:`1px solid ${t.color}` }} />
              <div style={{ position:"absolute", bottom:-1, left:-1, width:5, height:5, borderBottom:`1px solid ${t.color}`, borderLeft:`1px solid ${t.color}` }} />
              <div style={{ position:"absolute", bottom:-1, right:-1, width:5, height:5, borderBottom:`1px solid ${t.color}`, borderRight:`1px solid ${t.color}` }} />
              <Icon size={22} color={t.color} strokeWidth={1.5} />
              <span style={{ fontSize:6, fontWeight:700, letterSpacing:"0.14em", color:MUTED, textAlign:"center", lineHeight:1.2 }}>
                {t.label.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop:10, fontSize:7, color:MUTED, opacity:0.4, textAlign:"center", letterSpacing:"0.1em" }}>
        CLICK TO ADD TO CANVAS
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ForgeDemo() {
  const [entities,      setEntities]      = useState<CanvasEntity[]>([]);
  const [relationships, setRelationships] = useState<CanvasRelationship[]>([]);
  const [editorUid,     setEditorUid]     = useState<string | null>(null);
  const [editorType,    setEditorType]    = useState<string | undefined>();
  const [showEditor,    setShowEditor]    = useState(false);
  const [clock,         setClock]         = useState("");

  // Live clock
  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const addEntity = useCallback((typeId: string) => {
    setEditorUid(null);
    setEditorType(typeId);
    setShowEditor(true);
  }, []);

  const editEntity = useCallback((uid: string) => {
    setEditorUid(uid);
    setEditorType(undefined);
    setShowEditor(true);
  }, []);

  const handleSave = useCallback((entity: CanvasEntity) => {
    setEntities((prev) => {
      const exists = prev.find((e) => e.uid === entity.uid);
      return exists
        ? prev.map((e) => e.uid === entity.uid ? entity : e)
        : [...prev, entity];
    });
  }, []);

  const deleteEntity = useCallback((uid: string) => {
    setEntities((prev) => prev.filter((e) => e.uid !== uid));
    setRelationships((prev) => prev.filter((r) => r.sourceUid !== uid && r.targetUid !== uid));
  }, []);

  const updatePosition = useCallback((uid: string, x: number, y: number) => {
    setEntities((prev) => prev.map((e) => e.uid === uid ? { ...e, x, y } : e));
  }, []);

  const addRelationship = useCallback((r: CanvasRelationship) => {
    setRelationships((prev) => [...prev, r]);
  }, []);

  const handleDownload = () => {
    if (entities.length === 0) return;
    downloadBundle(entities, relationships);
  };

  const handleClear = () => {
    setEntities([]);
    setRelationships([]);
  };

  const nodeCount = entities.length;
  const relCount  = relationships.length;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <Scanlines />

      <div style={{
        height:"100vh", display:"flex", flexDirection:"column",
        background:"#000", fontFamily:MONO, color:"#E2E2E2", overflow:"hidden",
      }}>
        {/* ── Header ── */}
        <div style={{
          borderBottom:`1px solid ${BRD}`,
          padding:"10px 20px",
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
          flexShrink:0, position:"relative",
        }}>
          <Brackets size={7} />

          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <Link
              href="/"
              style={{
                display:"flex", alignItems:"center", gap:6,
                fontSize:8, letterSpacing:"0.18em", color:MUTED,
                textDecoration:"none", transition:"color 150ms",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = R; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = MUTED; }}
            >
              <ChevronLeft size={10} /> HOME
            </Link>
            <div style={{ width:1, height:16, background:BRD }} />
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Shield size={12} color={R} />
              <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.25em", color:R }}>STIX FORGE</span>
            </div>
            <span style={{ fontSize:8, color:MUTED, letterSpacing:"0.1em" }}>
              {nodeCount} ENTITIES · {relCount} RELATIONS
            </span>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span className="fg-flicker" style={{ fontSize:8, color:"rgba(0,255,65,0.7)", letterSpacing:"0.15em" }}>
              ● DEMO MODE
            </span>
            <span style={{ fontSize:8, color:"rgba(255,255,255,0.2)", letterSpacing:"0.1em" }}>{clock}</span>
            <button
              onClick={handleDownload}
              disabled={nodeCount === 0}
              style={{
                display:"flex", alignItems:"center", gap:6,
                border:`1px solid ${nodeCount > 0 ? R : BRD}`,
                background: nodeCount > 0 ? `${R}22` : "transparent",
                color: nodeCount > 0 ? R : MUTED,
                fontFamily:MONO, fontSize:9, fontWeight:700, letterSpacing:"0.18em",
                padding:"5px 16px", cursor: nodeCount > 0 ? "pointer" : "not-allowed",
                opacity: nodeCount > 0 ? 0.9 : 0.4,
                transition:"all 150ms",
              }}
            >
              <Download size={11} />
              DOWNLOAD BUNDLE
            </button>
          </div>
        </div>

        {/* ── 2-Panel body ── */}
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
          {/* Left panel */}
          <div style={{
            width:230, flexShrink:0, borderRight:`1px solid ${BRD}`,
            overflowY:"auto", padding:"12px 8px",
            display:"flex", flexDirection:"column", gap:20,
          }}>
            <PaletteGrid onAdd={addEntity} />

            <div style={{ borderTop:`1px solid ${BRD}`, paddingTop:16 }}>
              <BundlePanel
                entities={entities}
                relationships={relationships}
                onDownload={handleDownload}
                onClear={handleClear}
              />
            </div>

            {/* Info footer */}
            <div style={{
              marginTop:"auto", padding:"10px 8px",
              border:`1px solid ${BRD}`, background:"#050505",
              fontSize:7, color:MUTED, letterSpacing:"0.1em", lineHeight:1.7,
            }}>
              <div style={{ color:R, marginBottom:4, letterSpacing:"0.15em" }}>▶ HOW TO USE</div>
              <div>① Click entity type to add</div>
              <div>② Click EDIT to fill fields</div>
              <div>③ Click LINK to connect two entities</div>
              <div>④ DOWNLOAD JSON for the STIX 2.1 bundle</div>
              <div style={{ marginTop:6, color:`${R}88` }}>80 ATT&amp;CK + 30 CWE built-in</div>
            </div>
          </div>

          {/* Canvas */}
          <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
            <ForgeCanvas
              entities={entities}
              relationships={relationships}
              onUpdatePosition={updatePosition}
              onEdit={editEntity}
              onDelete={deleteEntity}
              onAddRelationship={addRelationship}
            />
          </div>
        </div>

        {/* ── Entity form modal ── */}
        {showEditor && (
          <EntityFormModal
            uid={editorUid}
            typeId={editorType}
            entities={entities}
            onSave={handleSave}
            onClose={() => { setShowEditor(false); setEditorUid(null); setEditorType(undefined); }}
          />
        )}
      </div>
    </>
  );
}
