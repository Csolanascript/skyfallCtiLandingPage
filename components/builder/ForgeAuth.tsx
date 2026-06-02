"use client";

import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useForge, Brackets } from "./ForgeLayout";

interface Props {
  onAuth: () => void;
}

export default function ForgeAuth({ onAuth }: Props) {
  const { C } = useForge();
  const panelRef = useRef<HTMLDivElement>(null);
  const [token,   setToken]   = useState("");
  const [error,   setError]   = useState("");
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);

  useGSAP(() => {
    if (!panelRef.current) return;
    gsap.fromTo(panelRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
    );
  }, { scope: panelRef });

  const handleAuth = async () => {
    if (!token.trim()) {
      setError("Token required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Quick validate: POST to /stix/validate with a minimal bundle
      const res = await fetch("/api/stix/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forge-Token": token.trim(),
        },
        body: JSON.stringify({
          bundle: {
            type: "bundle",
            id: "bundle--00000000-0000-0000-0000-000000000000",
            spec_version: "2.1",
            objects: [
              {
                type: "identity",
                id: "identity--00000000-0000-0000-0000-000000000001",
                spec_version: "2.1",
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                name: "Skyfall",
                identity_class: "system",
              },
            ],
          },
        }),
      });
      if (res.status === 401) {
        setError("Invalid token");
        return;
      }
      // Store in sessionStorage for this tab
      try { sessionStorage.setItem("forge-token", token.trim()); } catch { /* ignore */ }
      gsap.to(panelRef.current, {
        opacity: 0, y: -16, duration: 0.25, ease: "power2.in",
        onComplete: onAuth,
      });
    } catch {
      setError("Connection error — is skyfall-api running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: C.mono,
    }}>
      <div ref={panelRef} style={{
        width: 400, position: "relative",
        border: `1px solid ${C.red}44`,
        background: "#060606",
        padding: "28px 28px 24px",
      }}>
        <Brackets />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <Lock size={22} color={C.red} />
          <div>
            <div style={{ fontSize: 13, letterSpacing: "0.2em", color: C.red, fontWeight: 700 }}>
              STIX FORGE
            </div>
            <div style={{ fontSize: 9, color: C.muted, opacity: 0.6, letterSpacing: "0.1em" }}>
              AUTHENTICATION REQUIRED
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 10, letterSpacing: "0.14em", color: C.muted, display: "block", marginBottom: 8 }}>
            FORGE TOKEN
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={show ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              placeholder="Enter forge token…"
              autoFocus
              style={{
                background: C.bg,
                border: `1px solid ${error ? "#FF4444" : C.border}`,
                color: C.white,
                fontFamily: C.mono,
                fontSize: 12,
                padding: "9px 36px 9px 12px",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
              aria-label="Forge token"
            />
            <button
              onClick={() => setShow(!show)}
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 2 }}
              aria-label={show ? "Hide token" : "Show token"}
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {error && (
            <div style={{ fontSize: 10, color: "#FF4444", marginTop: 6, letterSpacing: "0.1em" }}>
              ✗ {error}
            </div>
          )}
        </div>

        <button
          onClick={handleAuth}
          disabled={loading}
          style={{
            width: "100%",
            fontSize: 11, letterSpacing: "0.2em", fontWeight: 700,
            border: `1px solid ${C.red}`,
            background: `${C.red}22`, color: C.red,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: C.mono, padding: "8px 0",
            opacity: loading ? 0.6 : 1,
          }}
          aria-label="Authenticate"
        >
          {loading ? "AUTHENTICATING…" : "AUTHENTICATE"}
        </button>

        <div style={{ marginTop: 14, fontSize: 9, color: C.muted, opacity: 0.45, textAlign: "center", letterSpacing: "0.1em" }}>
          TOKEN SET IN FORGE_API_TOKEN ENV VAR
        </div>
      </div>
    </div>
  );
}
