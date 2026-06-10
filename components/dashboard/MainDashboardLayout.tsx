"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare, ExternalLink, Database,
  Globe, Hash, Server, Zap, Search, Sun, Moon, Cpu, LayoutGrid,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import NewsFeed from "@/components/dashboard/NewsFeed";
import NologinLogo from "@/components/ui/NologinLogo";

type IocType = "auto" | "ip" | "hash" | "domain";

function detectIocType(value: string): "ip" | "hash" | "domain" {
  const v = value.trim();
  if (/^(\d{1,3}\.){3}\d{1,3}(\/\d+)?$/.test(v)) return "ip";
  if (/^[0-9a-fA-F:]+$/.test(v) && v.includes(":") && v.length > 6) return "ip";
  if (/^[0-9a-fA-F]{32}$/.test(v) || /^[0-9a-fA-F]{40}$/.test(v) || /^[0-9a-fA-F]{64}$/.test(v) || /^[0-9a-fA-F]{128}$/.test(v)) return "hash";
  return "domain";
}

const ROUTE: Record<"ip" | "hash" | "domain", string> = {
  ip:     "/demo",
  hash:   "/demo",
  domain: "/demo",
};

const TYPE_META: Record<IocType, { label: string; icon: typeof Server; hint: string }> = {
  auto:   { label: "AUTO",   icon: Zap,    hint: "Auto detection" },
  ip:     { label: "IP",     icon: Server, hint: "IPv4 / IPv6" },
  hash:   { label: "HASH",   icon: Hash,   hint: "MD5 / SHA1 / SHA256" },
  domain: { label: "DOMAIN", icon: Globe,  hint: "Domain / URL" },
};

const IOC_TYPES: IocType[] = ["auto", "ip", "hash", "domain"];

function Brackets({ color, size = 10 }: { color: string; size?: number }) {
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
      <div style={corner(true,  false)} />
      <div style={corner(true,  true)}  />
      <div style={corner(false, false)} />
      <div style={corner(false, true)}  />
    </>
  );
}

function Scanlines({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9998,
      background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.07) 3px,rgba(0,0,0,0.07) 4px)",
    }} />
  );
}

function ExploreCard({
  href, icon: Icon, label, desc, accentColor, C,
}: {
  href: string;
  icon: typeof MessageSquare;
  label: string;
  desc: string;
  accentColor: string;
  C: { white: string; muted: string; border: string; surface: string; redDim: string };
}) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "flex-start", gap: 14,
        padding: "18px 20px", textDecoration: "none",
        border: `1px solid ${hov ? accentColor + "66" : C.border}`,
        background: hov ? `${accentColor}08` : C.surface,
        position: "relative", transition: "border-color 160ms, background 160ms",
        boxSizing: "border-box",
      }}
    >
      <Brackets color={hov ? accentColor : C.redDim} size={8} />
      <div style={{
        width: 36, height: 36, flexShrink: 0, display: "flex",
        alignItems: "center", justifyContent: "center",
        border: `1px solid ${accentColor}44`,
        background: `${accentColor}11`,
        color: accentColor,
        boxShadow: hov ? `0 0 14px ${accentColor}44` : "none",
        transition: "box-shadow 160ms",
      }}>
        <Icon size={16} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, letterSpacing: "0.16em",
          color: hov ? accentColor : C.white, marginBottom: 5,
          transition: "color 160ms",
        }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, letterSpacing: "0.04em" }}>
          {desc}
        </div>
      </div>
    </Link>
  );
}

