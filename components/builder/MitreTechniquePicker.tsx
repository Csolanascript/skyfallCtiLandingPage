"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Search, X, Plus } from "lucide-react";
import { useForge } from "./ForgeLayout";
import { ATTACK_CATALOG, CWE_CATALOG } from "@/lib/stix-forge-types";

export interface TechniqueResult {
  id:          string;
  name:        string;
  type:        string;
  external_id: string | null;
  x_mitre_id:  string | null;
  description: string | null;
}

interface Props {
  value?: TechniqueResult | null;
  onSelect: (t: TechniqueResult | null) => void;
}

/** Builds a synthetic TechniqueResult from manual fields */
function buildCustomResult(name: string, tid: string, desc: string): TechniqueResult {
  const isT   = /^T\d{4}/.test(tid.toUpperCase());
  const isCWE = /^CWE-/i.test(tid);
  const prefix = isT ? "attack-pattern--" : isCWE ? "attack-pattern--" : "attack-pattern--";
  return {
    id:          prefix + crypto.randomUUID(),
    name:        name || tid,
    type:        "attack-pattern",
    external_id: tid || null,
    x_mitre_id:  isT ? tid.toUpperCase() : null,
    description: desc || null,
  };
}

/** Returns "T1059.001" for ATT&CK, "CWE-79" for CWE, null otherwise */
function tid(t: TechniqueResult): string | null {
  return t.external_id ?? t.x_mitre_id ?? null;
}

/** True if the ID looks like a MITRE ATT&CK technique */
function isAttack(t: TechniqueResult): boolean {
  const id = tid(t) ?? "";
  return /^T\d{4}/.test(id);
}

/** Format label shown in results: "T1059.001  ·  PowerShell" */
function rowLabel(t: TechniqueResult): { badge: string; name: string } {
  const badge = tid(t) ?? "—";
  // Strip the badge prefix from the name if it starts with it
  const name = t.name.replace(/^(T\d{4}(?:\.\d{3})?|CWE-\d+)\s*[-–:]\s*/i, "").trim() || t.name;
  return { badge, name };
}

