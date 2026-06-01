"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { X, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { getStixType, STIX_ENUMS } from "@/lib/stix-types";
import type { CanvasEntity } from "@/lib/stix-types";
import { useForge } from "./ForgeLayout";
import PatternBuilder from "./PatternBuilder";
import EntityPicker from "./EntityPicker";
import type { LocationPickResult } from "./LocationMapPicker";
import MitreTechniquePicker from "./MitreTechniquePicker";
import type { TechniqueResult } from "./MitreTechniquePicker";

// Leaflet is browser-only — dynamic import with no SSR
const LocationMapPicker = dynamic(() => import("./LocationMapPicker"), { ssr: false });

interface Props {
  uid: string | null;       // null = creating a new entity with typeId
  typeId?: string;
  onClose: () => void;
}

export default function EntityFormModal({ uid, typeId, onClose }: Props) {
  const { C, entities, addEntity, updateEntity } = useForge();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);

  const existing  = uid ? entities.find((e) => e.uid === uid) : null;
  const resolvedType = existing?.type ?? typeId ?? "indicator";
  const typeEntry  = getStixType(resolvedType);

  const todayISO = new Date().toISOString();

  // Sensible defaults per field — used when creating a new entity
  const DEFAULT_FIELDS: Record<string, unknown> = {
    valid_from:   todayISO,
    published:    todayISO,
    first_seen:   todayISO,
    confidence:   70,
    is_family:    false,
    pattern_type: "stix",
    identity_class: "individual",
    infrastructure_types: [],
  };

  const [formData,        setFormData]        = useState<Record<string, unknown>>(
    existing ? {} : { ...DEFAULT_FIELDS }
  );
  const [showOptional,    setShowOptional]    = useState(false);
  const [hashPairs,       setHashPairs]       = useState<{ algo: string; val: string }[]>([]);
  const [loadingEntity] = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState<TechniqueResult | null>(null);

  // Load existing entity data
  useEffect(() => {
    if (existing) {
      setFormData({ ...DEFAULT_FIELDS, ...existing.data });
      const hashes = existing.data.hashes as Record<string, string> | undefined;
      if (hashes) {
        setHashPairs(Object.entries(hashes).map(([algo, val]) => ({ algo, val })));
      }
    }
  }, [existing?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Entry animation
  useGSAP(() => {
    if (!panelRef.current) return;
    gsap.fromTo(panelRef.current,
      { opacity: 0, x: 30 },
      { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" },
    );
  }, { scope: panelRef });

  const handleClose = useCallback(() => {
    if (!panelRef.current) { onClose(); return; }
    gsap.to(panelRef.current, {
      opacity: 0, x: 30, duration: 0.2, ease: "power2.in",
      onComplete: onClose,
    });
  }, [onClose]);

  const set = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const data = { ...formData };
    // Merge hash pairs back into hashes object
    if (hashPairs.length > 0) {
      const hashes: Record<string, string> = {};
      for (const { algo, val } of hashPairs) {
        if (algo && val) hashes[algo] = val;
      }
      data.hashes = hashes;
    }

    if (uid && existing) {
      const name = (data.name as string) || (data.value as string) || undefined;
      updateEntity(uid, { data, name });
    } else {
      const newUid = crypto.randomUUID();
      const name = (data.name as string) || (data.value as string) || undefined;
      const entity: CanvasEntity = {
        uid: newUid,
        type: resolvedType,
        label: typeEntry?.label ?? resolvedType,
        name,
        data,
        x: 120 + Math.random() * 300,
        y: 80  + Math.random() * 200,
      };
      addEntity(entity);
    }
    handleClose();
  };

  if (!typeEntry) return null;

  const INPUT: React.CSSProperties = {
    background: C.bg,
    border: `1px solid ${C.border}`,
    color: C.white,
    fontFamily: C.mono,
    fontSize: 10,
    padding: "5px 8px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const renderField = (field: string, required = false) => {
    const val = formData[field];

    // pattern → PatternBuilder
    if (field === "pattern") {
      return (
        <div key={field} style={{ marginBottom: 12 }}>
          <PatternBuilder
            value={(val as string) ?? ""}
            onChange={(p) => { set("pattern", p); if (!formData.pattern_type) set("pattern_type", "stix"); }}
          />
        </div>
      );
    }

    // Fields that are references to other entities
    const REF_FIELDS: Record<string, string> = {
      sighting_of_ref: "indicator",
      created_by_ref: "identity",
    };
    if (field in REF_FIELDS) {
      return (
        <div key={field} style={{ marginBottom: 12 }}>
          <EntityPicker
            stixType={REF_FIELDS[field]}
            label={field.replace(/_/g, " ").toUpperCase()}
            value={val as string | undefined}
            onChange={(id) => set(field, id)}
          />
        </div>
      );
    }

    // Enum fields → ChipSelect
    const enumKey = field as keyof typeof STIX_ENUMS;
    if (STIX_ENUMS[enumKey]) {
      const selected: string[] = Array.isArray(val) ? (val as string[]) : [];
      return (
        <div key={field} style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 8, letterSpacing: "0.12em", color: C.red, display: "block", marginBottom: 4 }}>
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
                    border: `1px solid ${active ? typeEntry.color : C.border}`,
                    background: active ? `${typeEntry.color}22` : "transparent",
                    color: active ? typeEntry.color : C.muted,
                    cursor: "pointer", fontFamily: C.mono,
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

    // Boolean fields
    if (field === "is_family") {
      return (
        <div key={field} style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 8, letterSpacing: "0.12em", color: C.red }}>
            IS FAMILY
            {required && <span style={{ color: "#FF4444", marginLeft: 4 }}>*</span>}
          </label>
          <button
            onClick={() => set("is_family", !(val as boolean))}
            style={{
              fontSize: 7, padding: "3px 10px",
              border: `1px solid ${val ? typeEntry.color : C.border}`,
              background: val ? `${typeEntry.color}22` : "transparent",
              color: val ? typeEntry.color : C.muted,
              cursor: "pointer", fontFamily: C.mono, letterSpacing: "0.1em",
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
          <label style={{ fontSize: 8, letterSpacing: "0.12em", color: C.red, display: "block", marginBottom: 4 }}>
            {field.replace(/_/g, " ").toUpperCase()}
            {required && <span style={{ color: "#FF4444", marginLeft: 4 }}>*</span>}
          </label>
          <input
            type="datetime-local"
            value={(val as string ?? "").replace("Z", "")}
            onChange={(e) => set(field, e.target.value ? e.target.value + "Z" : "")}
            style={INPUT}
            aria-label={field}
          />
        </div>
      );
    }

    // Confidence 0-100 slider
    if (field === "confidence") {
      return (
        <div key={field} style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 8, letterSpacing: "0.12em", color: C.red, display: "block", marginBottom: 4 }}>
            CONFIDENCE — {(val as number | undefined) ?? 70}
          </label>
          <input
            type="range" min={0} max={100}
            value={(val as number) ?? 70}
            onChange={(e) => set("confidence", Number(e.target.value))}
            style={{ width: "100%", accentColor: typeEntry.color }}
            aria-label="confidence"
          />
        </div>
      );
    }

    // Lat/lon → number input (auto-filled by map, still editable)
    if (field === "latitude" || field === "longitude") {
      return (
        <div key={field} style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 8, letterSpacing: "0.12em", color: C.red, display: "block", marginBottom: 4 }}>
            {field.toUpperCase()}
          </label>
          <input
            type="number"
            step="0.00001"
            min={field === "latitude" ? -90 : -180}
            max={field === "latitude" ? 90 : 180}
            value={(val as number | undefined) ?? ""}
            onChange={(e) => set(field, e.target.value === "" ? undefined : parseFloat(e.target.value))}
            style={INPUT}
            aria-label={field}
          />
        </div>
      );
    }

    // Default text/textarea
    const isLong = field === "description" || field === "goals" || field === "objective";
    return (
      <div key={field} style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 8, letterSpacing: "0.12em", color: C.red, display: "block", marginBottom: 4 }}>
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

  const color = typeEntry.color;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.65)",
        display: "flex", alignItems: "center", justifyContent: "flex-end",
      }}
      role="dialog"
      aria-modal
      aria-label={`Edit ${typeEntry.label}`}
    >
      <div
        ref={panelRef}
        style={{
          width: 360, height: "100%", overflowY: "auto",
          background: C.bg,
          borderLeft: `1px solid ${color}55`,
          padding: "16px 18px",
          display: "flex", flexDirection: "column", gap: 0,
          position: "relative",
          fontFamily: C.mono,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8, letterSpacing: "0.2em", color }}>▶ {typeEntry.label.toUpperCase()}</div>
            <div style={{ fontSize: 7, color: C.muted, opacity: 0.6, marginTop: 2 }}>
              {uid ? "EDIT ENTITY" : "NEW ENTITY"}
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 4 }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {loadingEntity ? (
          <div style={{ color: C.muted, fontSize: 9, opacity: 0.6 }}>LOADING…</div>
        ) : (
          <>
            {/* ── ATT&CK / CWE picker for technique type ── */}
            {resolvedType === "attack-pattern" && (
              <div style={{ marginBottom: 16 }}>
                <MitreTechniquePicker
                  value={selectedTechnique}
                  onSelect={(t) => {
                    setSelectedTechnique(t);
                    if (t) {
                      setFormData((prev) => ({
                        ...prev,
                        name:        t.name,
                        x_mitre_id:  t.x_mitre_id  ?? t.external_id ?? undefined,
                        external_id: t.external_id ?? t.x_mitre_id  ?? undefined,
                        ...(t.description ? { description: t.description } : {}),
                      }));
                    } else {
                      setFormData((prev) => {
                        const next = { ...prev };
                        delete next.x_mitre_id;
                        delete next.external_id;
                        return next;
                      });
                    }
                  }}
                />
                <div style={{
                  fontSize: 8, letterSpacing: "0.14em", color,
                  opacity: 0.7, borderTop: `1px solid ${color}22`, paddingTop: 10,
                }}>
                  FIELDS (auto-filled · editable)
                </div>
              </div>
            )}

            {/* ── Interactive map for location type ── */}
            {resolvedType === "location" && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 8, letterSpacing: "0.14em", color, marginBottom: 8, opacity: 0.7 }}>
                  PICK ON MAP
                </div>
                <LocationMapPicker
                  accentColor={color}
                  lat={formData.latitude as number | undefined}
                  lon={formData.longitude as number | undefined}
                  onSelect={(data: LocationPickResult) => {
                    setFormData((prev) => ({
                      ...prev,
                      latitude:  data.latitude,
                      longitude: data.longitude,
                      ...(data.country      && { country:            data.country }),
                      ...(data.country_code && { country_code:       data.country_code }),
                      ...(data.city         && { city:               data.city }),
                      ...(data.administrative_area && { administrative_area: data.administrative_area }),
                      ...(data.region       && { region:             data.region }),
                      // Only set name if not already typed by user
                      ...(!prev.name && data.name && { name: data.name }),
                    }));
                  }}
                />
                <div style={{
                  marginTop: 10, fontSize: 8, letterSpacing: "0.14em",
                  color, opacity: 0.7, borderTop: `1px solid ${color}22`, paddingTop: 10,
                }}>
                  FIELDS (auto-filled · editable)
                </div>
              </div>
            )}

            {/* Required fields */}
            <div style={{ fontSize: 8, letterSpacing: "0.14em", color, marginBottom: 10, opacity: 0.7 }}>
              {resolvedType !== "location" ? "REQUIRED" : ""}
            </div>
            {typeEntry.required.map((f) => renderField(f, true))}

            {/* Hash pairs for file/certificate */}
            {(resolvedType === "file" || resolvedType === "x509-certificate") && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 8, letterSpacing: "0.12em", color: C.red, display: "block", marginBottom: 6 }}>
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
                      aria-label="Hash algorithm"
                    >
                      {["MD5","SHA-1","SHA-256","SHA-512"].map((a) => <option key={a} value={a}>{a}</option>)}
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
                      aria-label="Hash value"
                    />
                    <button
                      onClick={() => setHashPairs(hashPairs.filter((_, j) => j !== i))}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#FF4444", padding: 4 }}
                      aria-label="Remove hash"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setHashPairs([...hashPairs, { algo: "SHA-256", val: "" }])}
                  style={{
                    fontSize: 7, padding: "3px 8px",
                    border: `1px solid ${C.border}`,
                    background: "transparent", color: C.muted,
                    cursor: "pointer", fontFamily: C.mono, display: "flex", alignItems: "center", gap: 4,
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
                    background: "none", border: `1px solid ${C.border}`,
                    color: C.muted, fontFamily: C.mono, cursor: "pointer",
                    fontSize: 8, letterSpacing: "0.14em",
                    padding: "5px 10px", marginBottom: showOptional ? 12 : 0,
                    display: "flex", alignItems: "center", gap: 6,
                    width: "100%",
                  }}
                  aria-expanded={showOptional}
                >
                  {showOptional ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  OPTIONAL FIELDS ({typeEntry.optional.length})
                </button>
                {showOptional && typeEntry.optional.map((f) => renderField(f, false))}
              </>
            )}
          </>
        )}

        {/* Footer */}
        <div style={{ marginTop: "auto", paddingTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={handleClose}
            style={{
              fontSize: 9, letterSpacing: "0.14em", padding: "6px 16px",
              border: `1px solid ${C.border}`, background: "transparent",
              color: C.muted, cursor: "pointer", fontFamily: C.mono,
            }}
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            style={{
              fontSize: 9, letterSpacing: "0.14em", padding: "6px 20px",
              border: `1px solid ${color}`,
              background: `${color}22`, color,
              cursor: "pointer", fontFamily: C.mono, fontWeight: 700,
            }}
          >
            {uid ? "SAVE" : "ADD TO CANVAS"}
          </button>
        </div>
      </div>
    </div>
  );
}
