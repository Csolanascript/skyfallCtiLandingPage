"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme";

const ROUTE_LABELS: Record<string, string> = {
  "":               "HOME",
  "dashboard":      "DASHBOARD",
  "explore":        "IOC_EXPLORER",
  "chat":           "AI_ASSISTANT",
  "explorer":       "GRAPH_CONSOLE",
  "dashboards":     "DASHBOARDS",
  "custom-dashboard": "DASHBOARDS",
  "intelowl":       "ANALYSIS",
  "analyze-ip":     "IP_ANALYSIS",
  "analyze-hash":   "HASH_ANALYSIS",
  "analyze-domain": "DOMAIN_ANALYSIS",
  "news":           "NEWS_FEED",
  "graph":          "GRAPH_VIEW",
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const { C } = useTheme();

  const segments = pathname.split("/").filter(Boolean);

  // Build crumb list: always start with HOME
  const crumbs: { label: string; href: string }[] = [
    { label: "HOME", href: "/" },
  ];

  let accumulated = "";
  for (const seg of segments) {
    accumulated += `/${seg}`;
    const label = ROUTE_LABELS[seg] ?? seg.toUpperCase().replace(/-/g, "_");
    crumbs.push({ label, href: accumulated });
  }

  if (crumbs.length <= 1) return null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 0,
      fontSize: 9, fontFamily: C.mono, letterSpacing: "0.16em",
      color: C.muted, userSelect: "none",
    }}>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {i > 0 && (
              <span style={{ margin: "0 7px", color: "rgba(232,84,25,0.45)", fontSize: 8 }}>
                /
              </span>
            )}
            {isLast ? (
              <span style={{
                color: C.white,
                fontWeight: 700,
                letterSpacing: "0.18em",
              }}>
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                style={{
                  color: C.muted,
                  textDecoration: "none",
                  letterSpacing: "0.16em",
                  transition: "color 120ms",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = C.red; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; }}
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </div>
  );
}