export default function MitreTechniquePicker({ value, onSelect }: Props) {
  const { C } = useForge();
  const [query,       setQuery]       = useState("");
  const [results,     setResults]     = useState<TechniqueResult[]>([]);
  const [loading] = useState(false);
  const [open,        setOpen]        = useState(false);
  const [customMode,  setCustomMode]  = useState(false);
  const [customName,  setCustomName]  = useState("");
  const [customTid,   setCustomTid]   = useState("");
  const [customDesc,  setCustomDesc]  = useState("");
  const debounce  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = useCallback((q: string) => {
    const lower = q.toLowerCase();
    const all = [
      ...ATTACK_CATALOG.map(e => ({
        id:          "attack-pattern--" + e.external_id.toLowerCase(),
        name:        e.external_id + " — " + e.name,
        type:        "attack-pattern",
        external_id: e.external_id,
        x_mitre_id:  e.external_id.startsWith("T") ? e.external_id : null,
        description: e.description,
      })),
      ...CWE_CATALOG.map(e => ({
        id:          "attack-pattern--cwe-" + e.external_id.toLowerCase(),
        name:        e.external_id + " — " + e.name,
        type:        "attack-pattern",
        external_id: e.external_id,
        x_mitre_id:  null,
        description: e.description,
      })),
    ];
    const filtered = lower
      ? all.filter(t =>
          t.external_id.toLowerCase().includes(lower) ||
          t.name.toLowerCase().includes(lower)
        ).slice(0, 30)
      : all.slice(0, 30);
    setResults(filtered);
  }, []);

  const handleInput = (q: string) => {
    setQuery(q);
    setOpen(true);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(q), 80);
  };

  const handleFocus = () => {
    setOpen(true);
    if (!results.length) search("");
  };

  const handleSelect = (t: TechniqueResult) => {
    onSelect(t);
    setQuery("");
    setOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery("");
    setResults([]);
  };

  const INPUT: React.CSSProperties = {
    background: C.bg,
    border: `1px solid ${C.border}`,
    color: C.white,
    fontFamily: C.mono,
    fontSize: 10,
    padding: "5px 8px 5px 28px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  // Group results: ATT&CK first, then CWE
  const attackRows = results.filter(isAttack);
  const cweRows    = results.filter(t => !isAttack(t));

  return (
    <div ref={containerRef} style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 8, letterSpacing: "0.12em", color: "#9933FF", display: "block", marginBottom: 6 }}>
        MITRE ATT&CK / CWE TECHNIQUE
      </label>

      {/* Selected badge */}
      {value && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "7px 10px", marginBottom: 8,
          border: `1px solid ${isAttack(value) ? "#9933FF" : "#FFAA00"}44`,
          background: isAttack(value) ? "#9933FF11" : "#FFAA0011",
        }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
            color: isAttack(value) ? "#9933FF" : "#FFAA00",
            whiteSpace: "nowrap",
          }}>
            {tid(value) ?? "—"}
          </span>
          <span style={{
            flex: 1, fontSize: 9, color: C.white,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {rowLabel(value).name}
          </span>
          <button
            onClick={handleClear}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 2 }}
            aria-label="Clear selection"
          >
            <X size={11} />
          </button>
        </div>
      )}

      {/* Toggle: search existing vs create custom */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <button
          onClick={() => setCustomMode(false)}
          style={{
            flex: 1, fontSize: 7, letterSpacing: "0.12em", padding: "4px 0",
            border: `1px solid ${!customMode ? "#9933FF" : C.border}`,
            background: !customMode ? "#9933FF22" : "transparent",
            color: !customMode ? "#9933FF" : C.muted,
            cursor: "pointer", fontFamily: C.mono,
          }}
        >
          SEARCH EXISTING
        </button>
        <button
          onClick={() => setCustomMode(true)}
          style={{
            flex: 1, fontSize: 7, letterSpacing: "0.12em", padding: "4px 0",
            border: `1px solid ${customMode ? "#9933FF" : C.border}`,
            background: customMode ? "#9933FF22" : "transparent",
            color: customMode ? "#9933FF" : C.muted,
            cursor: "pointer", fontFamily: C.mono,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          }}
        >
          <Plus size={9} /> CREATE NEW
        </button>
      </div>

      {/* ── Custom technique form ── */}
      {customMode && (
        <div style={{ border: `1px solid #9933FF33`, background: "#9933FF08", padding: "10px 10px 8px", marginBottom: 6 }}>
          {[
            { label: "T-ID / CWE-ID (e.g. T1059.001)", key: "tid",  val: customTid,  set: setCustomTid  },
            { label: "NAME",                             key: "name", val: customName, set: setCustomName },
          ].map(({ label, key, val, set }) => (
            <div key={key} style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 7, letterSpacing: "0.12em", color: "#9933FF", display: "block", marginBottom: 3, opacity: 0.8 }}>
                {label}
              </label>
              <input
                type="text" value={val}
                onChange={e => set(e.target.value)}
                style={{ ...INPUT, padding: "4px 7px" }}
                aria-label={label}
              />
            </div>
          ))}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 7, letterSpacing: "0.12em", color: "#9933FF", display: "block", marginBottom: 3, opacity: 0.8 }}>
              DESCRIPTION (optional)
            </label>
            <textarea
              value={customDesc}
              onChange={e => setCustomDesc(e.target.value)}
              rows={2}
              style={{ ...INPUT, padding: "4px 7px", resize: "none" }}
              aria-label="Description"
            />
          </div>
          <button
            disabled={!customName && !customTid}
            onClick={() => {
              const t = buildCustomResult(customName, customTid, customDesc);
              onSelect(t);
              setCustomMode(false);
              setCustomName(""); setCustomTid(""); setCustomDesc("");
            }}
            style={{
              width: "100%", fontSize: 8, letterSpacing: "0.12em", padding: "5px 0",
              border: `1px solid #9933FF`,
              background: "#9933FF22", color: "#9933FF",
              cursor: (customName || customTid) ? "pointer" : "not-allowed",
              fontFamily: C.mono, fontWeight: 700,
              opacity: (customName || customTid) ? 1 : 0.4,
            }}
          >
            USE THIS TECHNIQUE
          </button>
        </div>
      )}

      {/* Search input (only in search mode) */}
      {!customMode && <div style={{ position: "relative" }}>
        <Search size={12} color={C.muted} style={{
          position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
          pointerEvents: "none", opacity: 0.5,
        }} />
        <input
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={handleFocus}
          placeholder="Search T-ID, name or CWE…"
          style={INPUT}
          aria-label="Search ATT&CK technique"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        {loading && (
          <span style={{
            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            fontSize: 7, color: C.muted, opacity: 0.5,
          }}>
            …
          </span>
        )}
      </div>}

      {/* Results dropdown — only in search mode */}
      {open && !customMode && (
        <div style={{
          border: `1px solid ${C.border}`,
          background: "#0a0a0a",
          maxHeight: 260, overflowY: "auto",
          zIndex: 200, position: "relative",
        }}
          role="listbox"
          aria-label="ATT&CK techniques"
        >
          {!loading && results.length === 0 && (
            <div style={{ padding: "10px 12px", fontSize: 8, color: C.muted, opacity: 0.5, letterSpacing: "0.1em" }}>
              {query ? `NO RESULTS FOR "${query}"` : "TYPE TO SEARCH"}
            </div>
          )}

          {attackRows.length > 0 && (
            <GroupHeader label="ATT&CK TECHNIQUES" color="#9933FF" C={C} />
          )}
          {attackRows.map(t => (
            <TechRow key={t.id} t={t} onSelect={handleSelect} C={C} />
          ))}

          {cweRows.length > 0 && (
            <GroupHeader label="CWE WEAKNESSES" color="#FFAA00" C={C} />
          )}
          {cweRows.map(t => (
            <TechRow key={t.id} t={t} onSelect={handleSelect} C={C} />
          ))}
        </div>
      )}

      {/* Hint */}
      <div style={{ fontSize: 7, color: C.muted, opacity: 0.45, marginTop: 4, letterSpacing: "0.08em" }}>
        {value
          ? `ID: ${value.id.slice(0, 36)}…`
          : "80 ATT&CK techniques · 30 CWEs — static catalog"}
      </div>
    </div>
  );
}

