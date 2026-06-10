'use client'

import React, { useState, useEffect } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'
import useMeasure from 'react-use-measure'
import {
  Shield, AlertOctagon, FileSearch, Globe, GitBranch, Send,
  ScanSearch, ShieldOff, Eye, Link2, Bug, Hash,
  Radio, Network, BrainCircuit, Workflow, Server, Cpu,
} from 'lucide-react'
import { useTheme } from '@/lib/theme'

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
type SlotProps = {
  icon: React.ElementType
  label: string
  color?: string
  href?: string
  isCenter?: boolean
  isDark: boolean
}

function IntegrationSlot({ icon: Icon, label, color = '#4a4a4a', href, isCenter = false, isDark }: SlotProps) {
  const [hov, setHov] = useState(false)
  const active = hov || isCenter
  const size = isCenter ? 64 : 44
  const inactiveBg = isDark ? 'rgba(13,13,13,0.9)' : 'rgba(245,245,240,0.85)'
  const inactiveBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.10)'
  const el = (
    <div
      title={label}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? `${color}15` : inactiveBg,
        border: `1px solid ${active ? color + '60' : inactiveBorder}`,
        boxShadow: active ? `0 0 14px ${color}30` : 'none',
        transition: 'all 200ms',
        cursor: isCenter ? 'default' : 'pointer',
      }}
    >
      <Icon size={isCenter ? 26 : 18} color={active ? color : (isDark ? '#4a4a4a' : '#888888')} />
    </div>
  )
  if (!isCenter && href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'contents' }}>{el}</a>
  }
  return el
}

/* ─── Row data ───────────────────────────────────────────── */
const R_COLOR = '#E85419'

