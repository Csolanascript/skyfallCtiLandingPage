"use client";

import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon paths broken by webpack
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface LocationPickResult {
  latitude:            number;
  longitude:           number;
  name?:               string;
  country?:            string;
  country_code?:       string;
  city?:               string;
  administrative_area?: string;
  region?:             string;
}

interface Props {
  onSelect: (data: LocationPickResult) => void;
  lat?: number;
  lon?: number;
  accentColor?: string;
}

// Inner component: captures map click events
function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) { onMapClick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

export default function LocationMapPicker({ onSelect, lat, lon, accentColor = "#00CC66" }: Props) {
  const [marker,  setMarker]  = useState<[number, number] | null>(
    lat !== undefined && lon !== undefined ? [lat, lon] : null,
  );
  const [loading, setLoading] = useState(false);
  const [hint,    setHint]    = useState("CLICK ON MAP TO SET LOCATION");

  const handleMapClick = useCallback(async (clickLat: number, clickLon: number) => {
    const roundedLat = Math.round(clickLat * 100000) / 100000;
    const roundedLon = Math.round(clickLon * 100000) / 100000;

    setMarker([roundedLat, roundedLon]);
    setLoading(true);
    setHint("RESOLVING LOCATION…");

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${roundedLat}&lon=${roundedLon}&zoom=10&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "Skyfall-CTI/1.0",
          },
        },
      );
      const data = await res.json();
      const addr = data.address ?? {};

      const city         = addr.city ?? addr.town ?? addr.village ?? addr.hamlet ?? addr.municipality ?? "";
      const country      = addr.country ?? "";
      const country_code = (addr.country_code ?? "").toUpperCase();
      const admin        = addr.state ?? addr.region ?? addr.county ?? "";
      const continent    = addr.continent ?? "";
      const displayParts = (data.display_name as string | undefined)?.split(",") ?? [];
      const name         = city || country || displayParts[0]?.trim() || "";

      const result: LocationPickResult = {
        latitude:  roundedLat,
        longitude: roundedLon,
        name,
        country,
        country_code,
        city,
        administrative_area: admin,
        region: continent,
      };

      onSelect(result);

      const shortLabel = displayParts.slice(0, 3).join(",").trim();
      setHint(`✓ ${shortLabel}`);
    } catch {
      // Fallback: fill coords only
      onSelect({ latitude: roundedLat, longitude: roundedLon });
      setHint("GEOCODING FAILED — COORDS FILLED");
    } finally {
      setLoading(false);
    }
  }, [onSelect]);

  return (
    <div style={{ position: "relative" }}>
      {/* Map */}
      <div style={{
        height: 240, width: "100%",
        border: `1px solid ${accentColor}44`,
        overflow: "hidden",
        position: "relative",
      }}>
        <MapContainer
          center={marker ?? [20, 0]}
          zoom={marker ? 5 : 2}
          style={{ height: "100%", width: "100%", background: "#111" }}
          scrollWheelZoom
        >
          {/* Dark-ish OSM tile layer */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          />
          <ClickHandler onMapClick={handleMapClick} />
          {marker && <Marker position={marker} />}
        </MapContainer>

        {/* Loading overlay */}
        {loading && (
          <div style={{
            position: "absolute", top: 8, right: 8, zIndex: 1000,
            background: "rgba(0,0,0,0.85)",
            border: `1px solid ${accentColor}`,
            color: accentColor,
            fontSize: 8, letterSpacing: "0.14em",
            padding: "3px 8px", fontFamily: "monospace",
          }}>
            RESOLVING…
          </div>
        )}

        {/* Crosshair hint */}
        {!marker && !loading && (
          <div style={{
            position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
            zIndex: 1000,
            background: "rgba(0,0,0,0.75)",
            color: "rgba(255,255,255,0.6)",
            fontSize: 7, letterSpacing: "0.14em",
            padding: "3px 10px", fontFamily: "monospace", pointerEvents: "none",
          }}>
            ✛ CLICK TO PLACE MARKER
          </div>
        )}
      </div>

      {/* Status hint below map */}
      <div style={{
        fontSize: 7, letterSpacing: "0.1em",
        color: hint.startsWith("✓") ? accentColor : "rgba(255,255,255,0.35)",
        marginTop: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {hint}
      </div>

      {/* Coordinates display */}
      {marker && (
        <div style={{
          fontSize: 7, color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.08em", marginTop: 2,
        }}>
          {marker[0].toFixed(5)}, {marker[1].toFixed(5)}
        </div>
      )}
    </div>
  );
}
