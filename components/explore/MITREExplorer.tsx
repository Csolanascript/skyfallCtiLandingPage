"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, RefreshCw, X, Target, Users, Bug,
  Shield, ChevronLeft, ChevronRight, AlertTriangle,
  Network, Activity,
} from "lucide-react";
import NodeHoverPreview from "./NodeHoverPreview";
import { useTheme, DARK, LIGHT } from "@/lib/theme";

const CYAN    = "#22d3ee";
const GREEN   = "#00FF41";
const PAGE_SIZE = 50;

// ── Types ─────────────────────────────────────────────────────────────────────
type TechniqueEntry = {
  id: string | null;
  mitre_id: string;
  name: string;
  description: string | null;
  platforms: string[] | string | null;
  actor_count: number;
  malware_count: number;
  mitigation_count: number;
  top_actors: string[] | null;
  top_malware: string[] | null;
};

type MITREStats = {
  total_techniques: number;
  total_actors: number;
  total_malware: number;
  total_mitigations: number;
};

type TopActor = {
  name: string;
  aliases: string[] | string | null;
  technique_count: number;
  malware_used: string[] | null;
};

type TopMalware = {
  name: string;
  platforms: string[] | string | null;
  technique_count: number;
};

type SidebarData = {
  top_actors: TopActor[];
  top_malware: TopMalware[];
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

// ── Technique Row ─────────────────────────────────────────────────────────────
function TechniqueRow({
  item,
  onOpenGraph,
  onHover,
  onHoverMove,
  onHoverEnd,
  isDark,
}: {
  item: TechniqueEntry;
  onOpenGraph: () => void;
  onHover: (value: string, x: number, y: number) => void;
  onHoverMove: (x: number, y: number) => void;
  onHoverEnd: () => void;
  isDark: boolean;
}) {
  const C = { ...(isDark ? DARK : LIGHT), cyan: CYAN };
  const [hov, setHov] = useState(false);
  const platforms = toArray(item.platforms).slice(0, 3);
  const hoverValue = item.mitre_id || item.name;

  const mitigated = item.mitigation_count > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenGraph}
      onKeyDown={(e) => e.key === "Enter" && onOpenGraph()}
      onMouseEnter={(e) => { setHov(true); onHover(hoverValue, e.clientX, e.clientY); }}
      onMouseLeave={() => { setHov(false); onHoverEnd(); }}
      onMouseMove={(e) => onHoverMove(e.clientX, e.clientY)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 14px", cursor: "pointer",
        borderBottom: `1px solid ${C.border}`,
        borderLeft: `3px solid ${hov ? CYAN : `${CYAN}44`}`,
        background: hov ? C.rowHover : "transparent",
        transition: "background 120ms, border-color 120ms",
        outline: "none",
      }}
    >
      {/* MITRE ID */}
      <div style={{
        minWidth: 72, fontWeight: 900, fontSize: 12,
        color: CYAN, letterSpacing: "0.06em", flexShrink: 0,
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
      }}>
        {item.mitre_id || "—"}
      </div>

      {/* Name */}
      <div style={{
        flex: 1, fontWeight: 700, fontSize: 13,
        color: hov ? C.white : C.muted,
        letterSpacing: "0.02em",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {item.name}
      </div>

      {/* Platforms */}
      <div style={{ display: "flex", gap: 3, flexShrink: 0, minWidth: 130 }}>
        {platforms.map((p, i) => (
          <span key={i} style={{
            padding: "2px 6px", fontSize: 9, letterSpacing: "0.04em",
            border: `1px solid ${CYAN}44`, color: `${CYAN}cc`,
            whiteSpace: "nowrap",
          }}>
            {p.replace("Windows", "WIN").replace("macOS", "MAC").replace("Linux", "LNX")}
          </span>
        ))}
        {toArray(item.platforms).length > 3 && (
          <span style={{ fontSize: 9, color: C.muted }}>+{toArray(item.platforms).length - 3}</span>
        )}
      </div>

      {/* Actor count */}
      <div style={{ minWidth: 56, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
        <Users size={10} style={{ color: "#a855f7", flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: item.actor_count > 0 ? "#a855f7" : C.muted }}>
          {item.actor_count}
        </span>
      </div>

      {/* Malware count */}
      <div style={{ minWidth: 56, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
        <Bug size={10} style={{ color: "#FF8C00", flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: item.malware_count > 0 ? "#FF8C00" : C.muted }}>
          {item.malware_count}
        </span>
      </div>

      {/* Mitigation badge */}
      <div style={{ minWidth: 22, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {mitigated ? (
          <Shield size={11} style={{ color: GREEN }} />
        ) : (
          <AlertTriangle size={10} style={{ color: C.border }} />
        )}
      </div>
    </div>
  );
}

// ── Left: Top Actors Panel ────────────────────────────────────────────────────
function ActorsPanel({
  actors,
  onActorClick,
  onHover,
  onHoverMove,
  onHoverEnd,
  isDark,
}: {
  actors: TopActor[];
  onActorClick: (name: string) => void;
  onHover: (value: string, x: number, y: number) => void;
  onHoverMove: (x: number, y: number) => void;
  onHoverEnd: () => void;
  isDark: boolean;
}) {
  const C = { ...(isDark ? DARK : LIGHT), cyan: CYAN };
  const [hovIdx, setHovIdx] = useState<number | null>(null);

  if (actors.length === 0) {
    return (
      <div style={{ padding: "20px 14px", fontSize: 11, color: C.muted, letterSpacing: "0.15em" }}>
        NO_ACTOR_DATA
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {actors.map((actor, i) => {
        const malware = toArray(actor.malware_used).slice(0, 2);
        const isHov = hovIdx === i;
        return (
          <div
            key={i}
            role="button"
            tabIndex={0}
            onClick={() => onActorClick(actor.name)}
            onKeyDown={(e) => e.key === "Enter" && onActorClick(actor.name)}
            onMouseEnter={(e) => { setHovIdx(i); onHover(actor.name, e.clientX, e.clientY); }}
            onMouseLeave={() => { setHovIdx(null); onHoverEnd(); }}
            onMouseMove={(e) => onHoverMove(e.clientX, e.clientY)}
            style={{
              padding: "8px 12px",
              borderBottom: `1px solid ${C.border}`,
              borderLeft: `3px solid ${isHov ? "#a855f7" : "rgba(168,85,247,0.3)"}`,
              background: isHov ? "rgba(168,85,247,0.06)" : "transparent",
              cursor: "pointer", outline: "none",
              transition: "background 120ms, border-color 120ms",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, color: isHov ? "#a855f7" : C.white,
                letterSpacing: "0.02em", flex: 1, paddingRight: 6,
              }}>
                {actor.name}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 900, color: CYAN,
                flexShrink: 0, letterSpacing: "0.04em",
              }}>
                {actor.technique_count}
                <span style={{ fontSize: 9, color: C.muted, marginLeft: 2 }}>T</span>
              </span>
            </div>
            {malware.length > 0 && (
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {malware.map((m, j) => (
                  <span key={j} style={{
                    fontSize: 9, padding: "2px 5px",
                    border: `1px solid ${C.orange}44`, color: C.orange,
                  }}>{m}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Right: Top Malware Panel ──────────────────────────────────────────────────
function MalwarePanel({
  malware,
  onMalwareClick,
  isDark,
}: {
  malware: TopMalware[];
  onMalwareClick: (name: string) => void;
  isDark: boolean;
}) {
  const C = { ...(isDark ? DARK : LIGHT), cyan: CYAN };
  const [hovIdx, setHovIdx] = useState<number | null>(null);

  if (malware.length === 0) {
    return (
      <div style={{ padding: "20px 14px", fontSize: 11, color: C.muted, letterSpacing: "0.15em" }}>
        NO_MALWARE_DATA
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {malware.map((m, i) => {
        const platforms = toArray(m.platforms).slice(0, 2);
        const isHov = hovIdx === i;
        return (
          <div
            key={i}
            role="button"
            tabIndex={0}
            onClick={() => onMalwareClick(m.name)}
            onKeyDown={(e) => e.key === "Enter" && onMalwareClick(m.name)}
            onMouseEnter={() => setHovIdx(i)}
            onMouseLeave={() => setHovIdx(null)}
            style={{
              padding: "8px 12px",
              borderBottom: `1px solid ${C.border}`,
              borderLeft: `3px solid ${isHov ? "#FF8C00" : "rgba(255,140,0,0.3)"}`,
              background: isHov ? "rgba(255,140,0,0.05)" : "transparent",
              cursor: "pointer", outline: "none",
              transition: "background 120ms, border-color 120ms",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, color: isHov ? "#FF8C00" : C.white,
                flex: 1, paddingRight: 6,
              }}>
                {m.name}
              </span>
              <span style={{ fontSize: 11, fontWeight: 900, color: CYAN, flexShrink: 0 }}>
                {m.technique_count}
                <span style={{ fontSize: 9, color: C.muted, marginLeft: 2 }}>T</span>
              </span>
            </div>
            {platforms.length > 0 && (
              <div style={{ display: "flex", gap: 3 }}>
                {platforms.map((p, j) => (
                  <span key={j} style={{
                    fontSize: 9, padding: "2px 5px",
                    border: `1px solid ${CYAN}33`, color: `${CYAN}99`,
                  }}>{p}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main MITRE Explorer ───────────────────────────────────────────────────────
export default function MITREExplorer() {
  const router = useRouter();
  const { isDark } = useTheme();
  const C = { ...(isDark ? DARK : LIGHT), cyan: CYAN };

  const [feed,          setFeed]          = useState<TechniqueEntry[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [stats,         setStats]         = useState<MITREStats | null>(null);
  const [sidebar,       setSidebar]       = useState<SidebarData | null>(null);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<TechniqueEntry[] | null>(null);
  const [searching,     setSearching]     = useState(false);
  const [page,          setPage]          = useState(0);
  const [sort,          setSort]          = useState<"usage" | "name" | "id">("usage");

  const [hoverIdentity, setHoverIdentity] = useState<{ value: string; x: number; y: number } | null>(null);
  const [showPreview,   setShowPreview]   = useState(false);
  const [hoverPos,      setHoverPos]      = useState({ x: 0, y: 0 });

  // Stats + sidebar (once)
  useEffect(() => {
    fetch("/api/dashboard/explore/mitre/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setStats(d); })
      .catch(() => {});
    fetch("/api/dashboard/explore/mitre/sidebar")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setSidebar(d); })
      .catch(() => {});
  }, []);

  // Feed
  const loadFeed = useCallback(() => {
    setLoading(true);
    fetch(`/api/dashboard/explore/mitre/feed?skip=${page * PAGE_SIZE}&limit=${PAGE_SIZE}&sort=${sort}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setFeed(d?.feed ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page, sort]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  // Hover preview timer
  useEffect(() => {
    if (!hoverIdentity) { setShowPreview(false); return; }
    const t = setTimeout(() => setShowPreview(true), 380);
    return () => clearTimeout(t);
  }, [hoverIdentity]);

  const handleHover = useCallback((value: string, x: number, y: number) => {
    setHoverPos({ x, y });
    setHoverIdentity((prev) => prev?.value === value ? prev : { value, x, y });
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
      fetch(`/api/dashboard/explore/mitre/search?q=${encodeURIComponent(searchQuery)}`)
        .then((r) => r.json())
        .then((d) => { setSearchResults(d.results ?? []); setSearching(false); })
        .catch(() => setSearching(false));
    }, 380);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const displayItems = searchResults !== null ? searchResults : feed;

  const mono = "'JetBrains Mono','Fira Code','Courier New',monospace";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: mono }}>

      {/* ── Stats bar ── */}
      <div style={{
        borderBottom: `1px solid ${C.border}`, padding: "6px 24px",
        display: "flex", background: C.accentFaint, flexShrink: 0,
      }}>
        {([
          { label: "TECHNIQUES",    value: stats?.total_techniques, color: CYAN              },
          { label: "ACTIVE ACTORS", value: stats?.total_actors,     color: "#a855f7"         },
          { label: "MALWARE FAMS",  value: stats?.total_malware,    color: "#FF8C00"         },
          { label: "MITIGATIONS",   value: stats?.total_mitigations, color: GREEN            },
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
          border: `1px solid ${searchQuery ? CYAN : `${CYAN}44`}`,
          background: `${CYAN}04`,
          boxShadow: searchQuery ? `0 0 14px ${CYAN}22` : "none",
          transition: "border-color 160ms, box-shadow 160ms",
        }}>
          <div style={{ display: "flex", alignItems: "center", padding: "0 13px", color: C.muted }}>
            <Search size={13} />
          </div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search technique by name, T#### ID…"
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

        {/* ─ Left: Threat Actors ─ */}
        <div style={{
          width: 320, flexShrink: 0, display: "flex", flexDirection: "column",
          borderRight: `1px solid ${C.border}`, overflow: "hidden",
          background: C.surface,
        }}>
          <div style={{
            padding: "8px 12px", borderBottom: `1px solid ${C.border}`,
            background: C.accentFaint, fontSize: 11,
            color: C.muted, letterSpacing: "0.12em", flexShrink: 0,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Users size={8} style={{ color: "#a855f7" }} /> THREAT ACTORS
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <ActorsPanel
              actors={sidebar?.top_actors ?? []}
              onActorClick={(name) => router.push(`/explore/graph?type=group&value=${encodeURIComponent(name)}&from=mitre`)}
              onHover={(v, x, y) => handleHover(v, x, y)}
              onHoverMove={handleHoverMove}
              onHoverEnd={handleHoverEnd}
              isDark={isDark}
            />
          </div>
        </div>

        {/* ─ Center: Technique Feed ─ */}
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
                : `MITRE ATT&CK · PAGE ${page + 1} · ${feed.length} TECHNIQUES`}
            </span>

            {!searchResults && (
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                {(["usage", "name", "id"] as const).map((s, i) => (
                  <button key={s} onClick={() => { setSort(s); setPage(0); }} style={{
                    padding: "5px 11px", fontSize: 10, fontWeight: 700, letterSpacing: "0.10em",
                    background: sort === s ? `${CYAN}18` : "transparent",
                    border: `1px solid ${sort === s ? CYAN : C.border}`,
                    borderRight: i < 2 ? "none" : undefined,
                    color: sort === s ? CYAN : C.muted,
                    cursor: "pointer", fontFamily: mono,
                  }}>
                    {s === "usage" ? "BY USAGE" : s === "name" ? "BY NAME" : "BY ID"}
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
            <div style={{ minWidth: 72, flexShrink: 0 }}>ID</div>
            <div style={{ flex: 1 }}>TECHNIQUE NAME</div>
            <div style={{ minWidth: 130, flexShrink: 0 }}>PLATFORMS</div>
            <div style={{ minWidth: 56, flexShrink: 0, display: "flex", alignItems: "center", gap: 3 }}>
              <Users size={9} /> ACTORS
            </div>
            <div style={{ minWidth: 56, flexShrink: 0, display: "flex", alignItems: "center", gap: 3 }}>
              <Bug size={9} /> MALWARE
            </div>
            <div style={{ minWidth: 22, flexShrink: 0 }}>
              <Shield size={9} />
            </div>
          </div>

          {/* Rows */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: 120, gap: 8, color: CYAN, fontSize: 11, letterSpacing: "0.2em",
              }}>
                <RefreshCw size={12} className="animate-spin" /> LOADING_TECHNIQUES...
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
                <TechniqueRow
                  key={item.id || `${item.mitre_id}-${i}`}
                  item={item}
                  onOpenGraph={() => router.push(
                    `/explore/graph?type=technique&value=${encodeURIComponent(item.mitre_id || item.name)}&from=mitre`
                  )}
                  onHover={(v, x, y) => handleHover(v, x, y)}
                  onHoverMove={handleHoverMove}
                  onHoverEnd={handleHoverEnd}
                  isDark={isDark}
                />
              ))
            )}
          </div>
        </div>

        {/* ─ Right: Top Malware ─ */}
        <div style={{
          width: 260, flexShrink: 0, display: "flex",
          flexDirection: "column", overflow: "hidden",
          background: C.surface,
        }}>
          <div style={{
            padding: "8px 12px", borderBottom: `1px solid ${C.border}`,
            background: C.accentFaint, fontSize: 11,
            color: C.muted, letterSpacing: "0.12em", flexShrink: 0,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Bug size={8} style={{ color: "#FF8C00" }} /> MALWARE FAMILIES
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            <MalwarePanel
              malware={sidebar?.top_malware ?? []}
              onMalwareClick={(name) => router.push(`/explore/graph?type=malware&value=${encodeURIComponent(name)}&from=mitre`)}
              isDark={isDark}
            />
          </div>

          {/* Bottom: legend */}
          <div style={{
            borderTop: `1px solid ${C.border}`, padding: "10px 12px",
            background: C.surface, flexShrink: 0,
          }}>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em", marginBottom: 8 }}>▶ LEGEND</div>
            {[
              { icon: <Shield size={10} style={{ color: GREEN }} />,          label: "MITIGATED",     color: GREEN    },
              { icon: <AlertTriangle size={10} style={{ color: C.muted }} />, label: "NO MITIGATION", color: C.muted  },
              { icon: <Users size={10} style={{ color: "#a855f7" }} />,       label: "ACTOR COUNT",   color: "#a855f7"},
              { icon: <Bug size={10} style={{ color: "#FF8C00" }} />,         label: "MALWARE COUNT", color: "#FF8C00"},
              { icon: <Activity size={10} style={{ color: CYAN }} />,         label: "TECHNIQUE ID",  color: CYAN     },
              { icon: <Network size={10} style={{ color: C.muted }} />,       label: "CLICK = 3D GRAPH", color: C.muted },
            ].map(({ icon, label, color }, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 10, color, letterSpacing: "0.07em", marginBottom: 6,
              }}>
                {icon} {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2D Hover Preview ── */}
      {showPreview && hoverIdentity && (
        <NodeHoverPreview
          type="technique"
          value={hoverIdentity.value}
          mouseX={hoverPos.x}
          mouseY={hoverPos.y}
        />
      )}
    </div>
  );
}
