"use client";

import React, {
  createContext, useContext, useState, useRef, useCallback, useEffect,
} from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTheme, type ColorSet, DARK } from "@/lib/theme";
import type { CanvasEntity, CanvasRelationship } from "@/lib/stix-types";
import PaletteGrid from "./PaletteGrid";
import BundleCanvas from "./BundleCanvas";
import EntityFormModal from "./EntityFormModal";
import InferenceTheater from "./InferenceTheater";
import ForgeAuth from "./ForgeAuth";
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

  // First pass: assign a stable STIX ID to each entity and record it by uid.
  // Using a separate map avoids generating a second UUID in the relationship pass
  // (which would produce source_ref/target_ref that don't exist in the bundle).
  const idByUid: Record<string, string> = {};
  for (const e of entities) {
    const stixId = e.stixId || `${e.type}--${crypto.randomUUID()}`;
    idByUid[e.uid] = stixId;
    const base: Record<string, unknown> = {
      type:               e.type,
      id:                 stixId,
      spec_version:       "2.1",
      created:            e.data.created  ?? now,
      modified:           e.data.modified ?? now,
      ...e.data,
    };
    base.spec_version = "2.1";
    objects.push(base);
  }

  // Second pass: build SROs using the IDs collected above — no new UUIDs.
  for (const r of relationships) {
    const srcId = idByUid[r.sourceUid];
    const tgtId = idByUid[r.targetUid];
    if (!srcId || !tgtId) continue;
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
  const [showTheater,   setShowTheater]   = useState(false);
  const [buildBundle_,  setBuildBundle]   = useState<Record<string, unknown> | null>(null);
  const [validating,    setValidating]    = useState(false);
  const [validResult,   setValidResult]   = useState<{ ok: boolean; msg: string } | null>(null);
  const [hasToken,      setHasToken]      = useState(false);

  // Check token on mount
  useEffect(() => {
    const envToken = process.env.NEXT_PUBLIC_FORGE_TOKEN ?? "";
    if (envToken) { setHasToken(true); return; }
    const saved = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("forge-token") : null;
    setHasToken(!!saved);
  }, []);

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

  // ── Token helper (same logic as InferenceTheater)
  const getToken = useCallback((): string => {
    return (
      (process.env.NEXT_PUBLIC_FORGE_TOKEN ?? "") ||
      (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("forge-token") : null) ||
      ""
    );
  }, []);

  // ── Validate
  const handleValidate = useCallback(async () => {
    if (entities.length === 0) {
      setValidResult({ ok: false, msg: "Canvas is empty" });
      return;
    }
    setValidating(true);
    setValidResult(null);
    try {
      const bundle = buildBundle(entities, relationships);
      const res = await fetch("/api/stix/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Forge-Token": getToken() },
        body: JSON.stringify({ bundle }),
      });
      const data = await res.json();
      if (data.valid) {
        setValidResult({ ok: true, msg: `${data.object_count} objects valid` });
      } else {
        setValidResult({ ok: false, msg: (data.errors ?? []).join(" · ").slice(0, 200) });
      }
    } catch (e) {
      setValidResult({ ok: false, msg: String(e) });
    } finally {
      setValidating(false);
    }
  }, [entities, relationships, getToken]);

  // ── Build — validates first; blocks if invalid
  const handleBuild = useCallback(async () => {
    if (entities.length === 0) return;
    const bundle = buildBundle(entities, relationships);

    setValidating(true);
    setValidResult(null);
    try {
      const res  = await fetch("/api/stix/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Forge-Token": getToken() },
        body: JSON.stringify({ bundle }),
      });
      const data = await res.json();
      if (!data.valid) {
        const msg = (data.errors as string[] | undefined ?? []).join(" · ").slice(0, 300) || "Validation failed";
        setValidResult({ ok: false, msg });
        return;             // ← blocked: don't open theater
      }
      setValidResult({ ok: true, msg: `${data.object_count} objects valid` });
    } catch (e) {
      setValidResult({ ok: false, msg: `Validation error: ${String(e)}` });
      return;
    } finally {
      setValidating(false);
    }

    // Validation passed — open InferenceTheater
    setBuildBundle(bundle);
    setShowTheater(true);
  }, [entities, relationships, getToken]);

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
          padding: "12px 24px", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 14, flexShrink: 0,
          position: "relative",
        }}>
          <Brackets size={10} />
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Breadcrumb />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.25em", color: C.red }}>
              ▶ STIX FORGE
            </span>
            <span style={{ fontSize: 11, color: C.muted, letterSpacing: "0.1em" }}>
              {nodeCount} ENTITIES · {relCount} RELATIONS
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {validResult && (
              <span style={{
                fontSize: 11, letterSpacing: "0.1em",
                color: validResult.ok ? C.green : "#FF4444",
                maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {validResult.ok ? "✓" : "✗"} {validResult.msg}
              </span>
            )}
            <ActionButton
              label={validating ? "VALIDATING…" : "VALIDATE"}
              onClick={handleValidate}
              disabled={validating || nodeCount === 0}
              color={C.border}
              textColor={C.muted}
            />
            <ActionButton
              label={validating ? "VALIDATING…" : "BUILD"}
              onClick={handleBuild}
              disabled={nodeCount === 0 || !hasToken || validating}
              color={C.red}
              textColor={C.white}
              hot
            />
          </div>
        </div>

        {/* ── 3-Panel body ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Left: Palette */}
          <div style={{
            width: 290, flexShrink: 0, borderRight: `1px solid ${C.border}`,
            overflowY: "auto", padding: "16px 10px",
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
        {showTheater && buildBundle_ && (
          <InferenceTheater
            bundle={buildBundle_}
            onClose={() => { setShowTheater(false); setBuildBundle(null); }}
          />
        )}
        {!hasToken && (
          <ForgeAuth onAuth={() => setHasToken(true)} />
        )}
      </div>
    </ForgeCtx.Provider>
  );
}

// ─── ActionButton ─────────────────────────────────────────────────────────────
function ActionButton({
  label, onClick, disabled, color, textColor, hot = false,
}: {
  label: string; onClick: () => void; disabled?: boolean;
  color: string; textColor: string; hot?: boolean;
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
      style={{
        border: `1px solid ${color}`,
        background: hot ? `${color}22` : "transparent",
        color: disabled ? "rgba(255,255,255,0.3)" : textColor,
        fontFamily: "inherit",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.18em",
        padding: "6px 18px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 0.85,
        transition: "opacity 0.15s",
      }}
      aria-label={label}
    >
      {label}
    </button>
  );
}
