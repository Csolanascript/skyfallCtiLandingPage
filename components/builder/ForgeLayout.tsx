"use client";

import React, {
  createContext, useContext, useState, useRef, useCallback, useEffect,
} from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTheme, type ColorSet, DARK } from "@/lib/theme";
import type { CanvasEntity, CanvasRelationship } from "@/lib/stix-types";
import { Download } from "lucide-react";
import PaletteGrid from "./PaletteGrid";
import BundleCanvas from "./BundleCanvas";
import EntityFormModal from "./EntityFormModal";
import NodeContextPanel from "./NodeContextPanel";
import Breadcrumb from "@/components/ui/Breadcrumb";

gsap.registerPlugin();

// ─── Forge context ────────────────────────────────────────────────────────────
export interface ForgeCtxType {
  C: ColorSet;
  entities: CanvasEntity[];
  relationships: CanvasRelationship[];
  addEntity:    (e: CanvasEntity) => void;
  updateEntity: (uid: string, data: Partial<CanvasEntity>) => void;
  removeEntity: (uid: string) => void;
  addRelationship:    (r: CanvasRelationship) => void;
  removeRelationship: (uid: string) => void;
  openEditor:  (uid: string | null, typeId?: string) => void;
  openContext: (uid: string) => void;
}

const ForgeCtx = createContext<ForgeCtxType>({
  C: DARK, entities: [], relationships: [],
  addEntity: () => {}, updateEntity: () => {}, removeEntity: () => {},
  addRelationship: () => {}, removeRelationship: () => {},
  openEditor: () => {}, openContext: () => {},
});
export const useForge = () => useContext(ForgeCtx);

// ─── Scanlines ────────────────────────────────────────────────────────────────
function Scanlines() {
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9998,
      background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.07) 3px,rgba(0,0,0,0.07) 4px)",
    }} />
  );
}

// ─── Bracket corners ──────────────────────────────────────────────────────────
export function Brackets({ color, size = 10 }: { color?: string; size?: number }) {
  const { C } = useTheme();
  const c = color ?? C.red;
  const s = (top: boolean, right: boolean): React.CSSProperties => ({
    position: "absolute", width: size, height: size,
    ...(top ? { top: -1 } : { bottom: -1 }),
    ...(right ? { right: -1 } : { left: -1 }),
    borderTop:    top   ? `2px solid ${c}` : undefined,
    borderBottom: !top  ? `2px solid ${c}` : undefined,
    borderLeft:   !right ? `2px solid ${c}` : undefined,
    borderRight:  right  ? `2px solid ${c}` : undefined,
  });
  return (
    <>
      <div style={s(true, false)} /><div style={s(true, true)} />
      <div style={s(false, false)} /><div style={s(false, true)} />
    </>
  );
}

