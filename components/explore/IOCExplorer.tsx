"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, ChevronRight, ChevronLeft, ExternalLink,
  RefreshCw, X, Activity, Users, Zap,
  Globe, Server, Shield, AlertTriangle, Clock, Sun, Moon,
  Crosshair, Bug,
} from "lucide-react";
import NodeHoverPreview, { type NodePreviewType } from "./NodeHoverPreview";
import MITREExplorer from "./MITREExplorer";
import CVEExplorer from "./CVEExplorer";
import { useTheme, type ColorSet, DARK } from "@/lib/theme";
import NologinLogo from "@/components/ui/NologinLogo";
import Breadcrumb from "@/components/ui/Breadcrumb";

const CYAN = "#22d3ee";

// ── Local color context for sub-components ────────────────────────────────────
type ExploreC = ColorSet & { cyan: string };
const ExploreCtx = createContext<ExploreC>({ ...DARK, cyan: CYAN });
const useC = () => useContext(ExploreCtx);

// ── Types ─────────────────────────────────────────────────────────────────────
type IOCEntry = {
  stix_id: string;
  ip_value: string;
  indicator_types: string[] | string | null;
  confidence: number;
  decay_score: number | null;
  vt_malicious: number;
  crowdsec_reputation: string | null;
  abuseipdb_reports: number;
  country: string | null;
  country_code: string | null;
  city: string | null;
  asn: string | null;
  asn_org: string | null;
  modified: string | null;
  created: string | null;
};

type IOCDetail = IOCEntry & {
  pattern: string | null;
  vt_total_engines: number;
  vt_malicious_engines: string[] | null;
  crowdsec_behaviors: string[] | null;
  crowdsec_blocklists: string[] | null;
  abuseipdb_score: number;
  latitude: number | null;
  longitude: number | null;
  analyzers_processed: string[] | null;
  mitre_techniques: string[] | null;
  vt_link: string | null;
  abuse_link: string | null;
  crowdsec_link: string | null;
  source: string | null;
};

type Stats = {
  total_iocs: number;
  malicious: number;
  high_confidence: number;
  recent_24h: number;
};

type Campaign = {
  name: string; description: string; threat_actor: string; created: string;
  malware_sample: string[] | null; malware_count: number; technique_count: number;
};
type Group = {
  name: string; aliases: string[] | string | null; campaign_count: number;
  malware_used: string[] | null; technique_count: number;
};
type RecentIOC = {
  stix_id: string; ip_value: string; crowdsec_reputation: string | null;
  vt_malicious: number; confidence: number; country_code: string | null; modified: string | null;
};

type NewsData = {
  campaigns: Campaign[];
  top_groups: Group[];
  recent_iocs: RecentIOC[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function toArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return [val]; }
  }
  return [];
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return d.slice(0, 16);
  }
}

function threatColor(rep: string | null, vt: number, C: ExploreC): string {
  if (rep === "malicious" || vt >= 5) return C.red;
  if (rep === "suspicious" || vt >= 1) return C.orange;
  if (rep === "safe" || rep === "benign") return C.green;
  return C.border;
}

function riskProfile(rep: string | null, vt: number, conf: number, C: ExploreC) {
  if (rep === "malicious" || vt >= 5) return { label: "HIGH",   color: C.red };
  if (rep === "suspicious" || vt >= 1) return { label: "MEDIUM", color: C.orange };
  if (conf >= 75)                       return { label: "MEDIUM", color: C.orange };
  return { label: "LOW", color: C.green };
}

// ── Atoms ─────────────────────────────────────────────────────────────────────
function Scanlines({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9998,
      background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.07) 3px,rgba(0,0,0,0.07) 4px)",
    }} />
  );
}

function Brackets({ color, size = 8 }: { color: string; size?: number }) {
  const corner = (top: boolean, right: boolean): React.CSSProperties => ({
    position: "absolute", width: size, height: size,
    ...(top   ? { top: -1 }    : { bottom: -1 }),
    ...(right ? { right: -1 }  : { left: -1 }),
    borderTop:    top   ? `2px solid ${color}` : undefined,
    borderBottom: !top  ? `2px solid ${color}` : undefined,
    borderLeft:   !right ? `2px solid ${color}` : undefined,
    borderRight:  right ? `2px solid ${color}` : undefined,
  });
  return (
    <>
      <div style={corner(true, false)} /><div style={corner(true, true)} />
      <div style={corner(false, false)} /><div style={corner(false, true)} />
    </>
  );
}

function RepBadge({ rep }: { rep: string | null }) {
  const C = useC();
  if (!rep) return null;
  const color =
    rep === "malicious" ? C.red :
    rep === "suspicious" ? C.orange :
    rep === "safe" || rep === "benign" ? C.green : C.muted;
  return (
    <span style={{
      padding: "3px 8px", fontSize: 11, fontWeight: 700, letterSpacing: "0.10em",
      border: `1px solid ${color}88`, color, background: `${color}22`, flexShrink: 0,
    }}>
      {rep.toUpperCase()}
    </span>
  );
}

function TypePill({ label }: { label: string }) {
  const C = useC();
  return (
    <span style={{
      padding: "2px 8px", fontSize: 10, letterSpacing: "0.06em",
      border: `1px solid ${C.redDim}`, color: C.white, whiteSpace: "nowrap",
      background: "rgba(232,84,25,0.06)",
    }}>
      {label.replace(/-/g, "‑")}
    </span>
  );
}

function ConfBar({ value }: { value: number }) {
  const C = useC();
  const color = value >= 75 ? C.red : value >= 50 ? C.orange : C.muted;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 72 }}>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.12)", borderRadius: 2 }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, transition: "width 300ms", borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 700, minWidth: 26, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function SectionTitle({ icon: Icon, label }: { icon?: React.ElementType; label: string }) {
  const C = useC();
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: C.red,
      marginBottom: 12, display: "flex", alignItems: "center", gap: 6,
    }}>
      {Icon && <Icon size={10} />}
      {label}
    </div>
  );
}

