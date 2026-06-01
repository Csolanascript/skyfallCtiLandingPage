"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronDown, ChevronUp, Plus, Trash2, Search } from "lucide-react";
import {
  STIX_TYPES, STIX_ENUMS, OBSERVABLE_TYPES, ATTACK_CATALOG, CWE_CATALOG,
  buildPattern, getStixType,
} from "@/lib/stix-forge-types";
import type { CanvasEntity, TechniqueEntry } from "@/lib/stix-forge-types";

const R    = "#E85419";
const MONO = "'JetBrains Mono','Share Tech Mono',monospace";
const MUTED = "rgba(212,212,212,0.45)";
const BORDER = "rgba(255,255,255,0.1)";

interface Props {
  uid: string | null;
  typeId?: string;
  entities: CanvasEntity[];
  onSave: (entity: CanvasEntity) => void;
  onClose: () => void;
}

const DEFAULT_FIELDS: Record<string, unknown> = {
  valid_from:     new Date().toISOString(),
  published:      new Date().toISOString(),
  first_seen:     new Date().toISOString(),
  confidence:     70,
  is_family:      false,
  pattern_type:   "stix",
  identity_class: "individual",
  infrastructure_types: [],
};

// ─── ATT&CK / CWE search picker ──────────────────────────────────────────────
function TechniquePicker({
  value, onSelect,
}: {
  value: TechniqueEntry | null;
  onSelect: (t: TechniqueEntry | null) => void;
}) {
  const [query,      setQuery]      = useState("");
  const [open,       setOpen]       = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customId,   setCustomId]   = useState("");
  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const q = query.toLowerCase();
  const allEntries = [...ATTACK_CATALOG, ...CWE_CATALOG];
  const filtered = q.length < 1
    ? allEntries.slice(0, 40)
    : allEntries.filter(
        (t) =>
          t.external_id.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q)
      ).slice(0, 40);

  const attackRows = filtered.filter((t) => t.external_id.startsWith("T"));
  const cweRows    = filtered.filter((t) => t.external_id.startsWith("CWE"));

  const INPUT: React.CSSProperties = {
    background: "#000", border: `1px solid ${BORDER}`,
    color: "#E2E2E2", fontFamily: MONO, fontSize: 10,
    padding: "5px 8px", outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    <div ref={containerRef} style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 8, letterSpacing: "0.12em", color: "#9933FF", display: "block", marginBottom: 6 }}>
        MITRE ATT&amp;CK / CWE TECHNIQUE
      </label>

      {value && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", marginBottom: 8,
          border: `1px solid ${value.external_id.startsWith("T") ? "#9933FF" : "#FFAA00"}44`,
          background: value.external_id.startsWith("T") ? "#9933FF11" : "#FFAA0011",
        }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
            color: value.external_id.startsWith("T") ? "#9933FF" : "#FFAA00",
            whiteSpace: "nowrap", minWidth: 72,
          }}>
            {value.external_id}
          </span>
          <span style={{ flex: 1, fontSize: 9, color: "#E2E2E2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {value.name}
          </span>
          <button
            onClick={() => onSelect(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 2 }}
          >
            <X size={11} />
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {[
          { label: "SEARCH", active: !customMode, onClick: () => setCustomMode(false) },
          { label: "+ CUSTOM", active: customMode, onClick: () => setCustomMode(true) },
        ].map(({ label, active, onClick }) => (
          <button key={label} onClick={onClick} style={{
            flex: 1, fontSize: 7, letterSpacing: "0.12em", padding: "4px 0",
            border: `1px solid ${active ? "#9933FF" : BORDER}`,
            background: active ? "#9933FF22" : "transparent",
            color: active ? "#9933FF" : MUTED,
            cursor: "pointer", fontFamily: MONO,
          }}>
            {label}
          </button>
        ))}
      </div>

      {customMode ? (
        <div style={{ border: "1px solid #9933FF33", background: "#9933FF08", padding: "10px 10px 8px" }}>
          {[
            { label: "T-ID / CWE-ID (e.g. T1059.001 or CWE-79)", key: "id",   val: customId,   set: setCustomId },
            { label: "NAME",                                       key: "name", val: customName, set: setCustomName },
          ].map(({ label, key, val, set }) => (
            <div key={key} style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 7, letterSpacing: "0.12em", color: "#9933FF", display: "block", marginBottom: 3, opacity: 0.8 }}>
                {label}
              </label>
              <input
                type="text" value={val} onChange={(e) => set(e.target.value)}
                style={{ ...INPUT, padding: "4px 7px" }}
              />
            </div>
          ))}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 7, letterSpacing: "0.12em", color: "#9933FF", display: "block", marginBottom: 3, opacity: 0.8 }}>
              DESCRIPTION (optional)
            </label>
            <textarea
              value={customDesc} onChange={(e) => setCustomDesc(e.target.value)}
              rows={2}
              style={{ ...INPUT, padding: "4px 7px", resize: "none" }}
            />
          </div>
          <button
            disabled={!customName && !customId}
            onClick={() => {
              if (!customName && !customId) return;
              onSelect({ external_id: customId || "CUSTOM", name: customName || customId, description: customDesc });
              setCustomMode(false); setCustomId(""); setCustomName(""); setCustomDesc("");
            }}
            style={{
              width: "100%", fontSize: 8, letterSpacing: "0.12em", padding: "5px 0",
              border: "1px solid #9933FF", background: "#9933FF22", color: "#9933FF",
              cursor: (customName || customId) ? "pointer" : "not-allowed",
              fontFamily: MONO, fontWeight: 700,
              opacity: (customName || customId) ? 1 : 0.4,
            }}
          >
            USE THIS TECHNIQUE
          </button>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <Search size={12} color={MUTED} style={{
            position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
            pointerEvents: "none", opacity: 0.5,
          }} />
          <input
            type="text" value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search technique name or T-ID / CWE-ID…"
            style={{ ...INPUT, padding: "5px 8px 5px 28px" }}
          />
        </div>
      )}

      {open && !customMode && (
        <div style={{
          border: `1px solid ${BORDER}`, background: "#080808",
          maxHeight: 260, overflowY: "auto", position: "relative", zIndex: 200,
        }}>
          {filtered.length === 0 && (
            <div style={{ padding: "10px 12px", fontSize: 8, color: MUTED, opacity: 0.6, letterSpacing: "0.1em" }}>
              NO RESULTS FOR &ldquo;{query}&rdquo;
            </div>
          )}
          {attackRows.length > 0 && <GroupHeader label="ATT&CK TECHNIQUES" color="#9933FF" />}
          {attackRows.map((t) => (
            <TechRow key={t.external_id} t={t} onSelect={(t) => { onSelect(t); setOpen(false); setQuery(""); }} />
          ))}
          {cweRows.length > 0 && <GroupHeader label="CWE WEAKNESSES" color="#FFAA00" />}
          {cweRows.map((t) => (
            <TechRow key={t.external_id} t={t} color="#FFAA00" onSelect={(t) => { onSelect(t); setOpen(false); setQuery(""); }} />
          ))}
        </div>
      )}

      <div style={{ fontSize: 7, color: MUTED, opacity: 0.4, marginTop: 4, letterSpacing: "0.08em" }}>
        {value
          ? `Selected: ${value.external_id} — ${value.name.slice(0, 50)}`
          : "80 ATT&CK techniques · 30 CWE weaknesses — static catalog, no DB needed"}
      </div>
    </div>
  );
}

