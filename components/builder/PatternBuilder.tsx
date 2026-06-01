"use client";

import React, { useState } from "react";
import { INDICATOR_OBSERVABLE_TYPES, buildPattern } from "@/lib/stix-types";
import { useForge } from "./ForgeLayout";

interface Props {
  value: string;
  onChange: (pattern: string) => void;
}

export default function PatternBuilder({ value, onChange }: Props) {
  const { C } = useForge();

  const [obsType, setObsType] = useState(() => {
    // Try to infer obs type from existing pattern
    const m = value.match(/\[([a-z0-9:-]+):/);
    return m ? m[1] : "ipv4-addr";
  });
  const [obsValue, setObsValue] = useState(() => {
    const m = value.match(/=\s*'([^']+)'/);
    return m ? m[1] : "";
  });

  const obsEntry = INDICATOR_OBSERVABLE_TYPES.find((o) => o.id === obsType);

  const handleTypeChange = (newType: string) => {
    setObsType(newType);
    onChange(buildPattern(newType, obsValue));
  };

  const handleValueChange = (val: string) => {
    setObsValue(val);
    onChange(buildPattern(obsType, val));
  };

  const INPUT = {
    background: C.bg,
    border: `1px solid ${C.border}`,
    color: C.white,
    fontFamily: C.mono,
    fontSize: 10,
    padding: "5px 8px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  const SELECT = { ...INPUT, cursor: "pointer" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Observable type selector */}
      <div>
        <label style={{ fontSize: 8, letterSpacing: "0.12em", color: C.red, display: "block", marginBottom: 4 }}>
          OBSERVABLE TYPE
        </label>
        <select
          value={obsType}
          onChange={(e) => handleTypeChange(e.target.value)}
          style={SELECT}
          aria-label="Observable type"
        >
          {INDICATOR_OBSERVABLE_TYPES.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Value input */}
      <div>
        <label style={{ fontSize: 8, letterSpacing: "0.12em", color: C.red, display: "block", marginBottom: 4 }}>
          VALUE
        </label>
        <input
          type="text"
          value={obsValue}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={obsEntry?.placeholder ?? ""}
          style={INPUT}
          aria-label="Observable value"
        />
      </div>

      {/* Pattern preview */}
      <div>
        <label style={{ fontSize: 8, letterSpacing: "0.12em", color: C.muted, opacity: 0.6, display: "block", marginBottom: 4 }}>
          STIX PATTERN PREVIEW
        </label>
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${C.border}`,
          padding: "5px 8px",
          fontSize: 9,
          color: C.green,
          fontFamily: C.mono,
          wordBreak: "break-all",
          minHeight: 28,
        }}>
          {value || <span style={{ opacity: 0.4 }}>pattern will appear here</span>}
        </div>
      </div>
    </div>
  );
}
