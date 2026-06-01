"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, RefreshCw, X, ChevronLeft, ChevronRight,
  AlertTriangle, Shield, Zap, Package, Activity,
} from "lucide-react";
import NodeHoverPreview from "./NodeHoverPreview";
import { useTheme, DARK, LIGHT } from "@/lib/theme";

const CVE_ORANGE = "#f97316";
const CVE_RED    = "#ef4444";
const CVE_CYAN   = "#22d3ee";
const CVE_YELLOW = "#FFD700";
const CVE_GREEN  = "#00FF41";
const PAGE_SIZE  = 50;

// ── Types ─────────────────────────────────────────────────────────────────────
type CVEEntry = {
  cve_id: string | null;
  cvss: number | null;
  epss: number | null;
  title: string | null;
  cisa_exploited: boolean;
  targeted_software: string[] | null;
  technique_count: number;
};

type CVEStats = {
  total_cves: number;
  known_exploited: number;
  critical: number;
  high_epss: number;
};

type SoftwareEntry = { product: string; total_vulns: number };
type CisaEntry     = { cve: string; cvss: number | null; title: string | null };

type SidebarData = {
  targeted_software: SoftwareEntry[];
  cisa_exploited: CisaEntry[];
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

function cvssColor(score: number | null): string {
  if (!score) return "rgba(212,212,212,0.25)";
  if (score >= 9) return CVE_RED;
  if (score >= 7) return CVE_ORANGE;
  if (score >= 4) return CVE_YELLOW;
  return CVE_GREEN;
}

function cvssLabel(score: number | null): string {
  if (!score) return "NONE";
  if (score >= 9) return "CRIT";
  if (score >= 7) return "HIGH";
  if (score >= 4) return "MED";
  return "LOW";
}

function epssColor(score: number | null): string {
  if (!score) return "rgba(212,212,212,0.2)";
  if (score >= 0.5) return CVE_RED;
  if (score >= 0.1) return CVE_ORANGE;
  return CVE_CYAN;
}

function fmtEpss(v: number | null): string {
  if (v == null) return "—";
  return `${(v * 100).toFixed(1)}%`;
}

// ── CVE Row ───────────────────────────────────────────────────────────────────
function CVERow({
  item, isDark, onOpenGraph, onHover, onHoverMove, onHoverEnd,
}: {
  item: CVEEntry;
  isDark: boolean;
  onOpenGraph: () => void;
  onHover: (value: string, x: number, y: number) => void;
  onHoverMove: (x: number, y: number) => void;
  onHoverEnd: () => void;
}) {
  const C = isDark ? DARK : LIGHT;
  const [hov, setHov] = useState(false);
  const cc = cvssColor(item.cvss);
  const software = toArray(item.targeted_software);
  const hoverValue = item.cve_id ?? "";

  return (
    <div
      role="button" tabIndex={0}
      onClick={onOpenGraph}
      onKeyDown={(e) => e.key === "Enter" && onOpenGraph()}
      onMouseEnter={(e) => { setHov(true); if (hoverValue) onHover(hoverValue, e.clientX, e.clientY); }}
      onMouseLeave={() => { setHov(false); onHoverEnd(); }}
      onMouseMove={(e) => onHoverMove(e.clientX, e.clientY)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 14px", cursor: "pointer",
        borderBottom: `1px solid ${C.border}`,
        borderLeft: `3px solid ${cc}`,
        background: hov ? C.rowHover : "transparent",
        transition: "background 120ms, border-color 120ms",
        outline: "none",
      }}
    >
      {/* CVE ID */}
      <div style={{
        minWidth: 120, fontWeight: 900, fontSize: 12,
        color: hov ? CVE_ORANGE : C.white,
        letterSpacing: "0.04em", flexShrink: 0,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
      }}>
        {item.cve_id || "—"}
      </div>

      {/* CVSS badge */}
      <div style={{ minWidth: 76, flexShrink: 0, display: "flex", alignItems: "center", gap: 5 }}>
        {item.cvss != null ? (
          <>
            <span style={{
              fontSize: 13, fontWeight: 900, color: cc,
              textShadow: `0 0 10px ${cc}55`,
              fontVariantNumeric: "tabular-nums",
            }}>
              {item.cvss.toFixed(1)}
            </span>
            <span style={{
              fontSize: 10, padding: "1px 5px",
              border: `1px solid ${cc}55`, color: cc, background: `${cc}14`,
            }}>
              {cvssLabel(item.cvss)}
            </span>
          </>
        ) : (
          <span style={{ fontSize: 10, color: C.muted, opacity: 0.5 }}>N/A</span>
        )}
      </div>

      {/* EPSS */}
      <div style={{ minWidth: 56, flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: epssColor(item.epss) }}>
          {fmtEpss(item.epss)}
        </span>
      </div>

      {/* CISA flag */}
      <div style={{ minWidth: 32, flexShrink: 0, display: "flex", justifyContent: "center" }}>
        {item.cisa_exploited && (
          <span style={{
            fontSize: 10, padding: "2px 5px",
            background: `${CVE_RED}22`, border: `1px solid ${CVE_RED}66`,
            color: CVE_RED, letterSpacing: "0.04em", fontWeight: 700,
          }}>
            ⚠
          </span>
        )}
      </div>

      {/* Targeted software */}
      <div style={{ flex: 1, display: "flex", gap: 3, overflow: "hidden", minWidth: 0 }}>
        {software.slice(0, 2).map((s, i) => (
          <span key={i} style={{
            fontSize: 9, padding: "2px 6px",
            border: `1px solid ${CVE_ORANGE}44`, color: CVE_ORANGE,
            whiteSpace: "nowrap", maxWidth: 100,
            overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {s}
          </span>
        ))}
        {software.length > 2 && (
          <span style={{ fontSize: 9, color: C.muted }}>+{software.length - 2}</span>
        )}
      </div>

      {/* Title */}
      <div style={{
        flex: 2, fontSize: 11, color: hov ? C.white : C.muted,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        letterSpacing: "0.01em", minWidth: 0,
      }}>
        {item.title || "—"}
      </div>

      {/* Technique count */}
      {item.technique_count > 0 && (
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 3 }}>
          <Activity size={10} style={{ color: CVE_CYAN }} />
          <span style={{ fontSize: 11, color: CVE_CYAN, fontWeight: 700 }}>
            {item.technique_count}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Left: Software + CISA panel ───────────────────────────────────────────────
function SidebarLeft({
  data, isDark, onCisaClick, onSoftwareClick,
}: {
  data: SidebarData | null;
  isDark: boolean;
  onCisaClick: (cve: string) => void;
  onSoftwareClick: (product: string) => void;
}) {
  const C = isDark ? DARK : LIGHT;
  const mono = "'JetBrains Mono','Fira Code',monospace";
  const [hovSoftware, setHovSoftware] = useState<number | null>(null);

  if (!data) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 8, color: CVE_ORANGE, fontSize: 9, letterSpacing: "0.2em" }}>
      <RefreshCw size={10} className="animate-spin" /> LOADING...
    </div>
  );

  return (
    <div style={{ overflowY: "auto", height: "100%", padding: "12px 10px", display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Targeted Software */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: CVE_ORANGE, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
          <Package size={10} /> TARGETED SOFTWARE
        </div>
        {data.targeted_software.length === 0 ? (
          <div style={{ fontSize: 8, color: C.muted }}>NO_DATA</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {data.targeted_software.map((s, i) => {
              const isHov = hovSoftware === i;
              return (
                <div
                  key={i}
                  role="button" tabIndex={0}
                  onClick={() => onSoftwareClick(s.product)}
                  onKeyDown={(e) => e.key === "Enter" && onSoftwareClick(s.product)}
                  onMouseEnter={() => setHovSoftware(i)}
                  onMouseLeave={() => setHovSoftware(null)}
                  style={{
                    padding: "6px 9px", cursor: "pointer", outline: "none",
                    border: `1px solid ${isHov ? `${CVE_ORANGE}55` : "rgba(249,115,22,0.18)"}`,
                    borderLeft: `2px solid ${isHov ? CVE_ORANGE : "rgba(249,115,22,0.5)"}`,
                    background: isHov ? `${CVE_ORANGE}08` : "transparent",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    transition: "all 100ms",
                  }}
                >
                  <span style={{ fontSize: 11, color: isHov ? C.white : C.muted, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 6, fontFamily: mono, transition: "color 100ms" }}>
                    {s.product}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    {isHov && <span style={{ fontSize: 10, color: CVE_ORANGE, letterSpacing: "0.08em" }}>FILTER →</span>}
                    <span style={{ fontSize: 13, fontWeight: 900, color: CVE_ORANGE, textShadow: `0 0 10px ${CVE_ORANGE}55`, fontVariantNumeric: "tabular-nums" }}>
                      {s.total_vulns}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CISA Known Exploited */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: CVE_RED, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
          <AlertTriangle size={10} /> CISA KNOWN EXPLOITED
        </div>
        {data.cisa_exploited.length === 0 ? (
          <div style={{ fontSize: 8, color: C.muted }}>NO_DATA</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {data.cisa_exploited.map((e, i) => {
              const cc = cvssColor(e.cvss);
              return (
                <div
                  key={i}
                  role="button" tabIndex={0}
                  onClick={() => onCisaClick(e.cve)}
                  onKeyDown={(ev) => ev.key === "Enter" && onCisaClick(e.cve)}
                  style={{
                    padding: "7px 9px", cursor: "pointer", outline: "none",
                    border: `1px solid ${CVE_RED}33`,
                    borderLeft: `2px solid ${CVE_RED}`,
                    background: "rgba(239,68,68,0.03)",
                    transition: "background 100ms",
                  }}
                  onMouseEnter={(ev) => { ev.currentTarget.style.background = "rgba(239,68,68,0.07)"; }}
                  onMouseLeave={(ev) => { ev.currentTarget.style.background = "rgba(239,68,68,0.03)"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: CVE_RED, fontFamily: mono }}>{e.cve}</span>
                    {e.cvss != null && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: cc }}>{e.cvss.toFixed(1)}</span>
                    )}
                  </div>
                  {e.title && (
                    <div style={{ fontSize: 10, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.title}
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

// ── Right: Highest EPSS panel ─────────────────────────────────────────────────
function EPSSPanel({ isDark, onCveClick }: {
  isDark: boolean;
  onCveClick: (cve: string) => void;
}) {
  const C = isDark ? DARK : LIGHT;
  const [epssData, setEpssData] = useState<Array<{ cve: string; cvss: number | null; epss: number | null; title: string | null }>>([]);
  const [loading, setLoading]   = useState(true);
  const mono = "'JetBrains Mono','Fira Code',monospace";

  useEffect(() => {
    fetch("/api/dashboard/explore/cve/feed?limit=12&sort=epss")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.feed) setEpssData(d.feed.map((e: CVEEntry) => ({ cve: e.cve_id ?? "—", cvss: e.cvss, epss: e.epss, title: e.title })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 8, color: CVE_CYAN, fontSize: 9, letterSpacing: "0.2em" }}>
      <RefreshCw size={10} className="animate-spin" /> LOADING...
    </div>
  );

  return (
    <div style={{ overflowY: "auto", height: "100%", padding: "12px 10px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: CVE_CYAN, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
        <Zap size={10} /> HIGHEST EPSS SCORE
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {epssData.map((e, i) => {
          const ec = epssColor(e.epss);
          const cc = cvssColor(e.cvss);
          return (
            <div
              key={i}
              role="button" tabIndex={0}
              onClick={() => onCveClick(e.cve)}
              onKeyDown={(ev) => ev.key === "Enter" && onCveClick(e.cve)}
              style={{
                padding: "8px 8px", cursor: "pointer", outline: "none",
                borderBottom: `1px solid ${C.border}`,
                borderLeft: `2px solid ${ec}`,
                transition: "background 100ms",
              }}
              onMouseEnter={(ev) => { ev.currentTarget.style.background = C.rowHover; }}
              onMouseLeave={(ev) => { ev.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: CVE_CYAN, fontFamily: mono }}>
                  {e.cve}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {e.cvss != null && (
                    <span style={{ fontSize: 11, color: cc, fontWeight: 700 }}>{e.cvss.toFixed(1)}</span>
                  )}
                  <span style={{ fontSize: 11, fontWeight: 900, color: ec }}>{fmtEpss(e.epss)}</span>
                </div>
              </div>
              {/* EPSS bar */}
              <div style={{ height: 2, background: C.border, marginBottom: 4 }}>
                <div style={{
                  width: `${Math.min(100, (e.epss ?? 0) * 100)}%`,
                  height: "100%", background: ec, transition: "width 400ms",
                }} />
              </div>
              {e.title && (
                <div style={{ fontSize: 10, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {e.title}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main CVE Explorer ─────────────────────────────────────────────────────────
export default function CVEExplorer() {
  const router  = useRouter();
  const { isDark } = useTheme();
  const C = isDark ? DARK : LIGHT;

  const [feed,          setFeed]          = useState<CVEEntry[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [stats,         setStats]         = useState<CVEStats | null>(null);
  const [sidebar,       setSidebar]       = useState<SidebarData | null>(null);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<CVEEntry[] | null>(null);
  const [searching,     setSearching]     = useState(false);
  const [page,          setPage]          = useState(0);
  const [sort,          setSort]          = useState<"cvss" | "epss" | "id">("cvss");

  const [hoverIdentity, setHoverIdentity] = useState<string | null>(null);
  const [showPreview,   setShowPreview]   = useState(false);
  const [hoverPos,      setHoverPos]      = useState({ x: 0, y: 0 });

  const mono = "'JetBrains Mono','Fira Code','Courier New',monospace";

  useEffect(() => {
    fetch("/api/dashboard/explore/cve/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setStats(d); })
      .catch(() => {});
    fetch("/api/dashboard/explore/cve/sidebar")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setSidebar(d); })
      .catch(() => {});
  }, []);

  const loadFeed = useCallback(() => {
    setLoading(true);
    fetch(`/api/dashboard/explore/cve/feed?skip=${page * PAGE_SIZE}&limit=${PAGE_SIZE}&sort=${sort}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setFeed(d?.feed ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page, sort]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  useEffect(() => {
    if (!hoverIdentity) { setShowPreview(false); return; }
    const t = setTimeout(() => setShowPreview(true), 380);
    return () => clearTimeout(t);
  }, [hoverIdentity]);

  const handleHover = useCallback((value: string, x: number, y: number) => {
    setHoverPos({ x, y });
    setHoverIdentity((prev) => prev === value ? prev : value);
  }, []);

  const handleHoverMove = useCallback((x: number, y: number) => {
    setHoverPos({ x, y });
  }, []);

  const handleHoverEnd = useCallback(() => {
    setHoverIdentity(null);
    setShowPreview(false);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    const t = setTimeout(() => {
      setSearching(true);
      fetch(`/api/dashboard/explore/cve/search?q=${encodeURIComponent(searchQuery)}`)
        .then((r) => r.json())
        .then((d) => { setSearchResults(d.results ?? []); setSearching(false); })
        .catch(() => setSearching(false));
    }, 380);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const displayItems = searchResults !== null ? searchResults : feed;

  const openGraph = (cveId: string) => {
    router.push(`/explore/graph?type=vulnerability&value=${encodeURIComponent(cveId)}&from=cve`);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: mono }}>

      {/* ── Stats bar ── */}
      <div style={{
        borderBottom: `1px solid ${C.border}`, padding: "6px 24px",
        display: "flex", background: C.accentFaint, flexShrink: 0,
      }}>
        {([
          { label: "TOTAL CVEs",       value: stats?.total_cves,      color: C.white    },
          { label: "CISA EXPLOITED",   value: stats?.known_exploited, color: CVE_RED    },
          { label: "CRITICAL CVSS≥9",  value: stats?.critical,        color: CVE_ORANGE },
          { label: "HIGH EPSS ≥50%",   value: stats?.high_epss,       color: CVE_CYAN   },
        ] as const).map(({ label, value, color }, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            paddingRight: 24, marginRight: 24,
            borderRight: i < 3 ? `1px solid ${C.border}` : "none",
          }}>
            <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em" }}>{label}</span>
            <span style={{
              fontSize: 15, fontWeight: 900, color,
              textShadow: `0 0 12px ${color}55`,
              fontVariantNumeric: "tabular-nums",
            }}>
              {value != null ? value.toLocaleString() : "—"}
            </span>
          </div>
        ))}
      </div>

      {/* ── Search bar ── */}
      <div style={{
        padding: "10px 24px", borderBottom: `1px solid ${C.border}`,
        background: C.surface, flexShrink: 0,
      }}>
        <div style={{
          display: "flex",
          border: `1px solid ${searchQuery ? CVE_ORANGE : `${CVE_ORANGE}44`}`,
          background: `${CVE_ORANGE}04`,
          boxShadow: searchQuery ? `0 0 14px ${CVE_ORANGE}22` : "none",
          transition: "border-color 160ms, box-shadow 160ms",
        }}>
          <div style={{ display: "flex", alignItems: "center", padding: "0 13px", color: C.muted }}>
            <Search size={13} />
          </div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by CVE-ID (e.g. CVE-2024-1234) or keyword…"
            style={{
              flex: 1, padding: "10px 6px",
              background: "transparent", border: "none", outline: "none",
              fontFamily: mono, fontSize: 13, color: C.white, letterSpacing: "0.04em",
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

      {/* ── Main 3-column layout ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* ─ Left: Software + CISA panel ─ */}
        <div style={{
          width: 300, flexShrink: 0, display: "flex", flexDirection: "column",
          borderRight: `1px solid ${C.border}`, overflow: "hidden",
          background: C.surface,
        }}>
          <div style={{
            padding: "8px 12px", borderBottom: `1px solid ${C.border}`,
            background: C.accentFaint, fontSize: 11,
            color: C.muted, letterSpacing: "0.12em", flexShrink: 0,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Shield size={8} style={{ color: CVE_ORANGE }} /> VULNERABILITY INTELLIGENCE
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <SidebarLeft
              data={sidebar}
              isDark={isDark}
              onCisaClick={openGraph}
              onSoftwareClick={(product) => setSearchQuery(product)}
            />
          </div>
        </div>

        {/* ─ Center: CVE Feed ─ */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          borderRight: `1px solid ${C.border}`, overflow: "hidden", minWidth: 0,
        }}>
          {/* Feed controls */}
          <div style={{
            padding: "7px 14px", borderBottom: `1px solid ${C.border}`,
            background: C.surface,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, color: C.muted, letterSpacing: "0.10em" }}>
              {searchResults !== null
                ? `SEARCH — ${searchResults.length} RESULT${searchResults.length !== 1 ? "S" : ""} FOR "${searchQuery}"`
                : `CVE DATABASE · PAGE ${page + 1} · ${feed.length} RECORDS`}
            </span>

            {!searchResults && (
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                {(["cvss", "epss", "id"] as const).map((s, i) => (
                  <button key={s} onClick={() => { setSort(s); setPage(0); }} style={{
                    padding: "5px 11px", fontSize: 10, fontWeight: 700, letterSpacing: "0.10em",
                    background: sort === s ? `${CVE_ORANGE}18` : "transparent",
                    border: `1px solid ${sort === s ? CVE_ORANGE : C.border}`,
                    borderRight: i < 2 ? "none" : undefined,
                    color: sort === s ? CVE_ORANGE : C.muted,
                    cursor: "pointer", fontFamily: mono,
                  }}>
                    {s === "cvss" ? "BY CVSS" : s === "epss" ? "BY EPSS" : "BY ID"}
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

          {/* Column headers */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "6px 14px 6px 17px", borderBottom: `1px solid ${C.border}`,
            background: C.altRow, fontSize: 10,
            color: C.muted, letterSpacing: "0.12em", flexShrink: 0, opacity: 0.8,
          }}>
            <div style={{ minWidth: 120, flexShrink: 0 }}>CVE-ID</div>
            <div style={{ minWidth: 76, flexShrink: 0 }}>CVSS</div>
            <div style={{ minWidth: 56, flexShrink: 0 }}>EPSS</div>
            <div style={{ minWidth: 32, flexShrink: 0 }}>CISA</div>
            <div style={{ flex: 1 }}>SOFTWARE</div>
            <div style={{ flex: 2 }}>TITLE</div>
            <div style={{ flexShrink: 0, width: 36 }}>TTP</div>
          </div>

          {/* Rows */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: 120, gap: 8, color: CVE_ORANGE, fontSize: 11, letterSpacing: "0.2em",
              }}>
                <RefreshCw size={12} className="animate-spin" /> LOADING_CVEs...
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
                <CVERow
                  key={item.cve_id || `cve-${i}`}
                  item={item}
                  isDark={isDark}
                  onOpenGraph={() => openGraph(item.cve_id ?? "")}
                  onHover={handleHover}
                  onHoverMove={handleHoverMove}
                  onHoverEnd={handleHoverEnd}
                />
              ))
            )}
          </div>
        </div>

        {/* ─ Right: Highest EPSS ─ */}
        <div style={{
          width: 240, flexShrink: 0, display: "flex",
          flexDirection: "column", overflow: "hidden",
          background: C.surface,
        }}>
          <div style={{
            padding: "8px 12px", borderBottom: `1px solid ${C.border}`,
            background: C.accentFaint, fontSize: 11,
            color: C.muted, letterSpacing: "0.12em", flexShrink: 0,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Zap size={8} style={{ color: CVE_CYAN }} /> HIGHEST EXPLOIT PROBABILITY
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <EPSSPanel isDark={isDark} onCveClick={openGraph} />
          </div>

          {/* Legend */}
          <div style={{
            borderTop: `1px solid ${C.border}`, padding: "10px 12px",
            background: C.surface, flexShrink: 0,
          }}>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em", marginBottom: 7 }}>▶ CVSS SEVERITY</div>
            {[
              { label: "CRITICAL  ≥9.0", color: CVE_RED    },
              { label: "HIGH      ≥7.0", color: CVE_ORANGE },
              { label: "MEDIUM    ≥4.0", color: CVE_YELLOW },
              { label: "LOW       <4.0", color: CVE_GREEN  },
            ].map(({ label, color }, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color, letterSpacing: "0.05em", marginBottom: 5 }}>
                <div style={{ width: 10, height: 2, background: color, flexShrink: 0 }} />
                {label}
              </div>
            ))}
            <div style={{ marginTop: 7, fontSize: 10, color: C.muted, letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: 4 }}>
              <AlertTriangle size={10} style={{ color: CVE_RED }} /> CISA = ACTIVELY EXPLOITED
            </div>
          </div>
        </div>
      </div>

      {showPreview && hoverIdentity && (
        <NodeHoverPreview
          type="vulnerability"
          value={hoverIdentity}
          mouseX={hoverPos.x}
          mouseY={hoverPos.y}
        />
      )}
    </div>
  );
}