function GroupHeader({ label, color }: { label: string; color: string }) {
  return (
    <div style={{
      padding: "4px 10px 3px", fontSize: 7, letterSpacing: "0.16em",
      color, borderBottom: "1px solid rgba(255,255,255,0.05)",
      background: `${color}0a`, fontFamily: MONO,
    }}>
      {label}
    </div>
  );
}

function TechRow({ t, color = "#9933FF", onSelect }: { t: TechniqueEntry; color?: string; onSelect: (t: TechniqueEntry) => void }) {
  return (
    <div
      onClick={() => onSelect(t)}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      style={{ padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "baseline", gap: 10, fontFamily: MONO }}
      role="option" aria-selected={false}
    >
      <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", color, minWidth: 80, flexShrink: 0 }}>
        {t.external_id}
      </span>
      <span style={{ flex: 1, fontSize: 9, color: "#D4D4D4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {t.name}
      </span>
    </div>
  );
}

// ─── Indicator Pattern Builder ────────────────────────────────────────────────
function PatternBuilder({ value, onChange }: { value: string; onChange: (p: string) => void }) {
  const [obsType, setObsType] = useState("ipv4-addr");
  const [obsVal,  setObsVal]  = useState("");

  const INPUT: React.CSSProperties = {
    background: "#000", border: `1px solid ${BORDER}`,
    color: "#E2E2E2", fontFamily: MONO, fontSize: 10,
    padding: "5px 8px", outline: "none", width: "100%", boxSizing: "border-box",
  };
  const obs = OBSERVABLE_TYPES.find((o) => o.id === obsType);

  const handleGenerate = () => {
    if (!obsVal) return;
    onChange(buildPattern(obsType, obsVal));
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 8, letterSpacing: "0.12em", color: R, display: "block", marginBottom: 6 }}>
        PATTERN <span style={{ color: "#FF4444" }}>*</span>
      </label>

      <div style={{ border: `1px solid ${R}33`, background: `${R}08`, padding: "10px 10px 8px", marginBottom: 6 }}>
        <div style={{ fontSize: 7, letterSpacing: "0.14em", color: R, opacity: 0.7, marginBottom: 8 }}>
          BUILDER — choose observable type and value
        </div>
        <select
          value={obsType}
          onChange={(e) => setObsType(e.target.value)}
          style={{ ...INPUT, marginBottom: 6 }}
        >
          {OBSERVABLE_TYPES.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
        <input
          type="text" value={obsVal}
          onChange={(e) => setObsVal(e.target.value)}
          placeholder={obs?.placeholder ?? "value"}
          style={{ ...INPUT, marginBottom: 6 }}
          onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
        />
        <button
          onClick={handleGenerate}
          style={{
            fontSize: 8, letterSpacing: "0.14em", padding: "4px 12px",
            border: `1px solid ${R}`, background: `${R}22`, color: R,
            cursor: "pointer", fontFamily: MONO, fontWeight: 700,
          }}
        >
          GENERATE PATTERN
        </button>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder="[ipv4-addr:value = '1.2.3.4']"
        style={{ ...INPUT, resize: "vertical" }}
        aria-label="STIX pattern"
      />
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export default function EntityFormModal({ uid, typeId, entities, onSave, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  const existing      = uid ? entities.find((e) => e.uid === uid) ?? null : null;
  const resolvedType  = existing?.type ?? typeId ?? "indicator";
  const typeEntry     = getStixType(resolvedType);

  const [formData,     setFormData]     = useState<Record<string, unknown>>(
    existing ? { ...DEFAULT_FIELDS, ...existing.data } : { ...DEFAULT_FIELDS }
  );
  const [showOptional, setShowOptional] = useState(false);
  const [hashPairs,    setHashPairs]    = useState<{ algo: string; val: string }[]>([]);
  const [technique,    setTechnique]    = useState<TechniqueEntry | null>(null);

  useEffect(() => {
    if (existing?.data.hashes) {
      const h = existing.data.hashes as Record<string, string>;
      setHashPairs(Object.entries(h).map(([algo, val]) => ({ algo, val })));
    }
  }, [existing?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Slide-in animation
  useEffect(() => {
    if (!panelRef.current) return;
    panelRef.current.style.transform = "translateX(30px)";
    panelRef.current.style.opacity = "0";
    requestAnimationFrame(() => {
      if (!panelRef.current) return;
      panelRef.current.style.transition = "transform 0.25s ease, opacity 0.25s ease";
      panelRef.current.style.transform = "translateX(0)";
      panelRef.current.style.opacity = "1";
    });
  }, []);

  const handleClose = useCallback(() => {
    if (!panelRef.current) { onClose(); return; }
    panelRef.current.style.transition = "transform 0.18s ease, opacity 0.18s ease";
    panelRef.current.style.transform = "translateX(30px)";
    panelRef.current.style.opacity = "0";
    setTimeout(onClose, 180);
  }, [onClose]);

  const set = (key: string, value: unknown) => setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const data = { ...formData };
    if (hashPairs.length > 0) {
      const h: Record<string, string> = {};
      for (const { algo, val } of hashPairs) { if (algo && val) h[algo] = val; }
      data.hashes = h;
    }

    if (existing) {
      const name = (data.name as string) || (data.value as string) || undefined;
      onSave({ ...existing, name, data });
    } else {
      const name = (data.name as string) || (data.value as string) || undefined;
      onSave({
        uid:   crypto.randomUUID(),
        type:  resolvedType,
        label: typeEntry?.label ?? resolvedType,
        name,
        data,
        x: 80 + Math.random() * 260,
        y: 60 + Math.random() * 180,
      });
    }
    handleClose();
  };

  if (!typeEntry) return null;

  const color = typeEntry.color;

  const INPUT: React.CSSProperties = {
    background: "#000", border: `1px solid ${BORDER}`,
    color: "#E2E2E2", fontFamily: MONO, fontSize: 10,
    padding: "5px 8px", outline: "none", width: "100%", boxSizing: "border-box",
  };

  const renderField = (field: string, required = false) => {
    const val = formData[field];

    if (field === "pattern") {
      return (
        <PatternBuilder
          key={field}
          value={(val as string) ?? ""}
          onChange={(p) => { set("pattern", p); if (!formData.pattern_type) set("pattern_type", "stix"); }}
        />
      );
    }

    // Enum chip selects
    const enumKey = field as keyof typeof STIX_ENUMS;
    if (STIX_ENUMS[enumKey]) {
      const selected: string[] = Array.isArray(val) ? (val as string[]) : [];
      return (
        <div key={field} style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 8, letterSpacing: "0.12em", color: R, display: "block", marginBottom: 4 }}>
            {field.replace(/_/g, " ").toUpperCase()}
            {required && <span style={{ color: "#FF4444", marginLeft: 4 }}>*</span>}
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {STIX_ENUMS[enumKey].map((opt) => {
              const active = selected.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => {
                    const next = active ? selected.filter((s) => s !== opt) : [...selected, opt];
                    set(field, next);
                  }}
                  style={{
                    fontSize: 7, letterSpacing: "0.1em", padding: "3px 7px",
                    border: `1px solid ${active ? color : BORDER}`,
                    background: active ? `${color}22` : "transparent",
                    color: active ? color : MUTED,
                    cursor: "pointer", fontFamily: MONO,
                  }}
                  aria-pressed={active}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // Boolean toggle
    if (field === "is_family") {
      return (
        <div key={field} style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 8, letterSpacing: "0.12em", color: R }}>
            IS FAMILY{required && <span style={{ color: "#FF4444", marginLeft: 4 }}>*</span>}
          </label>
          <button
            onClick={() => set("is_family", !val)}
            style={{
              fontSize: 7, padding: "3px 10px",
              border: `1px solid ${val ? color : BORDER}`,
              background: val ? `${color}22` : "transparent",
              color: val ? color : MUTED,
              cursor: "pointer", fontFamily: MONO, letterSpacing: "0.1em",
            }}
            aria-pressed={!!val}
          >
            {val ? "YES" : "NO"}
          </button>
        </div>
      );
    }

    // Date fields
    if (field.includes("_at") || field.includes("_seen") || field === "valid_from" || field === "valid_until" || field === "published") {
      return (
        <div key={field} style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 8, letterSpacing: "0.12em", color: R, display: "block", marginBottom: 4 }}>
            {field.replace(/_/g, " ").toUpperCase()}
            {required && <span style={{ color: "#FF4444", marginLeft: 4 }}>*</span>}
          </label>
          <input
            type="datetime-local"
            value={((val as string) ?? "").replace("Z", "")}
            onChange={(e) => set(field, e.target.value ? e.target.value + "Z" : "")}
            style={INPUT}
            aria-label={field}
          />
        </div>
      );
    }

    // Confidence slider
    if (field === "confidence") {
      return (
        <div key={field} style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 8, letterSpacing: "0.12em", color: R, display: "block", marginBottom: 4 }}>
            CONFIDENCE — {(val as number | undefined) ?? 70}
          </label>
          <input
            type="range" min={0} max={100}
            value={(val as number) ?? 70}
            onChange={(e) => set("confidence", Number(e.target.value))}
            style={{ width: "100%", accentColor: color }}
            aria-label="confidence"
          />
        </div>
      );
    }

    // Default text / textarea
    const isLong = ["description", "goals", "objective", "contact_information"].includes(field);
    return (
      <div key={field} style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 8, letterSpacing: "0.12em", color: R, display: "block", marginBottom: 4 }}>
          {field.replace(/_/g, " ").toUpperCase()}
          {required && <span style={{ color: "#FF4444", marginLeft: 4 }}>*</span>}
        </label>
        {isLong ? (
          <textarea
            value={(val as string) ?? ""}
            onChange={(e) => set(field, e.target.value)}
            rows={3}
            style={{ ...INPUT, resize: "vertical" }}
            aria-label={field}
          />
        ) : (
          <input
            type="text"
            value={(val as string) ?? ""}
            onChange={(e) => set(field, e.target.value)}
            style={INPUT}
            aria-label={field}
          />
        )}
      </div>
    );
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "flex-end",
      }}
      role="dialog" aria-modal aria-label={`Edit ${typeEntry.label}`}
    >
      <div
        ref={panelRef}
        style={{
          width: 360, height: "100%", overflowY: "auto",
          background: "#050505",
          borderLeft: `1px solid ${color}44`,
          padding: "16px 18px",
          display: "flex", flexDirection: "column",
          fontFamily: MONO, position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8, letterSpacing: "0.22em", color }}>▶ {typeEntry.label.toUpperCase()}</div>
            <div style={{ fontSize: 7, color: MUTED, opacity: 0.6, marginTop: 2 }}>
              {uid ? "EDIT ENTITY" : "NEW ENTITY"}
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 4 }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* ATT&CK / CWE picker for attack-pattern */}
        {resolvedType === "attack-pattern" && (
          <div style={{ marginBottom: 16 }}>
            <TechniquePicker
              value={technique}
              onSelect={(t) => {
                setTechnique(t);
                if (t) {
                  setFormData((prev) => ({
                    ...prev,
                    name:        t.name,
                    x_mitre_id:  t.external_id.startsWith("T") ? t.external_id : undefined,
                    external_id: t.external_id,
                    ...(t.description ? { description: t.description } : {}),
                  }));
                }
              }}
            />
            <div style={{
              fontSize: 8, letterSpacing: "0.14em", color,
              opacity: 0.7, borderTop: `1px solid ${color}22`, paddingTop: 10, marginBottom: 2,
            }}>
              FIELDS (auto-filled · editable)
            </div>
          </div>
        )}

        {/* Required fields */}
        <div style={{ fontSize: 8, letterSpacing: "0.14em", color, marginBottom: 10, opacity: 0.7, flexShrink: 0 }}>
          REQUIRED
        </div>
        {typeEntry.required.map((f) => renderField(f, true))}

        {/* Hash pairs for certificate */}
        {(resolvedType === "x509-certificate" || resolvedType === "file") && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 8, letterSpacing: "0.12em", color: R, display: "block", marginBottom: 6 }}>
              HASHES
            </label>
            {hashPairs.map((hp, i) => (
              <div key={i} style={{ display: "flex", gap: 4, marginBottom: 4, alignItems: "center" }}>
                <select
                  value={hp.algo}
                  onChange={(e) => {
                    const next = [...hashPairs];
                    next[i] = { ...hp, algo: e.target.value };
                    setHashPairs(next);
                  }}
                  style={{ ...INPUT, width: 90 }}
                >
                  {["MD5", "SHA-1", "SHA-256", "SHA-512"].map((a) => <option key={a}>{a}</option>)}
                </select>
                <input
                  type="text" value={hp.val}
                  onChange={(e) => {
                    const next = [...hashPairs];
                    next[i] = { ...hp, val: e.target.value };
                    setHashPairs(next);
                  }}
                  style={{ ...INPUT, flex: 1 }}
                  placeholder="hash value"
                />
                <button
                  onClick={() => setHashPairs(hashPairs.filter((_, j) => j !== i))}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#FF4444", padding: 4 }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setHashPairs([...hashPairs, { algo: "SHA-256", val: "" }])}
              style={{
                fontSize: 7, padding: "3px 8px",
                border: `1px solid ${BORDER}`, background: "transparent",
                color: MUTED, cursor: "pointer", fontFamily: MONO,
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              <Plus size={9} /> ADD HASH
            </button>
          </div>
        )}

        {/* Optional fields (collapsible) */}
        {typeEntry.optional.length > 0 && (
          <>
            <button
              onClick={() => setShowOptional(!showOptional)}
              style={{
                background: "none", border: `1px solid ${BORDER}`,
                color: MUTED, fontFamily: MONO, cursor: "pointer",
                fontSize: 8, letterSpacing: "0.14em",
                padding: "5px 10px", marginBottom: showOptional ? 12 : 0,
                display: "flex", alignItems: "center", gap: 6, width: "100%",
                flexShrink: 0,
              }}
              aria-expanded={showOptional}
            >
              {showOptional ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              OPTIONAL FIELDS ({typeEntry.optional.length})
            </button>
            {showOptional && typeEntry.optional.map((f) => renderField(f, false))}
          </>
        )}

        {/* Demo disclaimer */}
        <div style={{
          marginTop: 16, padding: "8px 10px",
          border: "1px solid rgba(232,84,25,0.15)",
          background: "rgba(232,84,25,0.04)",
          fontSize: 7, color: MUTED, letterSpacing: "0.1em", flexShrink: 0,
        }}>
          ▶ DEMO MODE — bundle stays local · no DB write
        </div>

        {/* Footer */}
        <div style={{ marginTop: "auto", paddingTop: 16, display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
          <button
            onClick={handleClose}
            style={{
              fontSize: 9, letterSpacing: "0.14em", padding: "6px 16px",
              border: `1px solid ${BORDER}`, background: "transparent",
              color: MUTED, cursor: "pointer", fontFamily: MONO,
            }}
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            style={{
              fontSize: 9, letterSpacing: "0.14em", padding: "6px 20px",
              border: `1px solid ${color}`, background: `${color}22`, color,
              cursor: "pointer", fontFamily: MONO, fontWeight: 700,
            }}
          >
            {uid ? "SAVE" : "ADD TO CANVAS"}
          </button>
        </div>
      </div>
    </div>
  );
}