const ROW1 = [
  { icon: Shield,      label: 'MITRE ATT&CK',    color: R_COLOR,   href: 'https://attack.mitre.org' },
  { icon: AlertOctagon,label: 'CISA KEV',         color: '#FF8C00', href: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog' },
  { icon: FileSearch,  label: 'NVD / NIST',       color: '#22d3ee', href: 'https://nvd.nist.gov' },
  { icon: Globe,       label: 'AlienVault OTX',   color: '#a855f7', href: 'https://otx.alienvault.com' },
  { icon: GitBranch,   label: 'GitHub IOC Dumps', color: '#4ade80', href: 'https://github.com' },
  { icon: Send,        label: 'Telegram',         color: '#38bdf8', href: 'https://telegram.org' },
]

const ROW2 = [
  { icon: ScanSearch,  label: 'VirusTotal',    color: '#a855f7', href: 'https://www.virustotal.com' },
  { icon: ShieldOff,   label: 'AbuseIPDB',     color: R_COLOR,   href: 'https://www.abuseipdb.com' },
  { icon: Eye,         label: 'Shodan',         color: '#FF8C00', href: 'https://www.shodan.io' },
  { icon: Link2,       label: 'urlscan.io',     color: '#22d3ee', href: 'https://urlscan.io' },
  { icon: Bug,         label: 'MalwareBazaar',  color: '#f43f5e', href: 'https://bazaar.abuse.ch' },
  { icon: Hash,        label: 'Team Cymru MHR', color: '#4ade80', href: 'https://team-cymru.com/community-services/mhr/' },
]

const ROW3 = [
  { icon: Radio,        label: 'Apache Kafka', color: '#a855f7', href: 'https://kafka.apache.org' },
  { icon: Network,      label: 'Neo4j',         color: '#4ade80', href: 'https://neo4j.com' },
  { icon: BrainCircuit, label: 'IntelOwl',      color: R_COLOR,   href: 'https://github.com/intelowlproject/IntelOwl' },
  { icon: Workflow,     label: 'n8n',            color: '#FF8C00', href: 'https://n8n.io' },
  { icon: Server,       label: 'FastAPI',        color: '#22d3ee', href: 'https://fastapi.tiangolo.com' },
  { icon: Cpu,          label: 'Redis',          color: '#f43f5e', href: 'https://redis.io' },
]

/* ─── Exported section ───────────────────────────────────── */
export default function IntegrationsSection() {
  const { C, isDark } = useTheme()

  const BG   = C.bg
  const TXT  = C.white
  const MUT  = C.muted
  const MONO = C.mono
  const BDIM = isDark ? '#1a1a1a' : 'rgba(0,0,0,0.09)'
  const DIM  = isDark ? '#4a4a4a' : 'rgba(0,0,0,0.38)'

  return (
    <section style={{ background: BG, borderTop: `1px solid ${BDIM}`, padding: '72px 28px', transition: 'background 300ms' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 52 }}>
          <div style={{ fontSize: 10, color: C.red, letterSpacing: '0.25em', marginBottom: 8, fontFamily: MONO }}>
            05 / INTEGRATIONS
          </div>
          <div style={{
            fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900,
            letterSpacing: '0.15em', color: TXT, lineHeight: 1.15, fontFamily: MONO,
          }}>
            CONNECTED TO THE<br /><span style={{ color: C.red }}>THREAT ECOSYSTEM</span>
          </div>
          <p style={{ marginTop: 14, fontSize: 12, color: MUT, maxWidth: 520, lineHeight: 1.8, fontFamily: MONO }}>
            Skyfall-CTI pulls from 9+ threat feeds, runs IOCs through 50+ analyzers and stores everything in a searchable knowledge graph.
          </p>
        </div>

        {/* Slider grid */}
        <div style={{ position: 'relative', maxWidth: 580, margin: '0 auto' }}>
          {/* Radial fade mask */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none',
            background: `radial-gradient(ellipse 55% 55% at 50% 50%, transparent 60%, ${BG} 100%)`,
          }} />
          {/* Dot grid background */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `linear-gradient(to right, ${C.red}10 1px, transparent 1px),
                              linear-gradient(to bottom, ${C.red}10 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'relative', zIndex: 1 }}>
            <InfiniteSlider gap={18} speed={22} speedOnHover={8}>
              {ROW1.map(s => <IntegrationSlot key={s.label} {...s} isDark={isDark} />)}
            </InfiniteSlider>

            <InfiniteSlider gap={18} speed={22} speedOnHover={8} reverse>
              {ROW2.map(s => <IntegrationSlot key={s.label} {...s} isDark={isDark} />)}
            </InfiniteSlider>

            <InfiniteSlider gap={18} speed={22} speedOnHover={8}>
              {ROW3.map(s => <IntegrationSlot key={s.label} {...s} isDark={isDark} />)}
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
              background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(240,239,232,0.90)',
              border: `1px solid ${C.redDim}`,
              boxShadow: `0 0 28px rgba(232,84,25,0.4), 0 0 0 8px ${isDark ? 'rgba(0,0,0,0.7)' : 'rgba(240,239,232,0.7)'}`,
              backdropFilter: 'blur(6px)',
            }}>
              <Shield size={30} color={C.red} />
            </div>
          </div>
        </div>

        {/* Legend rows */}
        <div style={{
          marginTop: 52, display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 0,
          borderTop: `1px solid ${BDIM}`, borderLeft: `1px solid ${BDIM}`,
          fontFamily: MONO,
        }}>
          {[
            { tier: 'CTI FEEDS',      color: C.red,    items: 'MITRE · CISA · NVD · OTX · GitHub · Telegram' },
            { tier: 'ENRICHMENT',     color: '#a855f7', items: 'VirusTotal · AbuseIPDB · Shodan · urlscan.io · MHR' },
            { tier: 'INFRASTRUCTURE', color: '#22d3ee', items: 'Kafka · Neo4j · IntelOwl · n8n · FastAPI · Redis' },
          ].map(({ tier, color, items }) => (
            <div key={tier} style={{ padding: '24px 24px', borderRight: `1px solid ${BDIM}`, borderBottom: `1px solid ${BDIM}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
                <span style={{ fontSize: 12, color, letterSpacing: '0.2em', fontWeight: 700 }}>{tier}</span>
              </div>
              <p style={{ fontSize: 13, color: MUT, lineHeight: 2 }}>{items}</p>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div style={{ marginTop: 32, textAlign: 'center', fontSize: 10, color: DIM, letterSpacing: '0.2em', fontFamily: MONO }}>
          ALL INTEGRATIONS CONNECTED — PIPELINE LATENCY &lt; 4 MIN
        </div>

      </div>
    </section>
  )
}
