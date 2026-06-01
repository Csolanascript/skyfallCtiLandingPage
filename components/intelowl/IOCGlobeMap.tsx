"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { Radar } from "lucide-react";
import worldCountriesRaw from "world-countries";

import styles from "./IOCGlobeMap.module.css";

gsap.registerPlugin(useGSAP);

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
}) as unknown as React.ComponentType<Record<string, unknown>>;

interface TargetCountry {
  country: string;
  value: number;
  percent: number;
}

export interface ResolvedIpPoint {
  ip: string;
  lat: number;
  lng: number;
  country?: string;
  isp?: string;
  asn?: number;
}

interface IOCGlobeMapProps {
  className?: string;
  observable: string;
  sourceLatitude: number | null;
  sourceLongitude: number | null;
  sourceCountry: string | null;
  targets: TargetCountry[];
  resolvedIpPoints?: ResolvedIpPoint[];
}

interface CountryRecord {
  cca2?: string;
  latlng?: number[];
  name?: { common?: string; official?: string };
  altSpellings?: string[];
}

interface GeoPoint {
  lat: number;
  lng: number;
}

interface GlobePoint {
  id: string;
  lat: number;
  lng: number;
  size: number;
  label: string;
  color: string;
}

interface GlobeArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  label: string;
  color: string[];
  order: number;
}

interface CountryCoordIndex {
  byCode: Map<string, GeoPoint>;
  byName: Map<string, GeoPoint>;
}

type GlobeHandle = {
  pointOfView?: (coordinates: { lat: number; lng: number; altitude?: number }, durationMs?: number) => void;
  controls?: () => {
    autoRotate: boolean;
    autoRotateSpeed: number;
    enablePan: boolean;
    enableDamping: boolean;
    dampingFactor: number;
    minDistance: number;
    maxDistance: number;
  };
  globeMaterial?: () => {
    color: { set: (value: string) => void };
    emissive: { set: (value: string) => void };
    emissiveIntensity: number;
    opacity: number;
    transparent: boolean;
  };
};

const WORLD_COUNTRIES = worldCountriesRaw as unknown as CountryRecord[];

function normalizeCountryKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildCountryIndex(): CountryCoordIndex {
  const byCode = new Map<string, GeoPoint>();
  const byName = new Map<string, GeoPoint>();

  WORLD_COUNTRIES.forEach((record) => {
    const lat = record.latlng?.[0];
    const lng = record.latlng?.[1];
    if (typeof lat !== "number" || typeof lng !== "number") return;
    const point = { lat, lng };
    const code = record.cca2?.toUpperCase();
    if (code) byCode.set(code, point);
    const aliases = [record.name?.common, record.name?.official, ...(record.altSpellings ?? [])]
      .filter((entry): entry is string => Boolean(entry));
    aliases.forEach((alias) => byName.set(normalizeCountryKey(alias), point));
  });

  byName.set("uk", byCode.get("GB") as GeoPoint);
  byName.set("u k", byCode.get("GB") as GeoPoint);
  byName.set("usa", byCode.get("US") as GeoPoint);
  byName.set("u s a", byCode.get("US") as GeoPoint);
  return { byCode, byName };
}

function resolveCountryCoordinates(value: string | null, index: CountryCoordIndex): GeoPoint | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length === 2) return index.byCode.get(trimmed.toUpperCase()) ?? null;
  return index.byName.get(normalizeCountryKey(trimmed)) ?? null;
}

function formatCoord(value: number): string {
  return value.toFixed(4);
}

