"use client";

import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useForge } from "./ForgeLayout";

interface Props {
  srcUid: string;
  tgtUid: string;
  relationships: string[];
  x: number;
  y: number;
  onConfirm: (
    srcUid: string, tgtUid: string, relType: string,
    description?: string, confidence?: number,
  ) => void;
  onCancel: () => void;
}

export default function RelationshipDropdown({
  srcUid, tgtUid, relationships, x, y, onConfirm, onCancel,
}: Props) {
  const { C } = useForge();
  const panelRef   = useRef<HTMLDivElement>(null);
  const CUSTOM = "__custom__";
  const [relType,   setRelType]   = useState(relationships[0] ?? "related-to");
  const [customRel, setCustomRel] = useState("");
  const [desc,      setDesc]      = useState("");
  const [conf,      setConf]      = useState<number | undefined>(undefined);
  const [showAdv,   setShowAdv]   = useState(false);

  const isCustom   = relType === CUSTOM;
  const finalType  = isCustom ? customRel.trim() || "related-to" : relType;

  useGSAP(() => {
    if (!panelRef.current) return;
    gsap.fromTo(panelRef.current,
      { opacity: 0, scale: 0.9, y: 8 },
      { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: "back.out(1.4)" },
    );
  }, { scope: panelRef });

  const INPUT: React.CSSProperties = {
    background: C.bg,
    border: `1px solid ${C.border}`,
    color: C.white,
    fontFamily: C.mono,
    fontSize: 9,
    padding: "4px 7px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{ position: "absolute", inset: 0, zIndex: 49 }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: "absolute",
          left: Math.min(x, window.innerWidth - 240),
          top:  Math.min(y, window.innerHeight - 240),
          zIndex: 50,
          width: 220,
          background: "#080808",
          border: `1px solid ${C.red}44`,
          padding: "10px 12px",
          fontFamily: C.mono,
          boxShadow: `0 0 20px rgba(0,0,0,0.6)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bracket corners */}
        {[
          { top: -1, left: -1, borderTop: `1px solid ${C.red}`, borderLeft: `1px solid ${C.red}` },
          { top: -1, right: -1, borderTop: `1px solid ${C.red}`, borderRight: `1px solid ${C.red}` },
          { bottom: -1, left: -1, borderBottom: `1px solid ${C.red}`, borderLeft: `1px solid ${C.red}` },
          { bottom: -1, right: -1, borderBottom: `1px solid ${C.red}`, borderRight: `1px solid ${C.red}` },
        ].map((s, i) => (
          <div key={i} style={{ position: "absolute", width: 6, height: 6, ...s }} />
        ))}

        <div style={{ fontSize: 7, letterSpacing: "0.18em", color: C.red, marginBottom: 10 }}>
          ▶ DEFINE RELATIONSHIP
        </div>

        {/* Relationship type */}
        <div style={{ marginBottom: isCustom ? 6 : 8 }}>
          <label style={{ fontSize: 7, letterSpacing: "0.12em", color: C.muted, display: "block", marginBottom: 4 }}>
            TYPE
          </label>
          <select
            value={relType}
            onChange={(e) => setRelType(e.target.value)}
            style={{ ...INPUT, cursor: "pointer" }}
            aria-label="Relationship type"
          >
            {relationships.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
            <option value={CUSTOM}>✏ custom…</option>
          </select>
        </div>

        {/* Custom relationship type input */}
        {isCustom && (
          <div style={{ marginBottom: 8 }}>
            <input
              type="text"
              value={customRel}
              onChange={(e) => setCustomRel(e.target.value)}
              placeholder="e.g. exploits, hosted-on, variant-of"
              autoFocus
              style={{ ...INPUT }}
              aria-label="Custom relationship type"
            />
          </div>
        )}

        {/* Toggle advanced */}
        <button
          onClick={() => setShowAdv(!showAdv)}
          style={{
            fontSize: 7, letterSpacing: "0.1em", color: C.muted,
            background: "none", border: "none", cursor: "pointer",
            fontFamily: C.mono, padding: "2px 0", marginBottom: showAdv ? 8 : 0,
            opacity: 0.6,
          }}
        >
          {showAdv ? "▼ HIDE" : "▶ OPTIONAL FIELDS"}
        </button>

        {showAdv && (
          <>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 7, letterSpacing: "0.12em", color: C.muted, display: "block", marginBottom: 4 }}>
                DESCRIPTION
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={2}
                style={{ ...INPUT, resize: "none" }}
                aria-label="Description"
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 7, letterSpacing: "0.12em", color: C.muted, display: "block", marginBottom: 4 }}>
                CONFIDENCE — {conf ?? "—"}
              </label>
              <input
                type="range" min={0} max={100}
                value={conf ?? 70}
                onChange={(e) => setConf(Number(e.target.value))}
                style={{ width: "100%", accentColor: C.red }}
                aria-label="Confidence"
              />
            </div>
          </>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, fontSize: 8, letterSpacing: "0.12em",
              border: `1px solid ${C.border}`, background: "transparent",
              color: C.muted, cursor: "pointer", fontFamily: C.mono, padding: "5px 0",
            }}
          >
            CANCEL
          </button>
          <button
            onClick={() => onConfirm(srcUid, tgtUid, finalType, desc || undefined, conf)}
            style={{
              flex: 1, fontSize: 8, letterSpacing: "0.12em",
              border: `1px solid ${C.red}`,
              background: `${C.red}22`, color: C.red,
              cursor: "pointer", fontFamily: C.mono, padding: "5px 0", fontWeight: 700,
            }}
          >
            CONNECT
          </button>
        </div>
      </div>
    </>
  );
}
