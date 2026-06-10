"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Rss, RefreshCw, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/lib/theme";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  source_color: string;
  date: string;
  iso_date: string;
  summary: string;
}

function Brackets({ color, size = 8 }: { color: string; size?: number }) {
  const corner = (top: boolean, right: boolean): React.CSSProperties => ({
    position: "absolute", width: size, height: size,
    ...(top ? { top: -1 } : { bottom: -1 }),
    ...(right ? { right: -1 } : { left: -1 }),
    borderTop: top ? `1px solid ${color}` : undefined,
    borderBottom: !top ? `1px solid ${color}` : undefined,
    borderLeft: !right ? `1px solid ${color}` : undefined,
    borderRight: right ? `1px solid ${color}` : undefined,
  });
  return (
    <>
      <div style={corner(true, false)} />
      <div style={corner(true, true)} />
      <div style={corner(false, false)} />
      <div style={corner(false, true)} />
    </>
  );
}

function NewsCard({ item, C, isDark }: { item: NewsItem; C: ReturnType<typeof useTheme>["C"]; isDark: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", flexDirection: "column", gap: 10,
        padding: "16px 18px", textDecoration: "none",
        border: `1px solid ${hov ? item.source_color + "55" : C.border}`,
        background: hov ? `${item.source_color}06` : C.surface,
        position: "relative", transition: "border-color 150ms, background 150ms",
        boxSizing: "border-box", cursor: "pointer", flex: 1, minWidth: 0,
      }}
    >
      <Brackets color={hov ? item.source_color : C.border} size={7} />

      {/* Source + date row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{
          fontSize: 8, fontWeight: 700, letterSpacing: "0.18em",
          color: item.source_color, padding: "2px 7px",
          border: `1px solid ${item.source_color}44`,
          background: `${item.source_color}11`,
          whiteSpace: "nowrap", flexShrink: 0,
        }}>
          {item.source.toUpperCase()}
        </span>
        <span style={{ fontSize: 8, color: C.muted, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
          {item.date}
        </span>
      </div>

      {/* Title */}
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
        color: hov ? "#fff" : C.white, lineHeight: 1.45,
        transition: "color 150ms",
      }}>
        {item.title}
      </div>

      {/* Summary */}
      {item.summary && (
        <div style={{
          fontSize: 9, color: C.muted, lineHeight: 1.6,
          letterSpacing: "0.03em", flexGrow: 1,
        }}>
          {item.summary}
        </div>
      )}

      {/* Read more */}
      <div style={{
        display: "flex", alignItems: "center", gap: 5, marginTop: 2,
        fontSize: 8, letterSpacing: "0.14em",
        color: hov ? item.source_color : C.muted,
        transition: "color 150ms",
      }}>
        <ExternalLink size={9} />
        READ FULL ARTICLE
      </div>
    </a>
  );
}

export default function NewsFeed() {
  const { C, isDark } = useTheme();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load(bust = false) {
    try {
      const url = bust ? `/api/dashboard/news?bust=${Date.now()}` : "/api/dashboard/news";
      const resp = await fetch(url, { cache: "no-store" });
      if (!resp.ok) throw new Error("fetch failed");
      const data = await resp.json();
      setItems(data.items || []);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleRefresh() {
    setRefreshing(true);
    load(true);
  }

  return (
    <div style={{ width: "100%", maxWidth: 780 }}>
      {/* Section header */}
      <div style={{
        fontSize: 9, letterSpacing: "0.28em", color: C.muted,
        marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: C.redDim }}>——</span>
          <Rss size={9} style={{ color: C.red }} />
          THREAT INTELLIGENCE NEWS
          <span style={{ color: C.redDim }}>——</span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          title="Refresh feed"
          style={{
            background: "none", border: `1px solid ${C.border}`, color: C.muted,
            cursor: "pointer", padding: "3px 8px", fontFamily: C.mono,
            fontSize: 8, letterSpacing: "0.12em", display: "flex", alignItems: "center", gap: 4,
            opacity: (refreshing || loading) ? 0.4 : 1, transition: "opacity 150ms",
          }}
        >
          <RefreshCw size={8} style={{ animation: refreshing ? "spin 1s linear infinite" : undefined }} />
          {refreshing ? "LOADING" : "REFRESH"}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10,
        }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{
              height: 160, border: `1px solid ${C.border}`, background: C.surface,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(90deg, transparent, ${isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)"}, transparent)`,
                animation: "shimmer 1.5s infinite",
              }} />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div style={{
          padding: "24px", border: `1px solid ${C.redDim}`, background: "rgba(232,84,25,0.04)",
          color: C.muted, fontSize: 10, letterSpacing: "0.1em", textAlign: "center",
        }}>
          // FEED UNAVAILABLE — network error or RSS source unreachable
        </div>
      )}

      {/* News grid */}
      {!loading && !error && items.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 10,
          alignItems: "stretch",
        }}>
          {items.map((item, idx) => (
            <NewsCard key={idx} item={item} C={C} isDark={isDark} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <div style={{
          padding: "24px", border: `1px solid ${C.border}`,
          color: C.muted, fontSize: 10, letterSpacing: "0.1em", textAlign: "center",
        }}>
          // NO NEWS ITEMS AVAILABLE
        </div>
      )}

      {/* Explore all link */}
      {!loading && !error && items.length > 0 && (
        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
          <Link
            href="/news"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 8, letterSpacing: "0.18em", color: C.muted,
              textDecoration: "none", padding: "5px 10px",
              border: `1px solid ${C.border}`,
              transition: "color 150ms, border-color 150ms",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = C.red;
              (e.currentTarget as HTMLElement).style.borderColor = C.redDim;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = C.muted;
              (e.currentTarget as HTMLElement).style.borderColor = C.border;
            }}
          >
            EXPLORE ALL NEWS
            <ChevronRight size={9} />
          </Link>
        </div>
      )}

      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
