"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { useForge } from "./ForgeLayout";

interface PickerResult {
  id: string;
  name: string;
  type: string;
  labels: string[];
}

interface Props {
  stixType: string;       // Filter results to this STIX type
  value?: string;         // Current stix ID
  label?: string;         // Field label
  onChange: (stixId: string | null) => void;
  onCreateNew?: () => void; // Opens sub-form for creating a new entity
}

export default function EntityPicker({ stixType, value, label, onChange, onCreateNew }: Props) {
  const { C } = useForge();
  const [query,    setQuery]   = useState("");
  const [results,  setResults] = useState<PickerResult[]>([]);
  const [loading] = useState(false);
  const [open,     setOpen]    = useState(false);
  const [selected, setSelected] = useState<PickerResult | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // No backend in landing — EntityPicker searches canvas entities via ForgeCtx
  const { entities } = useForge();
  const search = useCallback((q: string) => {
    const lower = q.toLowerCase();
    const hits = entities
      .filter(e => e.type === stixType)
      .filter(e => !lower || (e.name ?? "").toLowerCase().includes(lower))
      .slice(0, 12)
      .map(e => ({ id: e.stixId ?? e.uid, name: e.name ?? e.label, type: e.type, labels: [] }));
    setResults(hits);
  }, [entities, stixType]);

  const handleInputChange = (q: string) => {
    setQuery(q);
    setOpen(true);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(q), 280);
  };

  const handleFocus = () => {
    setOpen(true);
    if (!results.length) search("");
  };

  const handleSelect = (r: PickerResult) => {
    setSelected(r);
    setQuery(r.name ?? r.id);
    setOpen(false);
    onChange(r.id);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery("");
    onChange(null);
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

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {label && (
        <label style={{ fontSize: 8, letterSpacing: "0.12em", color: C.red, display: "block", marginBottom: 4 }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <Search size={12} color={C.muted} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.5 }} />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={`Search ${stixType}…`}
          style={INPUT}
          aria-label={`Search ${stixType}`}
          aria-expanded={open}
          aria-autocomplete="list"
        />
        {selected && (
          <button
            onClick={handleClear}
            style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 10, padding: 2 }}
            aria-label="Clear selection"
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 200,
          background: "#0a0a0a",
          border: `1px solid ${C.border}`,
          maxHeight: 200, overflowY: "auto",
        }}>
          {/* Create new option */}
          {onCreateNew && (
            <div
              onClick={() => { setOpen(false); onCreateNew(); }}
              style={{
                padding: "7px 10px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                borderBottom: `1px solid ${C.border}`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.rowHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              role="option"
              aria-selected={false}
            >
              <Plus size={10} color={C.red} />
              <span style={{ fontSize: 9, color: C.red, letterSpacing: "0.1em" }}>
                CREATE NEW {stixType.toUpperCase()}
              </span>
            </div>
          )}

          {loading && (
            <div style={{ padding: "8px 10px", fontSize: 9, color: C.muted, opacity: 0.6 }}>
              SEARCHING…
            </div>
          )}

          {!loading && results.length === 0 && query && (
            <div style={{ padding: "8px 10px", fontSize: 9, color: C.muted, opacity: 0.5 }}>
              NO RESULTS FOR "{query}"
            </div>
          )}

          {results.map((r) => (
            <div
              key={r.id}
              onClick={() => handleSelect(r)}
              style={{ padding: "6px 10px", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.rowHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              role="option"
              aria-selected={r.id === value}
            >
              <div style={{ fontSize: 9, color: C.white }}>{r.name ?? r.id}</div>
              <div style={{ fontSize: 7, color: C.muted, opacity: 0.6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.id}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