export default function IOCGlobeMap({
  className,
  observable,
  sourceLatitude,
  sourceLongitude,
  sourceCountry,
  targets,
  resolvedIpPoints,
}: IOCGlobeMapProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeHandle | null>(null);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [globeReady, setGlobeReady] = useState(false);
  const countryIndex = useMemo(() => buildCountryIndex(), []);
  const isDomainMode = Boolean(resolvedIpPoints && resolvedIpPoints.length > 0);

  const sourcePoint = useMemo<GeoPoint | null>(() => {
    if (isDomainMode) return null;
    if (typeof sourceLatitude === "number" && typeof sourceLongitude === "number") {
      return { lat: sourceLatitude, lng: sourceLongitude };
    }
    return resolveCountryCoordinates(sourceCountry, countryIndex);
  }, [countryIndex, isDomainMode, sourceCountry, sourceLatitude, sourceLongitude]);

  const targetPoints = useMemo(() => {
    return targets
      .map((target) => ({
        name: target.country,
        weight: target.value,
        percent: target.percent,
        point: resolveCountryCoordinates(target.country, countryIndex),
      }))
      .filter((target) => Boolean(target.point));
  }, [countryIndex, targets]);

  const resolvedGlobePoints = useMemo<GlobePoint[]>(() => {
    if (!resolvedIpPoints || resolvedIpPoints.length === 0) return [];
    return resolvedIpPoints.map((rip, i) => ({
      id: `resolved-${rip.ip}`,
      lat: rip.lat,
      lng: rip.lng,
      size: 0.38,
      color: i === 0 ? "#f43f5e" : "#38bdf8",
      label: `${rip.ip}${rip.country ? ` (${rip.country})` : ""}${rip.isp ? ` · ${rip.isp}` : ""}`,
    }));
  }, [resolvedIpPoints]);

  const resolvedCentroid = useMemo<GeoPoint | null>(() => {
    if (resolvedGlobePoints.length === 0) return null;
    const lat = resolvedGlobePoints.reduce((sum, p) => sum + p.lat, 0) / resolvedGlobePoints.length;
    const lng = resolvedGlobePoints.reduce((sum, p) => sum + p.lng, 0) / resolvedGlobePoints.length;
    return { lat, lng };
  }, [resolvedGlobePoints]);

  const resolvedArcs = useMemo<GlobeArc[]>(() => {
    if (resolvedGlobePoints.length < 2) return [];
    const result: GlobeArc[] = [];
    for (let i = 0; i < resolvedGlobePoints.length - 1; i++) {
      result.push({
        startLat: resolvedGlobePoints[i].lat,
        startLng: resolvedGlobePoints[i].lng,
        endLat: resolvedGlobePoints[i + 1].lat,
        endLng: resolvedGlobePoints[i + 1].lng,
        label: `${resolvedGlobePoints[i].id} → ${resolvedGlobePoints[i + 1].id}`,
        color: ["rgba(96,165,250,0.9)", "rgba(96,165,250,0.4)", "rgba(96,165,250,0.08)"],
        order: i,
      });
    }
    return result;
  }, [resolvedGlobePoints]);

  const points = useMemo<GlobePoint[]>(() => {
    if (isDomainMode) return resolvedGlobePoints;
    if (!sourcePoint) return [];
    const source: GlobePoint = {
      id: "source",
      lat: sourcePoint.lat,
      lng: sourcePoint.lng,
      size: 0.42,
      color: "#f43f5e",
      label: `Red Team Source: ${observable}`,
    };
    const targetDots = targetPoints.map((target) => ({
      id: `target-${target.name}`,
      lat: target.point?.lat ?? 0,
      lng: target.point?.lng ?? 0,
      size: 0.29,
      color: "#38bdf8",
      label: `Blue Team Defense: ${target.name} (${target.percent.toFixed(1)}%)`,
    }));
    return [source, ...targetDots];
  }, [isDomainMode, observable, resolvedGlobePoints, sourcePoint, targetPoints]);

  const arcs = useMemo<GlobeArc[]>(() => {
    if (isDomainMode) return resolvedArcs;
    if (!sourcePoint) return [];
    return targetPoints.map((target, index) => ({
      startLat: sourcePoint.lat,
      startLng: sourcePoint.lng,
      endLat: target.point?.lat ?? 0,
      endLng: target.point?.lng ?? 0,
      label: `Red Team Attack Path: ${observable} -> ${target.name}`,
      color: ["rgba(244,63,94,0.96)", "rgba(239,68,68,0.58)", "rgba(248,113,113,0.18)"],
      order: index,
    }));
  }, [isDomainMode, observable, resolvedArcs, sourcePoint, targetPoints]);

  const ringCenter = useMemo<GeoPoint | null>(() => resolvedCentroid ?? sourcePoint, [resolvedCentroid, sourcePoint]);

  useEffect(() => {
    const element = shellRef.current;
    if (!element) return;
    const syncSize = () => {
      const rect = element.getBoundingClientRect();
      const nextWidth = Math.max(320, Math.floor(rect.width));
      const nextHeight = nextWidth < 700 ? 430 : 520;
      setSize((prev) => (prev.width === nextWidth && prev.height === nextHeight ? prev : { width: nextWidth, height: nextHeight }));
    };
    syncSize();
    const observer = new ResizeObserver(syncSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ reduceMotion: "(prefers-reduced-motion: reduce)" }, (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };
        gsap.fromTo(".ioc-globe-shell", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: reduceMotion ? 0 : 0.75, ease: "power3.out" });
        const globe = globeRef.current;
        const controls = globe?.controls?.();
        if (controls) {
          controls.enablePan = false;
          controls.enableDamping = true;
          controls.dampingFactor = 0.08;
          controls.minDistance = 150;
          controls.maxDistance = 480;
          controls.autoRotate = true;
          controls.autoRotateSpeed = reduceMotion ? 0.12 : 0.28;
        }
        const material = globe?.globeMaterial?.();
        if (material) {
          material.color.set("#0f172a");
          material.emissive.set("#000000");
          material.emissiveIntensity = 0.3;
          material.opacity = 0.48;
          material.transparent = true;
        }
        const focusPoint = resolvedCentroid ?? sourcePoint;
        if (focusPoint && globe?.pointOfView) {
          globe.pointOfView({ lat: focusPoint.lat, lng: focusPoint.lng, altitude: 2.05 }, 0);
          globe.pointOfView({ lat: focusPoint.lat, lng: focusPoint.lng, altitude: reduceMotion ? 1.78 : 1.45 }, reduceMotion ? 0 : 1300);
        }
        return () => { if (controls) controls.autoRotate = false; };
      });
      return () => mm.revert();
    },
    { scope: shellRef, dependencies: [arcs.length, ringCenter?.lat, ringCenter?.lng, size.width, size.height, globeReady], revertOnUpdate: true }
  );

  if (!ringCenter) {
    return (
      <div ref={shellRef} className={`${styles.shell} ${className ?? ""}`}>
        <div className={styles.empty}>
          <p>
            {isDomainMode
              ? "No resolved IP coordinates available for this domain yet."
              : "No source coordinates available for this IOC."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={shellRef} className={`${styles.shell} ioc-globe-shell ${className ?? ""}`}>
      <div className={styles.overlay}>
        <span className={styles.badge}>
          <Radar size={12} /> {isDomainMode ? "resolved IP geolocation" : "red team / blue team map"}
        </span>
        <div className={styles.coords}>
          <p><strong>Observable:</strong> {observable}</p>
          {isDomainMode ? (
            <p><strong>Resolved IPs:</strong> {resolvedGlobePoints.length}</p>
          ) : (
            <p><strong>Source:</strong> {formatCoord(ringCenter.lat)}, {formatCoord(ringCenter.lng)}</p>
          )}
          {!isDomainMode && <p><strong>Targets:</strong> {targetPoints.length}</p>}
          <div className={styles.legend}>
            {isDomainMode ? (
              <>
                <span className={styles.legendChip}>red: primary resolved IP</span>
                <span className={styles.legendChip}>blue: other resolved IPs</span>
                <span className={styles.legendChip}>arcs: resolution chain</span>
              </>
            ) : (
              <>
                <span className={styles.legendChip}>red team: IOC attacker</span>
                <span className={styles.legendChip}>blue team: defending countries</span>
                <span className={styles.legendChip}>red arrows: attack vectors</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.canvasWrap}>
        <Globe
          ref={globeRef as never}
          onGlobeReady={() => setGlobeReady(true)}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
          atmosphereColor="#7dd3fc"
          atmosphereAltitude={0.14}
          arcsData={arcs}
          arcLabel={(arcObject: unknown) => (arcObject as GlobeArc).label}
          arcColor={(arcObject: unknown) => (arcObject as GlobeArc).color}
          arcDashLength={0.42}
          arcDashGap={0.34}
          arcDashInitialGap={(arcObject: unknown) => (arcObject as GlobeArc).order * 0.14}
          arcDashAnimateTime={2100}
          arcStroke={0.75}
          pointsData={points}
          pointLat={(pointObject: unknown) => (pointObject as GlobePoint).lat}
          pointLng={(pointObject: unknown) => (pointObject as GlobePoint).lng}
          pointColor={(pointObject: unknown) => (pointObject as GlobePoint).color}
          pointAltitude={(pointObject: unknown) => (pointObject as GlobePoint).size}
          pointRadius={0.72}
          pointLabel={(pointObject: unknown) => (pointObject as GlobePoint).label}
          labelsData={points}
          labelLat={(pointObject: unknown) => (pointObject as GlobePoint).lat}
          labelLng={(pointObject: unknown) => (pointObject as GlobePoint).lng}
          labelText={(pointObject: unknown) => (pointObject as GlobePoint).id}
          labelSize={1.28}
          labelDotRadius={0.34}
          labelColor={() => "#dbeafe"}
          labelResolution={2}
          ringsData={[{ lat: ringCenter.lat, lng: ringCenter.lng }]}
          ringLat={(ringObject: unknown) => (ringObject as GeoPoint).lat}
          ringLng={(ringObject: unknown) => (ringObject as GeoPoint).lng}
          ringColor={() => isDomainMode
            ? ["rgba(96,165,250,0.6)", "rgba(96,165,250,0.08)"]
            : ["rgba(244,63,94,0.6)", "rgba(244,63,94,0.08)"]}
          ringMaxRadius={18}
          ringPropagationSpeed={1.5}
          ringRepeatPeriod={900}
        />
      </div>
    </div>
  );
}