function GroupHeader({ label, color, C }: { label: string; color: string; C: import("@/lib/theme").ColorSet }) {
  return (
    <div style={{
      padding: "4px 10px 3px",
      fontSize: 7, letterSpacing: "0.16em",
      color, borderBottom: `1px solid ${C.border}33`,
      background: `${color}0a`,
    }}>
      {label}
    </div>
  );
}

function TechRow({ t, onSelect, C }: {
  t: TechniqueResult;
  onSelect: (t: TechniqueResult) => void;
  C: import("@/lib/theme").ColorSet;
}) {
  const { badge, name } = rowLabel(t);
  const attack = isAttack(t);
  const badgeColor = attack ? "#9933FF" : "#FFAA00";

  return (
    <div
      onClick={() => onSelect(t)}
      onMouseEnter={e => (e.currentTarget.style.background = C.rowHover)}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      style={{ padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "baseline", gap: 10 }}
      role="option"
      aria-selected={false}
    >
      {/* Badge */}
      <span style={{
        fontSize: 8, fontWeight: 700, letterSpacing: "0.1em",
        color: badgeColor, minWidth: 72, flexShrink: 0,
      }}>
        {badge}
      </span>
      {/* Name */}
      <span style={{
        flex: 1, fontSize: 9, color: C.white,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {name}
      </span>
    </div>
  );
}
