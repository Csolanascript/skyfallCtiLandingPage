'use client'

import React, { useState, useEffect } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'
import useMeasure from 'react-use-measure'
import {
  Shield, AlertOctagon, FileSearch, Globe, GitBranch, Send,
  ScanSearch, ShieldOff, Eye, Link2, Bug, Hash,
  Radio, Network, BrainCircuit, Workflow, Server, Cpu,
} from 'lucide-react'

/* ─── Design tokens (match landing page) ────────────────── */
const R    = '#E85419'
const RD   = 'rgba(232,84,25,0.28)'
const BG   = '#000000'
const TXT  = '#E2E2E2'
const MUT  = 'rgba(212,212,212,0.55)'
const MONO = "'JetBrains Mono','Share Tech Mono',monospace"

/* ─── Infinite Slider ────────────────────────────────────── */
type InfiniteSliderProps = {
  children: React.ReactNode
  gap?: number
  speed?: number
  speedOnHover?: number
  reverse?: boolean
}

function InfiniteSlider({ children, gap = 16, speed = 50, speedOnHover, reverse = false }: InfiniteSliderProps) {
  const [currentSpeed, setCurrentSpeed] = useState(speed)
  const [ref, { width }] = useMeasure()
  const translation = useMotionValue(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [key, setKey] = useState(0)

  useEffect(() => {
    if (width === 0) return
    const contentSize = width + gap
    const from = reverse ? -contentSize / 2 : 0
    const to   = reverse ? 0 : -contentSize / 2
    const distanceToTravel = Math.abs(to - from)
    const duration = distanceToTravel / currentSpeed

    let controls: ReturnType<typeof animate>
    if (isTransitioning) {
      const remainingDistance = Math.abs(translation.get() - to)
      controls = animate(translation, [translation.get(), to], {
        ease: 'linear',
        duration: remainingDistance / currentSpeed,
        onComplete: () => { setIsTransitioning(false); setKey(k => k + 1) },
      })
    } else {
      translation.set(from)
      controls = animate(translation, [from, to], {
        ease: 'linear', duration,
        repeat: Infinity, repeatType: 'loop', repeatDelay: 0,
      })
    }
    return () => controls.stop()
  }, [key, translation, currentSpeed, width, gap, isTransitioning, reverse])

  const hoverProps = speedOnHover ? {
    onHoverStart: () => { setIsTransitioning(true); setCurrentSpeed(speedOnHover) },
    onHoverEnd:   () => { setIsTransitioning(true); setCurrentSpeed(speed) },
  } : {}

  return (
    <div style={{ overflow: 'hidden' }}>
      <motion.div
        ref={ref}
        style={{ display: 'flex', x: translation, gap: `${gap}px`, width: 'max-content' }}
        {...hoverProps}
      >
        {children}
        {children}
      </motion.div>
    </div>
  )
}

/* ─── Integration slot ───────────────────────────────────── */
type SlotProps = { icon: React.ElementType; label: string; color?: string; isCenter?: boolean }

function IntegrationSlot({ icon: Icon, label, color = '#4a4a4a', isCenter = false }: SlotProps) {
  const [hov, setHov] = useState(false)
  const active = hov || isCenter
  const size = isCenter ? 64 : 44
  return (
    <div
      title={label}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? `${color}15` : 'rgba(13,13,13,0.9)',
        border: `1px solid ${active ? color + '60' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: active ? `0 0 14px ${color}30` : 'none',
        transition: 'all 200ms',
        cursor: 'default',
      }}
    >
      <Icon size={isCenter ? 26 : 18} color={active ? color : '#4a4a4a'} />
    </div>
  )
}

/* ─── Row data ───────────────────────────────────────────── */
const ROW1 = [
  { icon: Shield,      label: 'MITRE ATT&CK', color: R },
  { icon: AlertOctagon,label: 'CISA KEV',      color: '#FF8C00' },
  { icon: FileSearch,  label: 'NVD / NIST',    color: '#22d3ee' },
  { icon: Globe,       label: 'AlienVault OTX', color: '#a855f7' },
  { icon: GitBranch,   label: 'GitHub IOC Dumps', color: '#4ade80' },
  { icon: Send,        label: 'Telegram Channels', color: '#38bdf8' },
]

const ROW2 = [
  { icon: ScanSearch,  label: 'VirusTotal',     color: '#a855f7' },
  { icon: ShieldOff,   label: 'AbuseIPDB',      color: R },
  { icon: Eye,         label: 'Shodan',          color: '#FF8C00' },
  { icon: Link2,       label: 'urlscan.io',      color: '#22d3ee' },
  { icon: Bug,         label: 'MalwareBazaar',   color: '#f43f5e' },
  { icon: Hash,        label: 'Team Cymru MHR',  color: '#4ade80' },
]

const ROW3 = [
  { icon: Radio,        label: 'Apache Kafka',   color: '#a855f7' },
  { icon: Network,      label: 'Neo4j',           color: '#4ade80' },
  { icon: BrainCircuit, label: 'IntelOwl',        color: R },
  { icon: Workflow,     label: 'n8n',             color: '#FF8C00' },
  { icon: Server,       label: 'FastAPI',         color: '#22d3ee' },
  { icon: Cpu,          label: 'Redis',           color: '#f43f5e' },
]

/* ─── Exported section ───────────────────────────────────── */
export default function IntegrationsSection() {
  return (
    <section style={{ background: BG, borderTop: '1px solid #1a1a1a', padding: '72px 28px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 52 }}>
          <div style={{ fontSize: 10, color: R, letterSpacing: '0.25em', marginBottom: 8, fontFamily: MONO }}>
            05 / INTEGRATIONS
          </div>
          <div style={{
            fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900,
            letterSpacing: '0.15em', color: '#fff', lineHeight: 1.15, fontFamily: MONO,
          }}>
            CONNECTED TO THE<br /><span style={{ color: R }}>THREAT ECOSYSTEM</span>
          </div>
          <p style={{ marginTop: 14, fontSize: 12, color: MUT, maxWidth: 520, lineHeight: 1.8, fontFamily: MONO }}>
            Skyfall-CTI ingests data from 9+ OSINT feeds, enriches IOCs via 14 analyzers,
            and persists everything in a Neo4j knowledge graph — all in under 4 minutes.
          </p>
        </div>

        {/* Slider grid */}
        <div style={{ position: 'relative', maxWidth: 580, margin: '0 auto' }}>
          {/* Radial fade mask */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 55% 55% at 50% 50%, transparent 60%, #000 100%)',
          }} />
          {/* Dot grid background */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `linear-gradient(to right, rgba(232,84,25,0.08) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(232,84,25,0.08) 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'relative', zIndex: 1 }}>
            <InfiniteSlider gap={18} speed={22} speedOnHover={8}>
              {ROW1.map(s => <IntegrationSlot key={s.label} {...s} />)}
            </InfiniteSlider>

            <InfiniteSlider gap={18} speed={22} speedOnHover={8} reverse>
              {ROW2.map(s => <IntegrationSlot key={s.label} {...s} />)}
            </InfiniteSlider>

            <InfiniteSlider gap={18} speed={22} speedOnHover={8}>
              {ROW3.map(s => <IntegrationSlot key={s.label} {...s} />)}
            </InfiniteSlider>
          </div>

          {/* Center logo */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.85)',
              border: `1px solid ${RD}`,
              boxShadow: `0 0 28px rgba(232,84,25,0.4), 0 0 0 8px rgba(0,0,0,0.7)`,
              backdropFilter: 'blur(6px)',
            }}>
              <Shield size={30} color={R} />
            </div>
          </div>
        </div>

        {/* Legend rows */}
        <div style={{
          marginTop: 52, display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 0,
          borderTop: '1px solid #1a1a1a', borderLeft: '1px solid #1a1a1a',
          fontFamily: MONO,
        }}>
          {[
            { tier: 'CTI FEEDS',      color: R,         items: 'MITRE · CISA · NVD · OTX · GitHub · Telegram' },
            { tier: 'ENRICHMENT',     color: '#a855f7', items: 'VirusTotal · AbuseIPDB · Shodan · urlscan.io · MHR' },
            { tier: 'INFRASTRUCTURE', color: '#22d3ee', items: 'Kafka · Neo4j · IntelOwl · n8n · FastAPI · Redis' },
          ].map(({ tier, color, items }) => (
            <div key={tier} style={{ padding: '18px 20px', borderRight: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
                <span style={{ fontSize: 9, color, letterSpacing: '0.2em', fontWeight: 700 }}>{tier}</span>
              </div>
              <p style={{ fontSize: 10, color: MUT, lineHeight: 1.8 }}>{items}</p>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div style={{ marginTop: 32, textAlign: 'center', fontSize: 10, color: '#4a4a4a', letterSpacing: '0.2em', fontFamily: MONO }}>
          ALL INTEGRATIONS CONNECTED — PIPELINE LATENCY &lt; 4 MIN
        </div>

      </div>
    </section>
  )
}