// ── Hover state types ─────────────────────────────────────────────────────────
type HoverIdentity = { type: NodePreviewType; value: string };

// ── IOC Row ───────────────────────────────────────────────────────────────────
function IOCRow({
  item, onOpenGraph, onHover, onHoverMove, onHoverEnd, compact = false,
}: {
  item: IOCEntry;
  onOpenGraph: () => void;
  onHover: (value: string, x: number, y: number) => void;
  onHoverMove: (x: number, y: number) => void;
  onHoverEnd: () => void;
  compact?: boolean;
}) {
  const C = useC();
  const [hov, setHov] = useState(false);
  const tc    = threatColor(item.crowdsec_reputation, item.vt_malicious, C);
  const types = toArray(item.indicator_types);

  if (compact) {
    // Mobile compact row: IP + reputation badge + confidence in 2 lines
    return (
      <div
        role="button" tabIndex={0}
        onClick={onOpenGraph}
        onKeyDown={(e) => e.key === "Enter" && onOpenGraph()}
        onTouchStart={() => setHov(true)}
        onTouchEnd={() => setHov(false)}
        style={{
          padding: "10px 12px", cursor: "pointer",
          borderBottom: `1px solid ${C.border}`,
          borderLeft: `3px solid ${tc}`,
          background: hov ? C.rowHover : "transparent",
          outline: "none",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.white, letterSpacing: "0.03em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>
            {item.ip_value || "—"}
          </span>
          <RepBadge rep={item.crowdsec_reputation} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 9, color: C.muted }}>{item.country_code || "??"}</span>
          {item.vt_malicious > 0 && (
            <span style={{ fontSize: 9, color: C.red, fontWeight: 700 }}>VT:{item.vt_malicious}</span>
          )}
          <span style={{ fontSize: 9, color: C.muted, marginLeft: "auto" }}>{formatDate(item.modified)}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button" tabIndex={0}
      onClick={onOpenGraph}
      onKeyDown={(e) => e.key === "Enter" && onOpenGraph()}
      onMouseEnter={(e) => { setHov(true); onHover(item.ip_value, e.clientX, e.clientY); }}
      onMouseLeave={() => { setHov(false); onHoverEnd(); }}
      onMouseMove={(e) => onHoverMove(e.clientX, e.clientY)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 14px", cursor: "pointer",
        borderBottom: `1px solid ${C.border}`,
        borderLeft: `3px solid ${tc}`,
        background: hov ? C.rowHover : "transparent",
        transition: "background 120ms",
        outline: "none",
        position: "relative",
      }}
    >
      <div style={{
        minWidth: 138, fontWeight: 700, fontSize: 13,
        color: C.white,
        letterSpacing: "0.04em", flexShrink: 0,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {item.ip_value || "—"}
      </div>
      <div style={{ flex: 1, display: "flex", gap: 3, flexWrap: "nowrap", overflow: "hidden", minWidth: 0 }}>
        {types.slice(0, 2).map((t, i) => <TypePill key={i} label={t} />)}
        {types.length > 2 && (
          <span style={{ fontSize: 9, color: C.muted }}>+{types.length - 2}</span>
        )}
      </div>
      <ConfBar value={item.confidence ?? 0} />
      <div style={{ minWidth: 42, flexShrink: 0, display: "flex", alignItems: "center", gap: 3 }}>
        {item.vt_malicious > 0 ? (
          <>
            <span style={{ fontSize: 10, color: C.muted }}>VT</span>
            <span style={{ fontSize: 13, color: C.red, fontWeight: 700 }}>{item.vt_malicious}</span>
          </>
        ) : (
          <span style={{ fontSize: 11, color: C.muted, opacity: 0.5 }}>—</span>
        )}
      </div>
      <div style={{ minWidth: 82, flexShrink: 0 }}>
        <RepBadge rep={item.crowdsec_reputation} />
      </div>
      <div style={{ fontSize: 12, color: C.white, flexShrink: 0, minWidth: 28, letterSpacing: "0.07em", fontWeight: 600 }}>
        {item.country_code || "??"}
      </div>
      <div style={{ fontSize: 10, color: C.muted, flexShrink: 0, minWidth: 80, textAlign: "right" }}>
        {formatDate(item.modified)}
      </div>
    </div>
  );
}

// ── IOC Detail Panel (kept for potential future use) ─────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function IOCDetailPanel({
  ioc, onClose, onInvestigate,
}: { ioc: IOCDetail; onClose: () => void; onInvestigate: (ip: string) => void }) {
  const C = useC();
  const types     = toArray(ioc.indicator_types);
  const analyzers = toArray(ioc.analyzers_processed);
  const mitre     = toArray(ioc.mitre_techniques);
  const behaviors = toArray(ioc.crowdsec_behaviors);
  const blocklists = toArray(ioc.crowdsec_blocklists);
  const risk      = riskProfile(ioc.crowdsec_reputation, ioc.vt_malicious, ioc.confidence, C);

  return (
    <div style={{ padding: "16px", overflowY: "auto", height: "100%", boxSizing: "border-box" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.2em", marginBottom: 5 }}>
            ▶ INDICATOR_DETAIL
          </div>
          <div style={{
            fontSize: 15, fontWeight: 900, color: C.white,
            letterSpacing: "0.04em", wordBreak: "break-all", lineHeight: 1.2,
          }}>
            {ioc.ip_value || "—"}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none", border: `1px solid ${C.border}`, color: C.muted,
            cursor: "pointer", padding: "3px 8px", fontFamily: C.mono,
            fontSize: 8, letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 3,
            flexShrink: 0,
          }}
        >
          <X size={8} /> CLOSE
        </button>
      </div>

      {/* Risk + Confidence */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { label: "RISK LEVEL",  value: risk.label, color: risk.color },
          { label: "CONFIDENCE",  value: `${ioc.confidence}/100`, color: C.white },
        ].map((s) => (
          <div key={s.label} style={{
            padding: "10px 12px", border: `1px solid ${s.color}44`,
            background: `${s.color}08`, position: "relative",
          }}>
            <Brackets color={s.color} size={6} />
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, letterSpacing: "0.15em" }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: s.color, textShadow: `0 0 14px ${s.color}70` }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* STIX pattern */}
      {ioc.pattern && (
        <div style={{ marginBottom: 14 }}>
          <SectionTitle label="STIX PATTERN" />
          <div style={{
            padding: "8px 10px", background: "rgba(0,0,0,0.45)",
            border: `1px solid ${C.border}`, fontSize: 9, color: C.muted,
            wordBreak: "break-all", lineHeight: 1.6, letterSpacing: "0.02em",
          }}>
            {ioc.pattern}
          </div>
        </div>
      )}

      {/* Reputation signals */}
      <div style={{ marginBottom: 14 }}>
        <SectionTitle icon={Shield} label="REPUTATION SIGNALS" />
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>

          {/* VirusTotal */}
          <div style={{ padding: "8px 10px", border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 8, color: C.muted, letterSpacing: "0.1em" }}>VIRUSTOTAL</span>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: ioc.vt_malicious > 0 ? C.red : C.green,
              }}>
                {ioc.vt_malicious}{ioc.vt_total_engines > 0 ? `/${ioc.vt_total_engines}` : ""} engines
              </span>
              {ioc.vt_link && (
                <a href={ioc.vt_link} target="_blank" rel="noopener noreferrer"
                  style={{ color: C.muted, display: "flex" }}>
                  <ExternalLink size={9} />
                </a>
              )}
            </div>
          </div>

          {/* CrowdSec */}
          <div style={{ padding: "8px 10px", border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: behaviors.length > 0 ? 7 : 0 }}>
              <span style={{ fontSize: 8, color: C.muted, letterSpacing: "0.1em" }}>CROWDSEC</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <RepBadge rep={ioc.crowdsec_reputation} />
                {ioc.crowdsec_link && (
                  <a href={ioc.crowdsec_link} target="_blank" rel="noopener noreferrer"
                    style={{ color: C.muted, display: "flex" }}>
                    <ExternalLink size={9} />
                  </a>
                )}
              </div>
            </div>
            {behaviors.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {behaviors.slice(0, 4).map((b, i) => (
                  <span key={i} style={{
                    fontSize: 9, padding: "2px 6px",
                    background: "rgba(232,84,25,0.09)", color: C.muted,
                    border: `1px solid ${C.redDim}`,
                  }}>
                    {b}
                  </span>
                ))}
              </div>
            )}
            {blocklists.length > 0 && (
              <div style={{ marginTop: 5, fontSize: 8, color: C.muted }}>
                Blocklists: {blocklists.slice(0, 3).join(", ")}
                {blocklists.length > 3 && ` +${blocklists.length - 3}`}
              </div>
            )}
          </div>

          {/* AbuseIPDB */}
          <div style={{ padding: "8px 10px", border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 8, color: C.muted, letterSpacing: "0.1em" }}>ABUSEIPDB</span>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: ioc.abuseipdb_reports > 0 ? C.orange : C.muted }}>
                {ioc.abuseipdb_reports} reports
                {ioc.abuseipdb_score > 0 && ` · ${ioc.abuseipdb_score}%`}
              </span>
              {ioc.abuse_link && (
                <a href={ioc.abuse_link} target="_blank" rel="noopener noreferrer"
                  style={{ color: C.muted, display: "flex" }}>
                  <ExternalLink size={9} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Geographic */}
      <div style={{ marginBottom: 14 }}>
        <SectionTitle icon={Globe} label="GEOGRAPHIC" />
        <div style={{ padding: "10px 12px", border: `1px solid ${C.border}`, fontSize: 11, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Globe size={10} style={{ color: C.red, flexShrink: 0 }} />
            <span style={{ color: C.white }}>{ioc.country || "Unknown"}</span>
            {ioc.city && <span style={{ color: C.muted }}>· {ioc.city}</span>}
            {ioc.country_code && (
              <span style={{
                padding: "0 5px", fontSize: 8, border: `1px solid ${C.border}`,
                color: C.muted, letterSpacing: "0.1em",
              }}>
                {ioc.country_code}
              </span>
            )}
          </div>
          {(ioc.asn || ioc.asn_org) && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Server size={10} style={{ color: C.muted, flexShrink: 0 }} />
              <span style={{ color: C.muted, fontSize: 10 }}>
                {ioc.asn ? `ASN ${ioc.asn}` : ""}
                {ioc.asn && ioc.asn_org ? " · " : ""}
                {ioc.asn_org || ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Indicator types */}
      {types.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <SectionTitle icon={AlertTriangle} label="INDICATOR TYPES" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {types.map((t, i) => (
              <span key={i} style={{
                padding: "3px 8px", fontSize: 8, letterSpacing: "0.1em",
                border: `1px solid ${C.redDim}`, color: C.red,
              }}>
                {t.toUpperCase().replace(/-/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* MITRE ATT&CK */}
      {mitre.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <SectionTitle label="MITRE ATT&CK TECHNIQUES" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {mitre.map((t, i) => (
              <span key={i} style={{
                padding: "3px 8px", fontSize: 9, fontWeight: 700,
                border: `1px solid rgba(34,211,238,0.3)`, color: C.cyan,
                background: "rgba(34,211,238,0.05)",
              }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Analyzers */}
      {analyzers.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <SectionTitle label="ANALYZERS PROCESSED" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {analyzers.map((a, i) => (
              <span key={i} style={{
                padding: "2px 7px", fontSize: 8, letterSpacing: "0.06em",
                border: `1px solid ${C.border}`, color: C.muted,
              }}>
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Decay score */}
      {ioc.decay_score != null && (
        <div style={{ marginBottom: 14 }}>
          <SectionTitle label="DECAY SCORE — RELEVANCE INDEX" />
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px", border: `1px solid ${C.border}`,
          }}>
            <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.07)" }}>
              <div style={{
                width: `${Math.min(100, Number(ioc.decay_score))}%`, height: "100%",
                background: C.orange, transition: "width 600ms ease",
              }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.orange, minWidth: 28, textAlign: "right" }}>
              {ioc.decay_score}
            </span>
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div style={{ marginBottom: 18 }}>
        <SectionTitle icon={Clock} label="TIMESTAMPS" />
        <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 9 }}>
          {[
            { k: "CREATED",  v: ioc.created },
            { k: "MODIFIED", v: ioc.modified },
          ].map(({ k, v }) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.muted }}>{k}</span>
              <span style={{ color: C.white }}>{formatDate(v)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <button
          onClick={() => onInvestigate(ioc.ip_value)}
          style={{
            padding: "12px 0", background: C.red, border: "none",
            color: "#fff", fontFamily: C.mono, fontWeight: 900,
            fontSize: 11, letterSpacing: "0.22em", cursor: "pointer",
            boxShadow: `0 0 20px rgba(232,84,25,0.35)`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "opacity 120ms",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <Zap size={12} /> INVESTIGATE FULL REPORT
        </button>

        {(ioc.vt_link || ioc.abuse_link) && (
          <div style={{ display: "flex", gap: 6 }}>
            {ioc.vt_link && (
              <a href={ioc.vt_link} target="_blank" rel="noopener noreferrer" style={{
                flex: 1, padding: "7px", textAlign: "center",
                border: `1px solid ${C.border}`, color: C.muted,
                textDecoration: "none", fontSize: 8, letterSpacing: "0.12em",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}>
                <ExternalLink size={8} /> VIRUSTOTAL
              </a>
            )}
            {ioc.abuse_link && (
              <a href={ioc.abuse_link} target="_blank" rel="noopener noreferrer" style={{
                flex: 1, padding: "7px", textAlign: "center",
                border: `1px solid ${C.border}`, color: C.muted,
                textDecoration: "none", fontSize: 8, letterSpacing: "0.12em",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}>
                <ExternalLink size={8} /> ABUSEIPDB
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Left Intel Panel: Campaigns + Actors ─────────────────────────────────────
function LeftIntelPanel({
  data, onCampaignClick, onGroupClick, onHover, onHoverMove, onHoverEnd,
}: {
  data: NewsData | null;
  onCampaignClick: (name: string) => void;
  onGroupClick: (name: string) => void;
  onHover: (type: NodePreviewType, value: string, x: number, y: number) => void;
  onHoverMove: (x: number, y: number) => void;
  onHoverEnd: () => void;
}) {
  const C = useC();
  const router = useRouter();
  const [hovCampaign, setHovCampaign] = useState<number | null>(null);
  const [hovGroup,    setHovGroup]    = useState<number | null>(null);

  if (!data) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100%", gap: 8, color: C.red, fontSize: 9, letterSpacing: "0.2em",
    }}>
      <RefreshCw size={10} className="animate-spin" /> LOADING...
    </div>
  );

  return (
    <div style={{ overflowY: "auto", height: "100%", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── ACTIVE CAMPAIGNS ── */}
      <div>
        <SectionTitle icon={Activity} label="ACTIVE CAMPAIGNS" />
        {data.campaigns.length === 0 ? (
          <div style={{ fontSize: 9, color: C.muted }}>NO_CAMPAIGNS</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.campaigns.map((c, i) => {
              const hov = hovCampaign === i;
              const malware = Array.isArray(c.malware_sample) ? c.malware_sample : [];
              return (
                <div
                  key={i}
                  role="button" tabIndex={0}
                  onClick={() => c.name && onCampaignClick(c.name)}
                  onKeyDown={(e) => e.key === "Enter" && c.name && onCampaignClick(c.name)}
                  onMouseEnter={(e) => { setHovCampaign(i); if (c.name) onHover("campaign", c.name, e.clientX, e.clientY); }}
                  onMouseLeave={() => { setHovCampaign(null); onHoverEnd(); }}
                  onMouseMove={(e) => onHoverMove(e.clientX, e.clientY)}
                  style={{
                    padding: "9px 10px", cursor: "pointer", outline: "none",
                    border: `1px solid ${hov ? "rgba(255,215,0,0.35)" : C.border}`,
                    borderLeft: `2px solid ${hov ? "#FFD700" : C.redDim}`,
                    background: hov ? "rgba(255,215,0,0.03)" : "transparent",
                    transition: "all 120ms",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: hov ? "#FFD700" : C.white, flex: 1, lineHeight: 1.3 }}>
                      {c.name || "Unnamed Campaign"}
                    </div>
                    {hov && <span style={{ fontSize: 9, color: "#FFD700", flexShrink: 0, marginLeft: 4, letterSpacing: "0.08em" }}>GRAPH →</span>}
                  </div>

                  {c.threat_actor && (
                    <div style={{ fontSize: 8, color: C.red, letterSpacing: "0.06em", marginBottom: 4 }}>
                      ▸ {c.threat_actor}
                    </div>
                  )}

                  {c.description && (
                    <div style={{
                      fontSize: 8, color: C.muted, lineHeight: 1.55, marginBottom: 6,
                      display: "-webkit-box", WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {c.description}
                    </div>
                  )}

                  {/* Stats: malware pills + technique count */}
                  {(malware.length > 0 || c.technique_count > 0 || c.malware_count > 0) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                      {malware.map((m, mi) => (
                        <span
                          key={mi}
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); router.push(`/explore/graph?type=malware&value=${encodeURIComponent(m)}&from=ioc`); }}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); router.push(`/explore/graph?type=malware&value=${encodeURIComponent(m)}&from=ioc`); } }}
                          onMouseEnter={(e) => { e.stopPropagation(); onHover("malware", m, e.clientX, e.clientY); }}
                          onMouseLeave={(e) => { e.stopPropagation(); onHoverEnd(); }}
                          onMouseMove={(e) => { e.stopPropagation(); onHoverMove(e.clientX, e.clientY); }}
                          style={{
                            fontSize: 9, padding: "2px 6px", cursor: "pointer",
                            background: "rgba(232,84,25,0.09)", color: C.muted,
                            border: `1px solid ${C.redDim}`,
                            transition: "border-color 100ms, color 100ms",
                          }}
                          onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#FF8C00"; (e.target as HTMLElement).style.color = "#FF8C00"; }}
                          onBlur={(e) => { (e.target as HTMLElement).style.borderColor = C.redDim; (e.target as HTMLElement).style.color = C.muted; }}
                        >
                          {m}
                        </span>
                      ))}
                      {c.malware_count > malware.length && (
                        <span style={{ fontSize: 9, color: C.muted }}>+{c.malware_count - malware.length}</span>
                      )}
                      {c.technique_count > 0 && (
                        <span style={{
                          fontSize: 9, padding: "2px 6px",
                          border: `1px solid rgba(34,211,238,0.25)`, color: C.cyan,
                          background: "rgba(34,211,238,0.05)",
                        }}>
                          {c.technique_count} TTP
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{ fontSize: 10, color: C.muted, marginTop: 5 }}>
                    {formatDate(c.created)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── THREAT ACTORS ── */}
      <div>
        <SectionTitle icon={Users} label="THREAT ACTORS" />
        {data.top_groups.length === 0 ? (
          <div style={{ fontSize: 9, color: C.muted }}>NO_DATA</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {data.top_groups.map((g, i) => {
              const aliases  = toArray(g.aliases);
              const malware  = Array.isArray(g.malware_used) ? g.malware_used : [];
              const hov      = hovGroup === i;
              return (
                <div
                  key={i}
                  role="button" tabIndex={0}
                  onClick={() => onGroupClick(g.name)}
                  onKeyDown={(e) => e.key === "Enter" && onGroupClick(g.name)}
                  onMouseEnter={(e) => { setHovGroup(i); onHover("group", g.name, e.clientX, e.clientY); }}
                  onMouseLeave={() => { setHovGroup(null); onHoverEnd(); }}
                  onMouseMove={(e) => onHoverMove(e.clientX, e.clientY)}
                  style={{
                    padding: "8px 10px", cursor: "pointer", outline: "none",
                    border: `1px solid ${hov ? "rgba(168,85,247,0.4)" : C.border}`,
                    borderLeft: `2px solid ${hov ? "#a855f7" : "rgba(168,85,247,0.2)"}`,
                    background: hov ? "rgba(168,85,247,0.04)" : "transparent",
                    transition: "all 120ms",
                  }}
                >
                  {/* Name + campaign count */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: hov ? "#a855f7" : C.white }}>
                      {g.name}
                    </div>
                    <div style={{ flexShrink: 0, marginLeft: 6 }}>
                      {hov ? (
                        <span style={{ fontSize: 9, color: "#a855f7", letterSpacing: "0.08em" }}>GRAPH →</span>
                      ) : (
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: 13, color: C.red, fontWeight: 900 }}>{g.campaign_count}</span>
                          <span style={{ fontSize: 9, color: C.muted, display: "block", letterSpacing: "0.1em" }}>OPS</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {aliases.length > 0 && (
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 5, letterSpacing: "0.03em" }}>
                      aka: {aliases.slice(0, 3).join(" · ")}{aliases.length > 3 ? ` +${aliases.length - 3}` : ""}
                    </div>
                  )}

                  {malware.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 4 }}>
                      {malware.map((m, mi) => (
                        <span
                          key={mi}
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); router.push(`/explore/graph?type=malware&value=${encodeURIComponent(m)}&from=ioc`); }}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); router.push(`/explore/graph?type=malware&value=${encodeURIComponent(m)}&from=ioc`); } }}
                          onMouseEnter={(e) => { e.stopPropagation(); onHover("malware", m, e.clientX, e.clientY); }}
                          onMouseLeave={(e) => { e.stopPropagation(); onHoverEnd(); }}
                          onMouseMove={(e) => { e.stopPropagation(); onHoverMove(e.clientX, e.clientY); }}
                          style={{
                            fontSize: 9, padding: "2px 5px", cursor: "pointer",
                            background: "rgba(232,84,25,0.09)", color: C.muted,
                            border: `1px solid ${C.redDim}`,
                            transition: "border-color 100ms, color 100ms",
                          }}
                          onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#FF8C00"; (e.target as HTMLElement).style.color = "#FF8C00"; }}
                          onBlur={(e) => { (e.target as HTMLElement).style.borderColor = C.redDim; (e.target as HTMLElement).style.color = C.muted; }}
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}

                  {g.technique_count > 0 && (
                    <div style={{ fontSize: 10, color: C.cyan }}>
                      {g.technique_count} ATT&amp;CK technique{g.technique_count !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Right Recent IOCs Panel ───────────────────────────────────────────────────
function RecentIOCsPanel({ data }: { data: NewsData | null }) {
  const C = useC();
  if (!data) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100%", gap: 8, color: C.red, fontSize: 9, letterSpacing: "0.2em",
    }}>
      <RefreshCw size={10} className="animate-spin" /> LOADING...
    </div>
  );

  return (
    <div style={{ overflowY: "auto", height: "100%", padding: "14px 10px" }}>
      <SectionTitle icon={Clock} label="RECENT · NEO4J LIVE" />
      {data.recent_iocs.length === 0 ? (
        <div style={{ fontSize: 9, color: C.muted }}>NO_DATA_IN_NEO4J</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {data.recent_iocs.map((ioc, i) => {
            const tc = threatColor(ioc.crowdsec_reputation, ioc.vt_malicious, C);
            return (
              <div key={i} style={{
                padding: "7px 8px",
                borderBottom: `1px solid ${C.border}`,
                borderLeft: `2px solid ${tc}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                  <span style={{ fontSize: 10, color: C.white, fontWeight: 700, letterSpacing: "0.02em" }}>
                    {ioc.ip_value || "—"}
                  </span>
                  <RepBadge rep={ioc.crowdsec_reputation} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: C.muted }}>
                    {ioc.country_code ?? "??"} · {ioc.confidence}%
                    {ioc.vt_malicious > 0 ? ` · VT ${ioc.vt_malicious}` : ""}
                  </span>
                  <span style={{ fontSize: 10, color: C.muted }}>
                    {formatDate(ioc.modified)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const PAGE_SIZE = 50;

export default function IOCExplorer() {
  const router = useRouter();
  const { C: baseC, isDark, toggle } = useTheme();
  const C: ExploreC = { ...baseC, cyan: CYAN };

  const [tab,           setTabState]      = useState<"ioc" | "mitre" | "cve">("ioc");
  const [feed,          setFeed]          = useState<IOCEntry[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<IOCEntry[] | null>(null);
  const [searching,     setSearching]     = useState(false);
  const [page,          setPage]          = useState(0);
  const [sort,          setSort]          = useState<"recent" | "confidence">("recent");
  const [stats,         setStats]         = useState<Stats | null>(null);
  const [news,          setNews]          = useState<NewsData | null>(null);
  const [clock,         setClock]         = useState("");
  const [hoverIdentity, setHoverIdentity] = useState<HoverIdentity | null>(null);
  const [hoverPos,      setHoverPos]      = useState({ x: 0, y: 0 });
  const [showPreview,   setShowPreview]   = useState(false);
  const [isMobile,      setIsMobile]      = useState(false);
  const [mobilePanel,   setMobilePanel]   = useState<"feed" | "intel" | "recent">("feed");

  useEffect(() => {
    const calc = () => setIsMobile(window.innerWidth <= 768);
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  // Read tab from URL on mount; update URL when tab changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t === "mitre" || t === "cve") setTabState(t);
  }, []);

  const setTab = useCallback((t: "ioc" | "mitre" | "cve") => {
    setTabState(t);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", t);
    window.history.replaceState({}, "", url.toString());
  }, []);

  // Clock
  useEffect(() => {
    const tick = () =>
      setClock(new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC");
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // Stats + news (once)
  useEffect(() => {
    fetch("/api/dashboard/explore/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setStats(d); })
      .catch(() => {});
    fetch("/api/dashboard/explore/news")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setNews(d); })
      .catch(() => {});
  }, []);

  // Feed (page / sort changes)
  const loadFeed = useCallback(() => {
    setLoading(true);
    fetch(`/api/dashboard/explore/feed?skip=${page * PAGE_SIZE}&limit=${PAGE_SIZE}&sort=${sort}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setFeed(d?.feed ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page, sort]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  // Hover preview — timer only resets when IDENTITY (type+value) changes, not on mouse move
  useEffect(() => {
    if (!hoverIdentity) { setShowPreview(false); return; }
    const t = setTimeout(() => setShowPreview(true), 380);
    return () => clearTimeout(t);
  }, [hoverIdentity]);

  const handleHover = useCallback((type: NodePreviewType, value: string, x: number, y: number) => {
    setHoverPos({ x, y });
    setHoverIdentity((prev) =>
      prev?.type === type && prev?.value === value ? prev : { type, value },
    );
  }, []);

  const handleHoverMove = useCallback((x: number, y: number) => {
    setHoverPos({ x, y });
  }, []);

  const handleHoverEnd = useCallback(() => {
    setHoverIdentity(null);
    setShowPreview(false);
  }, []);

  // Search debounce
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    const t = setTimeout(() => {
      setSearching(true);
      fetch(`/api/dashboard/explore/search?q=${encodeURIComponent(searchQuery)}`)
        .then((r) => r.json())
        .then((d) => { setSearchResults(d.results ?? []); setSearching(false); })
        .catch(() => setSearching(false));
    }, 380);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const displayItems = searchResults !== null ? searchResults : feed;

  return (
    <ExploreCtx.Provider value={C}>
    <div style={{
      background: C.bg, color: C.white, height: "100vh",
      fontFamily: C.mono, fontSize: 13, display: "flex",
      flexDirection: "column", overflow: "hidden",
    }}>
      <Scanlines visible={isDark} />

      {/* ── Header ── */}
      <header style={{
        borderBottom: `1px solid ${C.redDim}`, padding: isMobile ? "7px 12px 0" : "9px 24px 0",
        display: "flex", flexDirection: "column",
        background: C.surface, flexShrink: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: isMobile ? 7 : 9 }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 14 }}>
            <div style={{ width: 3, height: 22, background: C.red, boxShadow: C.redGlow, flexShrink: 0 }} />
            <NologinLogo height={isMobile ? 20 : 26} />
            {!isMobile && <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />}
            <div>
              <div style={{ fontSize: isMobile ? 11 : 14, fontWeight: 900, letterSpacing: isMobile ? "0.2em" : "0.38em" }}>SKYFALL_CTI</div>
              {!isMobile && <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.18em" }}>// IOC_INTELLIGENCE_EXPLORER</div>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 14, fontSize: 10, color: C.muted }}>
            {!isMobile && <span style={{ color: C.green, letterSpacing: "0.12em" }}>● ONLINE</span>}
            {!isMobile && <span>{clock}</span>}
            <button
              onClick={toggle}
              style={{
                background: "none", border: `1px solid ${C.redDim}`,
                color: C.muted, cursor: "pointer", padding: "3px 9px",
                display: "flex", alignItems: "center", gap: 5,
                fontFamily: C.mono, fontSize: 9, letterSpacing: "0.12em",
              }}
            >
              {isDark ? <Sun size={10} /> : <Moon size={10} />}
              {!isMobile && (isDark ? "LIGHT" : "DARK")}
            </button>
          </div>
        </div>
        <div style={{ paddingBottom: 5, paddingLeft: isMobile ? 4 : 17 }}>
          <Breadcrumb />
        </div>
      </header>

      {/* ── Tab bar — exactly 3 equal sections ── */}
      <div style={{
        borderBottom: `1px solid ${C.border}`,
        display: "flex", background: "rgba(0,0,0,0.35)",
        flexShrink: 0,
      }}>
        {([
          { id: "ioc"   as const, label: "IOC FEED",     accent: C.red,     icon: Shield     },
          { id: "mitre" as const, label: "MITRE ATT&CK", accent: "#22d3ee", icon: Crosshair  },
          { id: "cve"   as const, label: "CVE DATABASE", accent: "#f97316", icon: Bug        },
        ]).map(({ id, label, accent, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1,
              padding: "9px 0",
              background: tab === id ? `${accent}10` : "transparent",
              border: "none",
              borderBottom: tab === id ? `2px solid ${accent}` : "2px solid transparent",
              borderRight: `1px solid ${C.border}`,
              color: tab === id ? accent : C.muted,
              fontFamily: C.mono, fontSize: 9,
              letterSpacing: "0.18em", cursor: "pointer",
              fontWeight: tab === id ? 700 : 400,
              transition: "color 150ms, background 150ms, border-color 150ms",
              textAlign: "center",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Icon size={10} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Stats bar (IOC only) ── */}
      {tab === "ioc" && <div style={{
        borderBottom: `1px solid ${C.border}`, padding: isMobile ? "5px 12px" : "6px 24px",
        display: "flex", background: C.accentFaint, flexShrink: 0,
        overflowX: "auto", WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
      }}>
        {([
          { label: "TOTAL IOCs",      value: stats?.total_iocs,      color: C.white  },
          { label: "MALICIOUS",        value: stats?.malicious,       color: C.red    },
          { label: "HIGH CONF",        value: stats?.high_confidence, color: C.orange },
          { label: "24H",              value: stats?.recent_24h,      color: C.green  },
        ] as const).map(({ label, value, color }, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: isMobile ? 5 : 10,
            paddingRight: isMobile ? 12 : 24, marginRight: isMobile ? 12 : 24,
            borderRight: i < 3 ? `1px solid ${C.border}` : "none",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: isMobile ? 8 : 10, color: C.muted, letterSpacing: "0.1em", whiteSpace: "nowrap" }}>{label}</span>
            <span style={{
              fontSize: isMobile ? 13 : 15, fontWeight: 900, color,
              textShadow: `0 0 12px ${color}55`,
              fontVariantNumeric: "tabular-nums",
            }}>
              {value != null ? value.toLocaleString() : "—"}
            </span>
          </div>
        ))}
      </div>}

      {tab === "cve" ? <CVEExplorer /> : tab === "mitre" ? <MITREExplorer /> : <>

      {/* ── Mobile panel selector ── */}
      {isMobile && (
        <div style={{
          display: "flex", borderBottom: `1px solid ${C.border}`,
          background: C.surface, flexShrink: 0,
        }}>
          {(["feed", "intel", "recent"] as const).map((p) => {
            const labels = { feed: "IOC FEED", intel: "INTEL", recent: "RECENT" };
            const on = mobilePanel === p;
            return (
              <button key={p} onClick={() => setMobilePanel(p)} style={{
                flex: 1, padding: "8px 0", fontSize: 9, fontWeight: 700,
                letterSpacing: "0.14em", fontFamily: C.mono,
                border: "none", cursor: "pointer",
                background: on ? `${C.red}10` : "transparent",
                color: on ? C.red : C.muted,
                borderBottom: on ? `2px solid ${C.red}` : "2px solid transparent",
                transition: "color 100ms, background 100ms",
              }}>
                {labels[p]}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Search bar ── */}
      <div style={{
        padding: isMobile ? "8px 12px" : "10px 24px", borderBottom: `1px solid ${C.border}`,
        background: C.surface, flexShrink: 0,
      }}>
        <div style={{
          display: "flex",
          border: `1px solid ${searchQuery ? C.red : C.redDim}`,
          background: "rgba(232,84,25,0.025)",
          boxShadow: searchQuery ? C.redGlow : "none",
          transition: "border-color 160ms, box-shadow 160ms",
        }}>
          <div style={{ display: "flex", alignItems: "center", padding: "0 13px", color: C.muted }}>
            <Search size={13} />
          </div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by IP address, domain, or STIX pattern…"
            style={{
              flex: 1, padding: "10px 6px",
              background: "transparent", border: "none", outline: "none",
              fontFamily: C.mono, fontSize: 13, color: C.white, letterSpacing: "0.04em",
            }}
          />
          {searching && (
            <div style={{ padding: "0 12px", display: "flex", alignItems: "center", color: C.muted }}>
              <RefreshCw size={11} className="animate-spin" />
            </div>
          )}
          {searchQuery && !searching && (
            <button onClick={() => setSearchQuery("")} style={{
              padding: "0 12px", background: "none", border: "none",
              color: C.muted, cursor: "pointer",
            }}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── Main split: 3 columns on desktop, single panel on mobile ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* ─ Left: Campaigns + Actors intel ─ */}
        {(!isMobile || mobilePanel === "intel") && (
        <div style={{
          width: isMobile ? "100%" : 320, flexShrink: 0, display: "flex", flexDirection: "column",
          borderRight: isMobile ? "none" : `1px solid ${C.border}`, overflow: "hidden",
          background: C.surface,
        }}>
          <div style={{
            padding: "7px 12px", borderBottom: `1px solid ${C.border}`,
            background: C.accentFaint, fontSize: 11,
            color: C.muted, letterSpacing: "0.15em", flexShrink: 0,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Activity size={10} style={{ color: C.red }} /> THREAT INTELLIGENCE
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <LeftIntelPanel
              data={news}
              onCampaignClick={(name) => router.push(`/explore/graph?type=campaign&value=${encodeURIComponent(name)}&from=ioc`)}
              onGroupClick={(name) => router.push(`/explore/graph?type=group&value=${encodeURIComponent(name)}&from=ioc`)}
              onHover={handleHover}
              onHoverMove={handleHoverMove}
              onHoverEnd={handleHoverEnd}
            />
          </div>
        </div>
        )}

        {/* ─ Center: IOC Feed ─ */}
        {(!isMobile || mobilePanel === "feed") && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          borderRight: isMobile ? "none" : `1px solid ${C.border}`, overflow: "hidden", minWidth: 0,
        }}>
          {/* Feed controls */}
          <div style={{
            padding: isMobile ? "6px 10px" : "7px 14px", borderBottom: `1px solid ${C.border}`,
            background: C.surface,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, color: C.muted, letterSpacing: "0.12em" }}>
              {searchResults !== null
                ? `SEARCH — ${searchResults.length} RESULT${searchResults.length !== 1 ? "S" : ""} FOR "${searchQuery}"`
                : `LIVE FEED · PAGE ${page + 1} · ${feed.length} RECORDS`}
            </span>

            {!searchResults && (
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                {(["recent", "confidence"] as const).map((s, i) => (
                  <button key={s} onClick={() => { setSort(s); setPage(0); }} style={{
                    padding: "4px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                    background: sort === s ? "rgba(232,84,25,0.1)" : "transparent",
                    border: `1px solid ${sort === s ? C.red : C.border}`,
                    borderRight: i === 0 ? "none" : undefined,
                    color: sort === s ? C.red : C.muted, cursor: "pointer", fontFamily: C.mono,
                  }}>
                    {s === "recent" ? "RECENT" : "CONFIDENCE"}
                  </button>
                ))}

                <div style={{ width: 1, background: C.border, margin: "0 8px", height: 20 }} />

                <button onClick={() => page > 0 && setPage((p) => p - 1)} disabled={page === 0} style={{
                  padding: "4px 7px", background: "none",
                  border: `1px solid ${page === 0 ? "transparent" : C.border}`,
                  color: page === 0 ? C.border : C.muted,
                  cursor: page === 0 ? "default" : "pointer", borderRight: "none",
                }}>
                  <ChevronLeft size={11} />
                </button>
                <button onClick={() => feed.length >= PAGE_SIZE && setPage((p) => p + 1)}
                  disabled={feed.length < PAGE_SIZE} style={{
                    padding: "4px 7px", background: "none",
                    border: `1px solid ${feed.length < PAGE_SIZE ? "transparent" : C.border}`,
                    color: feed.length < PAGE_SIZE ? C.border : C.muted,
                    cursor: feed.length < PAGE_SIZE ? "default" : "pointer",
                  }}>
                  <ChevronRight size={11} />
                </button>

                <button onClick={loadFeed} title="Refresh" style={{
                  padding: "4px 7px", background: "none", border: `1px solid ${C.border}`,
                  color: C.muted, cursor: "pointer", marginLeft: 4,
                }}>
                  <RefreshCw size={10} />
                </button>
              </div>
            )}
          </div>

          {/* Column headers — hidden on mobile */}
          {!isMobile && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "5px 14px 5px 17px", borderBottom: `1px solid ${C.border}`,
            background: C.altRow, fontSize: 10,
            color: C.muted, letterSpacing: "0.15em", flexShrink: 0, opacity: 0.7,
          }}>
            <div style={{ minWidth: 138, flexShrink: 0 }}>INDICATOR VALUE</div>
            <div style={{ flex: 1 }}>THREAT TYPE</div>
            <div style={{ minWidth: 64 }}>CONFIDENCE</div>
            <div style={{ minWidth: 36 }}>VT</div>
            <div style={{ minWidth: 68 }}>REPUTATION</div>
            <div style={{ minWidth: 28 }}>CC</div>
            <div style={{ minWidth: 80, textAlign: "right" }}>LAST SEEN</div>
          </div>
          )}

          {/* Rows */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: 120, gap: 8, color: C.red, fontSize: 11, letterSpacing: "0.2em",
              }}>
                <RefreshCw size={12} className="animate-spin" /> LOADING_FEED...
              </div>
            ) : displayItems.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "48px 0",
                color: C.muted, fontSize: 10, letterSpacing: "0.2em",
              }}>
                {searchQuery ? "NO_RESULTS_FOUND" : "NO_DATA_AVAILABLE"}
              </div>
            ) : (
              displayItems.map((item, i) => (
                <IOCRow
                  key={item.stix_id || `${item.ip_value}-${i}`}
                  item={item}
                  compact={isMobile}
                  onOpenGraph={() => router.push(`/explore/graph?type=ioc&value=${encodeURIComponent(item.ip_value)}&from=ioc`)}
                  onHover={(v, x, y) => handleHover("ioc", v, x, y)}
                  onHoverMove={handleHoverMove}
                  onHoverEnd={handleHoverEnd}
                />
              ))
            )}
          </div>
        </div>
        )}

        {/* ─ Right: Recent IOCs from Neo4j ─ */}
        {(!isMobile || mobilePanel === "recent") && (
        <div style={{
          width: isMobile ? "100%" : 260, flexShrink: 0, display: "flex",
          flexDirection: "column", overflow: "hidden",
          background: C.surface,
        }}>
          <div style={{
            padding: "7px 12px", borderBottom: `1px solid ${C.border}`,
            background: C.accentFaint, fontSize: 11,
            color: C.muted, letterSpacing: "0.15em", flexShrink: 0,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Clock size={10} style={{ color: C.green }} /> RECENT · NEO4J LIVE
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <RecentIOCsPanel data={news} />
          </div>
        </div>
        )}
      </div>

      {/* ── Node hover preview (desktop only) ── */}
      {!isMobile && showPreview && hoverIdentity && (
        <NodeHoverPreview
          type={hoverIdentity.type}
          value={hoverIdentity.value}
          mouseX={hoverPos.x}
          mouseY={hoverPos.y}
        />
      )}
      </>}
    </div>
    </ExploreCtx.Provider>
  );
}