// ─── Build a STIX bundle from canvas state ────────────────────────────────────
function buildBundle(entities: CanvasEntity[], relationships: CanvasRelationship[]) {
  const now = new Date().toISOString();
  const objects: Record<string, unknown>[] = [];

  for (const e of entities) {
    const stixId = e.stixId || `${e.type}--${crypto.randomUUID()}`;
    const base: Record<string, unknown> = {
      type:               e.type,
      id:                 stixId,
      spec_version:       "2.1",
      created:            e.data.created  ?? now,
      modified:           e.data.modified ?? now,
      ...e.data,
    };
    // Ensure spec_version is never overwritten by e.data
    base.spec_version = "2.1";
    objects.push(base);
  }

  const entityByUid = Object.fromEntries(entities.map((e) => [e.uid, e]));

  for (const r of relationships) {
    const src = entityByUid[r.sourceUid];
    const tgt = entityByUid[r.targetUid];
    if (!src || !tgt) continue;
    const srcId = src.stixId || `${src.type}--${crypto.randomUUID()}`;
    const tgtId = tgt.stixId || `${tgt.type}--${crypto.randomUUID()}`;
    objects.push({
      type:              "relationship",
      id:                r.stixId || `relationship--${crypto.randomUUID()}`,
      spec_version:      "2.1",
      created:           now,
      modified:          now,
      relationship_type: r.relationshipType,
      source_ref:        srcId,
      target_ref:        tgtId,
      ...(r.description ? { description: r.description } : {}),
      ...(r.confidence  ? { confidence: r.confidence }   : {}),
    });
  }

  return {
    type:         "bundle",
    id:           `bundle--${crypto.randomUUID()}`,
    spec_version: "2.1",
    objects,
  };
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ForgeLayout() {
  const { C } = useTheme();
  const headerRef = useRef<HTMLDivElement>(null);

  const [entities,      setEntities]      = useState<CanvasEntity[]>([]);
  const [relationships, setRelationships] = useState<CanvasRelationship[]>([]);
  const [editorUid,     setEditorUid]     = useState<string | null>(null);
  const [editorType,    setEditorType]    = useState<string | undefined>();
  const [contextUid,    setContextUid]    = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  // ── Entry animation
  useGSAP(() => {
    if (!headerRef.current) return;
    gsap.fromTo(headerRef.current,
      { opacity: 0, y: -12 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
    );
  }, { scope: headerRef });

  // ── Context helpers
  const addEntity = useCallback((e: CanvasEntity) => {
    setEntities((prev) => [...prev, e]);
  }, []);
  const updateEntity = useCallback((uid: string, data: Partial<CanvasEntity>) => {
    setEntities((prev) => prev.map((e) => e.uid === uid ? { ...e, ...data } : e));
  }, []);
  const removeEntity = useCallback((uid: string) => {
    setEntities((prev) => prev.filter((e) => e.uid !== uid));
    setRelationships((prev) => prev.filter((r) => r.sourceUid !== uid && r.targetUid !== uid));
  }, []);
  const addRelationship = useCallback((r: CanvasRelationship) => {
    setRelationships((prev) => [...prev, r]);
  }, []);
  const removeRelationship = useCallback((uid: string) => {
    setRelationships((prev) => prev.filter((r) => r.uid !== uid));
  }, []);
  const openEditor  = useCallback((uid: string | null, typeId?: string) => {
    setEditorUid(uid);
    setEditorType(typeId);
  }, []);
  const openContext = useCallback((uid: string) => {
    setContextUid(uid);
  }, []);

  // ── Download bundle as JSON
  const handleDownload = useCallback(() => {
    if (entities.length === 0) return;
    const bundle = buildBundle(entities, relationships);
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `stix-bundle-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  }, [entities, relationships]);

  const nodeCount = entities.length;
  const relCount  = relationships.length;

  const forgeCtx: ForgeCtxType = {
    C, entities, relationships,
    addEntity, updateEntity, removeEntity,
    addRelationship, removeRelationship,
    openEditor, openContext,
  };

  const MONO = C.mono;

  return (
    <ForgeCtx.Provider value={forgeCtx}>
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        background: C.bg, fontFamily: MONO, color: C.white, overflow: "hidden",
      }}>
        <Scanlines />

        {/* ── Header ── */}
        <div ref={headerRef} style={{
          opacity: 0, borderBottom: `1px solid ${C.border}`,
          padding: "10px 20px", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 12, flexShrink: 0,
          position: "relative",
        }}>
          <Brackets size={8} />
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Breadcrumb />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.25em", color: C.red }}>
              ▶ STIX FORGE
            </span>
            <span style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em" }}>
              {nodeCount} ENTITIES · {relCount} RELATIONS
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {downloaded && (
              <span style={{ fontSize: 9, letterSpacing: "0.1em", color: C.green }}>
                ✓ BUNDLE DOWNLOADED
              </span>
            )}
            <ActionButton
              label="DOWNLOAD BUNDLE"
              onClick={handleDownload}
              disabled={nodeCount === 0}
              color={C.red}
              textColor={C.white}
              hot
              icon={<Download size={11} />}
            />
          </div>
        </div>

        {/* ── 3-Panel body ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Left: Palette */}
          <div style={{
            width: 248, flexShrink: 0, borderRight: `1px solid ${C.border}`,
            overflowY: "auto", padding: "12px 8px",
          }}>
            <PaletteGrid />
          </div>

          {/* Centre: Canvas */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <BundleCanvas />
          </div>

          {/* Right: Node Context Panel (slides in when node clicked) */}
          {contextUid !== null && (
            <NodeContextPanel
              entityUid={contextUid}
              onClose={() => setContextUid(null)}
            />
          )}
        </div>

        {/* ── Modals ── */}
        {editorUid !== null && (
          <EntityFormModal
            uid={editorUid}
            typeId={editorType}
            onClose={() => { setEditorUid(null); setEditorType(undefined); }}
          />
        )}
      </div>
    </ForgeCtx.Provider>
  );
}

// ─── ActionButton ─────────────────────────────────────────────────────────────
function ActionButton({
  label, onClick, disabled, color, textColor, hot = false, icon,
}: {
  label: string; onClick: () => void; disabled?: boolean;
  color: string; textColor: string; hot?: boolean; icon?: React.ReactNode;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const handleEnter = () => {
    if (!ref.current || disabled) return;
    gsap.to(ref.current, { opacity: 1, duration: 0.15 });
  };
  const handleLeave = () => {
    if (!ref.current || disabled) return;
    gsap.to(ref.current, { opacity: 0.85, duration: 0.15 });
  };

  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      aria-label={label}
      style={{
        border: `1px solid ${color}`,
        background: hot ? `${color}22` : "transparent",
        color: disabled ? "rgba(255,255,255,0.3)" : textColor,
        fontFamily: "inherit",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.18em",
        padding: "5px 14px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 0.85,
        transition: "opacity 0.15s",
        display: "flex", alignItems: "center", gap: 6,
      }}
    >
      {icon}{label}
    </button>
  );
}
