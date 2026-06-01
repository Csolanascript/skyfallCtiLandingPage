"use client";

type GlobeTarget = {
  country?: string;
  countryCode?: string;
  lat?: number;
  lng?: number;
};

type IOCGlobeMapProps = {
  observable: string;
  sourceLatitude?: number | null;
  sourceLongitude?: number | null;
  sourceCountry?: string | null;
  targets?: GlobeTarget[];
};

export default function IOCGlobeMap({
  observable,
  sourceLatitude,
  sourceLongitude,
  sourceCountry,
  targets = [],
}: IOCGlobeMapProps) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.35)",
        padding: 12,
        minHeight: 180,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.16em", color: "rgba(226,226,226,0.55)" }}>OBSERVABLE</div>
          <div style={{ fontSize: 14, color: "#E85419", fontWeight: 700, wordBreak: "break-word" }}>{observable}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.16em", color: "rgba(226,226,226,0.55)" }}>SOURCE</div>
          <div style={{ fontSize: 13, color: "#E2E2E2" }}>{sourceCountry ?? "Unknown"}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        <div style={{ padding: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
          <div style={{ fontSize: 9, color: "rgba(226,226,226,0.5)", letterSpacing: "0.16em" }}>LAT</div>
          <div style={{ fontSize: 12, color: "#E2E2E2" }}>{typeof sourceLatitude === "number" ? sourceLatitude.toFixed(4) : "N/A"}</div>
        </div>
        <div style={{ padding: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
          <div style={{ fontSize: 9, color: "rgba(226,226,226,0.5)", letterSpacing: "0.16em" }}>LNG</div>
          <div style={{ fontSize: 12, color: "#E2E2E2" }}>{typeof sourceLongitude === "number" ? sourceLongitude.toFixed(4) : "N/A"}</div>
        </div>
        <div style={{ padding: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
          <div style={{ fontSize: 9, color: "rgba(226,226,226,0.5)", letterSpacing: "0.16em" }}>TARGETS</div>
          <div style={{ fontSize: 12, color: "#E2E2E2" }}>{targets.length}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {targets.length > 0 ? (
          targets.slice(0, 8).map((target, index) => (
            <span
              key={`${target.country ?? target.countryCode ?? "target"}-${index}`}
              style={{
                fontSize: 10,
                padding: "3px 8px",
                border: "1px solid rgba(232,84,25,0.25)",
                color: "rgba(232,84,25,0.82)",
              }}
            >
              {target.country ?? target.countryCode ?? "Unknown"}
            </span>
          ))
        ) : (
          <span style={{ fontSize: 10, color: "rgba(226,226,226,0.45)" }}>No target geography available</span>
        )}
      </div>
    </div>
  );
}