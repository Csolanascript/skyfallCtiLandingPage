import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skyfall CTI — Cyber Threat Intelligence Platform",
  description:
    "Real-time cyber threat intelligence. Ingest, correlate, and act on threat data at machine speed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-black antialiased">{children}</body>
    </html>
  );
}