export default function MainDashboardLayout() {
  const router = useRouter();
  const { C, isDark, toggle } = useTheme();
  const [ioc, setIoc] = useState("");
  const [type, setType] = useState<IocType>("auto");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAnalyze() {
    const value = ioc.trim();
    if (!value) { inputRef.current?.focus(); return; }
    const resolved = type === "auto" ? detectIocType(value) : type;
    router.push(`${ROUTE[resolved]}?observable=${encodeURIComponent(value)}`);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleAnalyze();
  }

  const detectedLabel = ioc.trim()
    ? (type === "auto" ? detectIocType(ioc.trim()).toUpperCase() : type.toUpperCase())
    : null;

  return (
    <div style={{
      background: C.bg, color: C.white, minHeight: "100vh",
      fontFamily: C.mono, fontSize: 14, position: "relative",
      display: "flex", flexDirection: "column",
    }}>
      <Scanlines visible={isDark} />

      <header style={{
        borderBottom: `1px solid ${C.redDim}`, padding: "10px 28px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: C.surface, position: "sticky", top: 0, zIndex: 200,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 3, height: 22, background: C.red, boxShadow: C.redGlow, flexShrink: 0 }} />
          <NologinLogo height={28} />
          <div style={{ width: 1, height: 22, background: C.border, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "0.38em", color: C.white }}>
              SKYFALL_CTI
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 10, color: C.muted }}>
          <button
            onClick={toggle}
            style={{
              background: "none", border: `1px solid ${C.redDim}`,
              color: C.muted, cursor: "pointer", padding: "4px 10px",
              display: "flex", alignItems: "center", gap: 5,
              fontFamily: C.mono, fontSize: 9, letterSpacing: "0.12em",
            }}
          >
            {isDark ? <Sun size={10} /> : <Moon size={10} />}
            {isDark ? "LIGHT" : "DARK"}
          </button>
        </div>
      </header>

      <main style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "60px 28px 40px", boxSizing: "border-box",
        gap: 64,
      }}>
        {/* Search block */}
        <div style={{ width: "100%", maxWidth: 780, display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", color: C.red, marginBottom: 10 }}>
              ▶ SKYFALL_CTI — THREAT_INTELLIGENCE_PLATFORM
            </div>
            <div style={{
              fontSize: "clamp(1.6rem, 4vw, 2.6rem)", fontWeight: 900,
              letterSpacing: "0.04em", lineHeight: 1.1, color: C.white,
            }}>
              IOC ANALYSIS ENGINE
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 8, letterSpacing: "0.1em" }}>
              Submit an IP address, file hash, or domain to trigger automated threat intelligence analysis
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <Brackets color={focused ? C.red : "rgba(232,84,25,0.4)"} size={14} />
            <div style={{
              display: "flex", gap: 0,
              border: `1px solid ${focused ? C.red : C.redDim}`,
              background: "rgba(232,84,25,0.03)",
              transition: "border-color 160ms",
              boxShadow: focused ? C.redGlow : "none",
            }}>
              <input
                ref={inputRef}
                value={ioc}
                onChange={(e) => setIoc(e.target.value)}
                onKeyDown={handleKey}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="185.91.127.81  ·  d41d8cd98f00b204e9800998ecf8427e  ·  malicious.ru"
                style={{
                  flex: 1, padding: "18px 22px",
                  background: "transparent", border: "none", outline: "none",
                  fontFamily: C.mono, fontSize: 15, color: C.white,
                  letterSpacing: "0.04em",
                }}
              />
              {detectedLabel && (
                <div style={{
                  display: "flex", alignItems: "center", padding: "0 14px",
                  fontSize: 8, letterSpacing: "0.2em", color: C.muted,
                  borderLeft: `1px solid ${C.border}`, whiteSpace: "nowrap",
                }}>
                  DETECTED: <span style={{ color: C.red, marginLeft: 5, fontWeight: 700 }}>{detectedLabel}</span>
                </div>
              )}
              <button
                onClick={handleAnalyze}
                style={{
                  padding: "18px 28px", background: C.red, border: "none",
                  color: "#fff", fontFamily: C.mono, fontWeight: 900,
                  fontSize: 12, letterSpacing: "0.22em", cursor: "pointer",
                  whiteSpace: "nowrap", transition: "opacity 120ms",
                  boxShadow: `0 0 20px rgba(232,84,25,0.4)`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                ANALYZE
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 0, alignSelf: "center" }}>
            {IOC_TYPES.map((t) => {
              const meta = TYPE_META[t];
              const active = type === t;
              const Icon = meta.icon;
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  title={meta.hint}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 16px", fontSize: 9, fontWeight: 700,
                    letterSpacing: "0.18em", fontFamily: C.mono,
                    border: `1px solid ${active ? C.red : C.border}`,
                    borderRight: t !== "domain" ? "none" : `1px solid ${active ? C.red : C.border}`,
                    background: active ? "rgba(232,84,25,0.12)" : "transparent",
                    color: active ? C.red : C.muted,
                    cursor: "pointer", transition: "all 120ms",
                    boxShadow: active ? C.redGlow : "none",
                  }}
                >
                  <Icon size={10} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Platform modules */}
        <div style={{ width: "100%", maxWidth: 900 }}>
          <div style={{
            fontSize: 9, letterSpacing: "0.28em", color: C.muted,
            marginBottom: 16, display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ color: C.redDim }}>——</span>
            PLATFORM MODULES
            <span style={{ color: C.redDim }}>——</span>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14,
          }}>
            <ExploreCard
              C={C} href="/forge" icon={Cpu}
              label="STIX FORGE"
              desc="Create STIX 2.1 entities visually, define relationships and ingest with live 18-phase inference"
              accentColor="#8b5cf6"
            />
            <ExploreCard
              C={C} href="/demo" icon={MessageSquare}
              label="IOC ANALYZER DEMO"
              desc="Full IP threat intelligence analysis demo — VirusTotal, CrowdSec, AbuseIPDB, MITRE ATT&CK"
              accentColor="#a855f7"
            />
            <ExploreCard
              C={C} href="/explore-hub" icon={LayoutGrid}
              label="EXPLORE DATABASE"
              desc="IOC Explorer, MITRE ATT&CK Navigator, CVE Database and STIX 2.1 Data Model"
              accentColor="#22d3ee"
            />
            <ExploreCard
              C={C} href="/dashboard" icon={Database}
              label="ANALYTICS DASHBOARD"
              desc="Threat statistics, world map, intrusion sets, malware arsenal and node status"
              accentColor="#f97316"
            />
          </div>
        </div>

        {/* News feed */}
        <NewsFeed />
      </main>

      <footer style={{
        borderTop: `1px solid ${C.redDim}`, padding: "12px 28px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: C.surface, flexShrink: 0,
      }}>
        <span style={{ fontSize: 8, color: C.muted, letterSpacing: "0.18em" }}>
          SKYFALL_CTI // THREAT_INTELLIGENCE_COMMAND_CENTER
        </span>
        <NologinLogo height={26} />
      </footer>
    </div>
  );
}
