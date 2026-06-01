"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type ColorSet = {
  bg: string; red: string; redDim: string; redGlow: string;
  white: string; surface: string; border: string; muted: string;
  altRow: string; accentFaint: string; rowHover: string;
  green: string; orange: string; mono: string;
  pie: string[];
};

export const DARK: ColorSet = {
  bg:          "#000000",
  red:         "#E85419",
  redDim:      "rgba(232,84,25,0.28)",
  redGlow:     "0 0 22px rgba(232,84,25,0.50)",
  white:       "#F5F5F5",
  surface:     "rgba(232,84,25,0.07)",
  border:      "rgba(255,255,255,0.22)",
  muted:       "rgba(248,248,248,0.88)",
  altRow:      "rgba(255,255,255,0.035)",
  accentFaint: "rgba(232,84,25,0.055)",
  rowHover:    "rgba(232,84,25,0.11)",
  green:       "#00FF41",
  orange:      "#FF8C00",
  mono:        "'JetBrains Mono','Fira Code','Courier New',monospace",
  pie:         ["#E85419","#8C8C8C","#FF7A45","#B34010","#FFB38A","#5A5A5A","#FF6030","#C8C8C8"],
};

export const LIGHT: ColorSet = {
  bg:          "#F0EFE8",
  red:         "#C84010",
  redDim:      "rgba(200,64,16,0.28)",
  redGlow:     "0 0 18px rgba(200,64,16,0.40)",
  white:       "#080808",
  surface:     "rgba(0,0,0,0.05)",
  border:      "rgba(0,0,0,0.20)",
  muted:       "rgba(8,8,8,0.88)",
  altRow:      "rgba(0,0,0,0.03)",
  accentFaint: "rgba(200,64,16,0.05)",
  rowHover:    "rgba(200,64,16,0.08)",
  green:       "#006B1A",
  orange:      "#C86000",
  mono:        "'JetBrains Mono','Fira Code','Courier New',monospace",
  pie:         ["#C84010","#5A5A5A","#E07040","#9A3008","#E09070","#3A3A3A","#D05020","#7A7A7A"],
};

export type CurtainPhase = "idle" | "falling" | "rising";
export const CURTAIN_DURATION = 550;
export const CURTAIN_EASING = "cubic-bezier(0.76, 0, 0.24, 1)";

type ThemeCtxType = {
  C: ColorSet;
  isDark: boolean;
  toggle: () => void;
  curtainPhase: CurtainPhase;
  curtainColor: string;
};

const ThemeCtx = createContext<ThemeCtxType>({
  C: DARK, isDark: true, toggle: () => {},
  curtainPhase: "idle", curtainColor: "",
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const [curtainPhase, setCurtainPhase] = useState<CurtainPhase>("idle");
  const [curtainColor, setCurtainColor] = useState("");

  useEffect(() => {
    try { localStorage.removeItem("skyfall-theme"); } catch { /* ignore */ }
  }, []);

  const toggle = useCallback(() => {
    if (curtainPhase !== "idle") return;
    const next = !isDark;
    // curtain sweeps in with the destination bg color
    setCurtainColor(next ? DARK.bg : LIGHT.bg);
    setCurtainPhase("falling");

    setTimeout(() => {
      setIsDark(next);
      try { localStorage.setItem("skyfall-theme", next ? "dark" : "light"); } catch { /* ignore */ }
      setCurtainPhase("rising");
      setTimeout(() => setCurtainPhase("idle"), CURTAIN_DURATION + 60);
    }, CURTAIN_DURATION);
  }, [curtainPhase, isDark]);

  return (
    <ThemeCtx.Provider value={{ C: isDark ? DARK : LIGHT, isDark, toggle, curtainPhase, curtainColor }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
