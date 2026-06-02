"use client";

import { ThemeProvider, ThemeCurtain } from "@/lib/theme";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ThemeCurtain />
      {children}
    </ThemeProvider>
  );
}
