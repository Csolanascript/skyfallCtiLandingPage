'use client'
import dynamic from 'next/dynamic'
import { useRef, useEffect, useState } from 'react'

// react-globe.gl has SSR issues — dynamic import with no ssr
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false }) as any

const ARC_COUNT = 20

function makeArcs() {
  const lats = [55.75, 39.9,  35.68, 51.5, 48.85, 40.71, -33.86, 28.61, 19.43, 1.35]
  const lons = [37.61, 116.4, 139.7, -0.1, 2.35, -74.0, 151.2,  77.2, -99.1, 103.8]
  return Array.from({ length: ARC_COUNT }, (_, i) => ({
    startLat: lats[i % lats.length] + (Math.random() - 0.5) * 10,
    startLng: lons[i % lons.length] + (Math.random() - 0.5) * 10,
    endLat:   lats[(i + 3) % lats.length] + (Math.random() - 0.5) * 10,
    endLng:   lons[(i + 3) % lons.length] + (Math.random() - 0.5) * 10,
    color:    i % 4 === 0 ? '#E85419' : i % 4 === 1 ? '#FF8C00' : i % 4 === 2 ? '#a855f7' : '#22d3ee',
  }))
}

function makePoints() {
  return [
    { lat: 55.75, lng: 37.61,  label: 'MOSCOW',        color: '#E85419' },
    { lat: 39.9,  lng: 116.4,  label: 'BEIJING',       color: '#E85419' },
    { lat: 37.57, lng: 126.97, label: 'SEOUL',         color: '#FF8C00' },
    { lat: 35.69, lng: 51.39,  label: 'TEHRAN',        color: '#FF8C00' },
    { lat: 39.03, lng: 125.74, label: 'PYONGYANG',     color: '#E85419' },
    { lat: 51.5,  lng: -0.1,   label: 'LONDON',        color: '#22d3ee' },
    { lat: 40.71, lng: -74.0,  label: 'NEW YORK',      color: '#22d3ee' },
    { lat: 48.85, lng: 2.35,   label: 'PARIS',         color: '#22d3ee' },
    { lat: 35.68, lng: 139.7,  label: 'TOKYO',         color: '#22d3ee' },
    { lat: 40.41, lng: -3.70,  label: 'MADRID',        color: '#22d3ee' },
  ]
}

export function LandingGlobe() {
  const globeRef = useRef<unknown>(null)
  const [arcs]   = useState(makeArcs)
  const [points] = useState(makePoints)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = globeRef.current as any
    if (!g) return
    g.controls().autoRotate      = true
    g.controls().autoRotateSpeed = 0.5
    g.controls().enableZoom      = false
  })

  return (
    <Globe
      ref={globeRef}
      backgroundColor="rgba(0,0,0,0)"
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
      atmosphereColor="rgba(232,84,25,0.25)"
      atmosphereAltitude={0.18}
      arcsData={arcs}
      arcColor="color"
      arcDashLength={0.4}
      arcDashGap={0.3}
      arcDashAnimateTime={2500}
      arcStroke={0.5}
      pointsData={points}
      pointColor="color"
      pointAltitude={0.01}
      pointRadius={0.35}
      pointLabel="label"
      width={680}
      height={480}
    />
  )
}
