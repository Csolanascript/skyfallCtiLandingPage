'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import NologinLogo from '@/components/ui/NologinLogo'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ParticleCanvas } from '@/components/ui/aether-flow-hero'
import { ChaosCanvas, GraphCanvas } from '@/components/landing/EntropyCanvas'
import { LandingGlobe } from '@/components/landing/LandingGlobe'
import IntegrationsSection from '@/components/landing/IntegrationsSection'
import {
  Shield, Radio, Lock, ChevronDown, Database, Globe,
  Network, ScanSearch, BarChart3, LayoutDashboard,
  ArrowRight, Share2, Zap, Crosshair, BrainCircuit, GitMerge,
  GitBranch, ExternalLink, Terminal, Layers, Eye,
} from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

/* ─── Design tokens ──────────────────────────────────────── */
const R    = '#E85419'
const RG   = '0 0 22px rgba(232,84,25,0.55)'
const RD   = 'rgba(232,84,25,0.28)'
const BG   = '#000000'
const TXT  = '#E2E2E2'
const MUT  = 'rgba(212,212,212,0.55)'
const SRF  = 'rgba(232,84,25,0.06)'
const GRN  = '#00FF41'
const MONO = "'JetBrains Mono','Share Tech Mono',monospace"

/* ─── Bracket corners ────────────────────────────────────── */
function Brackets({ color = R, size = 10 }: { color?: string; size?: number }) {
  const s: React.CSSProperties = { position: 'absolute', width: size, height: size }
  return (
    <>
      <div style={{ ...s, top: -1, left:  -1, borderTop:    `2px solid ${color}`, borderLeft:  `2px solid ${color}` }} />
      <div style={{ ...s, top: -1, right: -1, borderTop:    `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
      <div style={{ ...s, bottom: -1, left:  -1, borderBottom: `2px solid ${color}`, borderLeft:  `2px solid ${color}` }} />
      <div style={{ ...s, bottom: -1, right: -1, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
    </>
  )
}

/* ─── Scanlines ──────────────────────────────────────────── */
function Scanlines() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
      background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.09) 3px,rgba(0,0,0,0.09) 4px)',
    }} />
  )
}

/* ─── Keyframes ──────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
@keyframes lp-glitch {
  0%   { clip-path: inset(0 0 98% 0); transform: translate(-4px,0); }
  15%  { clip-path: inset(25% 0 65% 0); transform: translate(4px,0); }
  30%  { clip-path: inset(70% 0 10% 0); transform: translate(-3px,0); }
  50%  { clip-path: inset(40% 0 45% 0); transform: translate(3px,0); }
  70%  { clip-path: inset(80% 0 5% 0); transform: translate(-4px,0); }
  85%  { clip-path: inset(10% 0 80% 0); transform: translate(4px,0); }
  100% { clip-path: inset(0 0 98% 0); transform: translate(0,0); }
}
@keyframes lp-glitch2 {
  0%   { clip-path: inset(45% 0 35% 0); transform: translate(4px,0) skewX(0.4deg); }
  30%  { clip-path: inset(10% 0 70% 0); transform: translate(-4px,0) skewX(-0.4deg); }
  60%  { clip-path: inset(75% 0 15% 0); transform: translate(3px,0) skewX(0.3deg); }
  100% { clip-path: inset(45% 0 35% 0); transform: translate(4px,0) skewX(0.4deg); }
}
@keyframes lp-flicker {
  0%,100%{ opacity:1; } 92%{ opacity:1; } 93%{ opacity:0.4; } 94%{ opacity:1; } 96%{ opacity:0.6; } 97%{ opacity:1; }
}
@keyframes lp-neon {
  0%,100%{ text-shadow:0 0 4px #E85419,0 0 12px #E85419,0 0 22px rgba(232,84,25,0.5); }
  50%    { text-shadow:0 0 8px #E85419,0 0 22px #E85419,0 0 44px rgba(232,84,25,0.5); }
}
@keyframes lp-bounce { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(5px); } }
.lp-glitch { position:relative; display:inline-block; }
.lp-glitch::before {
  content:attr(data-text); position:absolute; inset:0;
  font-family:inherit; font-size:inherit; font-weight:inherit; letter-spacing:inherit;
  color:#FF6B35; animation:lp-glitch 5s infinite linear;
}
.lp-glitch::after {
  content:attr(data-text); position:absolute; inset:0;
  font-family:inherit; font-size:inherit; font-weight:inherit; letter-spacing:inherit;
  color:#FF3333; animation:lp-glitch2 5s infinite linear; animation-delay:0.2s;
}
.lp-flicker { animation:lp-flicker 7s infinite; }
.lp-neon    { animation:lp-neon 3s ease-in-out infinite; }
.lp-bounce  { animation:lp-bounce 2s ease-in-out infinite; }
`

/* ─── Pipeline data ──────────────────────────────────────── */
const PIPELINE = [
  {
    id: 'capture', name: 'CAPTURE', tech: 'Multi-Source Ingestion', color: R,
    icon: Database,
    desc: 'Six dedicated crawlers and ingestors pull from MITRE ATT&CK, CISA KEV, NVD, AlienVault OTX, Telegram threat channels, GitHub IOC dumps, and abuse.ch feeds. n8n orchestrates execution schedules.',
    metrics: [{ l: 'DATA SOURCES', v: '9+' }, { l: 'CRAWLERS', v: '6' }, { l: 'UPTIME', v: '99.9%' }],
    tags: ['mitre-ingestor', 'telegram-crawler', 'dumps-crawler', 'feeds2stix', 'kevin-api', 'n8n'],
  },
  {
    id: 'enrich', name: 'ENRICH', tech: 'IntelOwl On-Demand', color: R,
    icon: ScanSearch,
    desc: 'Analyst-submitted IOCs trigger IntelOwl playbooks — SkyfallCTIipReputation, SkyfallCTIurlreputation, SkyfallCTIHashReputation. Results are converted to STIX by intelowl-client and pushed to enrichment.results.',
    metrics: [{ l: 'ANALYZERS', v: '50+' }, { l: 'PLAYBOOKS', v: '3' }, { l: 'FP RATE', v: '0.3%' }],
    tags: ['VirusTotal', 'Shodan', 'AbuseIPDB', 'MalwareBazaar', 'urlscan.io', 'Team Cymru'],
  },
  {
    id: 'normalize', name: 'NORMALIZE', tech: 'STIX 2.1', color: '#22d3ee',
    icon: GitMerge,
    desc: 'All raw threat data is normalized to STIX 2.1 objects: indicator, malware, attack-pattern, threat-actor, intrusion-set, vulnerability, sighting, identity, location, relationship, and bundle.',
    metrics: [{ l: 'OBJECT TYPES', v: '11' }, { l: 'REL TYPES', v: '6' }, { l: 'STANDARD', v: 'STIX 2.1' }],
    tags: ['indicator', 'malware', 'attack-pattern', 'intrusion-set', 'relationship', 'bundle'],
  },
  {
    id: 'stream', name: 'STREAM', tech: 'Apache Kafka', color: '#a855f7',
    icon: Radio,
    desc: 'STIX bundles flow through dedicated Kafka topics: stix.mitre, stix.osint, stix.telegram, stix.dumps, stix.cve, enrichment.results. Producers and consumers are fully decoupled with 7-day retention.',
    metrics: [{ l: 'TOPICS', v: '6' }, { l: 'LATENCY', v: '<5ms p99' }, { l: 'RETENTION', v: '7 days' }],
    tags: ['stix.mitre', 'stix.osint', 'stix.telegram', 'stix.dumps', 'stix.cve', 'enrichment.results'],
  },
  {
    id: 'correlate', name: 'CORRELATE', tech: 'Neo4j Graph DB', color: '#FF8C00',
    icon: Network,
    desc: 'consumer-neo4j reads Kafka, validates STIX bundles, creates nodes and relationships, deduplicates entities, and correlates new data with prior knowledge across the full graph.',
    metrics: [{ l: 'NODES', v: '5M+' }, { l: 'REL DEPTH', v: '12 hops' }, { l: 'QUERY AVG', v: '14ms' }],
    tags: ['Neo4j', 'Cypher', 'APOC', 'consumer-neo4j', 'deduplication', 'GDS'],
  },
  {
    id: 'store', name: 'STORE', tech: 'Neo4j Knowledge Graph', color: '#22c55e',
    icon: Database,
    desc: 'All correlated threat intelligence is persisted in Neo4j — a native graph database holding over 500,000 nodes spanning indicators, malware, threat actors, CVEs, ATT&CK techniques, and their relationships. Fully queryable via Cypher in real time.',
    metrics: [{ l: 'NODES', v: '500K+' }, { l: 'RELATIONSHIPS', v: '2M+' }, { l: 'ENGINE', v: 'Neo4j' }],
    tags: ['Neo4j', 'Cypher', 'APOC', 'GDS', 'indicators', 'threat-actors'],
  },
  {
    id: 'surface', name: 'SURFACE', tech: 'Skyfall Platform', color: '#22d3ee',
    icon: LayoutDashboard,
    desc: 'FastAPI exposes 20+ Cypher-backed endpoints. Next.js delivers IOC Explorer, CVE tracker, Malware registry, ATT&CK matrix, AI CTI chat, and Graph Console. MCP connects the graph to local LLMs for natural-language threat queries.',
    metrics: [{ l: 'API ENDPOINTS', v: '20+' }, { l: 'MODULES', v: '8' }, { l: 'API LATENCY', v: '<50ms' }],
    tags: ['FastAPI', 'Next.js', 'Neo4j', 'AI Chat', 'MCP', 'Skyfall Risk Score'],
  },
]

/* ─── Platform modules ───────────────────────────────────── */
const MODULES = [
  { icon: ScanSearch,    color: R,         title: 'IOC ANALYSIS ENGINE', metric: '50+ analyzers', body: 'Submit any IP, hash, or domain. IntelOwl routes to the correct playbook — SkyfallCTIipReputation, SkyfallCTIurlreputation, or SkyfallCTIHashReputation — and returns a unified verdict in seconds.', tags: ['IP','HASH','DOMAIN','URL'] },
  { icon: BrainCircuit,  color: '#a855f7', title: 'AI CTI ASSISTANT',   metric: 'Graph-powered Q&A', body: 'Natural-language interface to the Neo4j knowledge graph. MCP connects LLMs to CTI data — ask about TTPs, APT groups, CVEs, or campaign attribution with source attribution.', tags: ['MCP','Neo4j','LLM','RAG'] },
  { icon: Network,       color: '#22d3ee', title: 'GRAPH CONSOLE',      metric: '12-hop traversal', body: 'Full Neo4j browser with curated Cypher presets. Visualize actor → infrastructure → malware → victim relationships across 5M+ nodes.', tags: ['Cypher','Neo4j','ATT&CK','Viz'] },
  { icon: BarChart3,     color: '#FF8C00', title: 'DASHBOARDS',         metric: '4+ views', body: 'Real-time dashboards for IOC trends, CVE exposure, malware activity, and MITRE ATT&CK heatmap. All backed by Cypher queries to Neo4j.', tags: ['ATT&CK','CVEs','IOCs','MITRE'] },
]

const CAPABILITIES = [
  { icon: Shield,       title: 'THREAT ACTOR PROFILING',  body: 'Graph traversal correlates IOCs to known APT groups, ransomware operators, and cybercrime infrastructure via STIX intrusion-set and threat-actor relationships.' },
  { icon: Crosshair,    title: 'CAMPAIGN ATTRIBUTION',    body: 'Shared TTPs, infrastructure re-use, and temporal clustering link isolated incidents into attack narratives. Multi-source STIX fusion removes redundancy.' },
  { icon: BrainCircuit, title: 'AUTOMATED IOC SCORING',   body: 'IntelOwl playbooks aggregate 50+ analyzer verdicts. Skyfall Risk Score weights each indicator by recency, source reputation, and graph co-occurrence.' },
  { icon: GitMerge,     title: 'MULTI-SOURCE FUSION',     body: 'Cross-source deduplication merges fragments from MITRE, OTX, Telegram, GitHub, and IntelOwl enrichments into complete, non-redundant threat profiles.' },
]

const THREAT_FEED_BASE = [
  { region: 'RU', actor: 'APT29',      type: 'C2 Infrastructure', severity: 'CRITICAL' },
  { region: 'CN', actor: 'APT41',      type: 'Phishing Kit',       severity: 'HIGH'     },
  { region: 'KP', actor: 'Lazarus',    type: 'Ransomware',         severity: 'CRITICAL' },
  { region: 'IR', actor: 'MuddyWater', type: 'C2 Beacon',          severity: 'HIGH'     },
  { region: 'BR', actor: 'Unknown',    type: 'Botnet Loader',      severity: 'MEDIUM'   },
]

const SEV_COLOR: Record<string, string> = { CRITICAL: R, HIGH: '#FF8C00', MEDIUM: '#FFD700' }

/* ─── Pipeline card ──────────────────────────────────────── */
function PipelineCard({ step, idx }: { step: typeof PIPELINE[0]; idx: number }) {
  const [hov, setHov] = useState(false)
  const Icon = step.icon
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flexShrink: 0, width: 360, position: 'relative',
        background: hov ? `${step.color}06` : '#0D0D0D',
        border: `1px solid ${hov ? step.color + '40' : '#1a1a1a'}`,
        padding: 24, display: 'flex', flexDirection: 'column', gap: 14,
        transition: 'border-color 160ms, background 160ms',
        fontFamily: MONO,
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: step.color }} />
      <div style={{ position: 'absolute', top: -1, right: -1, width: 12, height: 12, borderTop: `2px solid ${step.color}`, borderRight: `2px solid ${step.color}` }} />
      <div style={{ position: 'absolute', bottom: -1, left: -1, width: 12, height: 12, borderBottom: `2px solid ${step.color}`, borderLeft: `2px solid ${step.color}` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ padding: 8, border: `1px solid ${step.color}40`, background: `${step.color}10` }}>
            <Icon size={16} color={step.color} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#4a4a4a', letterSpacing: '0.15em' }}>{step.tech}</div>
            <div style={{ fontSize: 20, color: step.color, letterSpacing: '0.2em', fontWeight: 700 }}>{step.name}</div>
          </div>
        </div>
        <span style={{ fontSize: 10, color: '#4a4a4a', letterSpacing: '0.12em' }}>
          {String(idx + 1).padStart(2, '0')} / {String(PIPELINE.length).padStart(2, '0')}
        </span>
      </div>
      <p style={{ fontSize: 12, color: MUT, lineHeight: 1.7, flex: 1 }}>{step.desc}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, borderTop: '1px solid #1a1a1a', paddingTop: 12 }}>
        {step.metrics.map(m => (
          <div key={m.l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: step.color, fontWeight: 700 }}>{m.v}</div>
            <div style={{ fontSize: 9, color: '#4a4a4a', letterSpacing: '0.12em', marginTop: 2 }}>{m.l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {step.tags.map(t => (
          <span key={t} style={{ fontSize: 9, padding: '2px 7px', border: `1px solid ${step.color}30`, color: `${step.color}80`, letterSpacing: '0.12em' }}>{t}</span>
        ))}
      </div>
    </div>
  )
}

/* ─── Main page ──────────────────────────────────────────── */
export default function LandingPage() {
  const pipelineRef = useRef<HTMLDivElement>(null)
  const trackRef    = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const heroTitleRef = useRef<HTMLHeadingElement>(null)
  const heroTagRef   = useRef<HTMLDivElement>(null)
  const heroSubRef   = useRef<HTMLParagraphElement>(null)
  const heroCtaRef   = useRef<HTMLDivElement>(null)
  const heroStatsRef = useRef<HTMLDivElement>(null)

  const [clock,   setClock]   = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [feed,    setFeed]    = useState(() =>
    THREAT_FEED_BASE.map((r, i) => ({ ...r, ts: `00:0${i}:00 UTC` }))
  )
  const [evtCount, setEvtCount] = useState(2341)

  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC')
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const actors  = ['APT28','FIN7','Lazarus','APT41','Scattered Spider','ALPHV','LockBit','Storm-0558']
    const types   = ['Malware Hash','C2 Domain','Phishing URL','Exploit Kit','Credential Dump','Ransomware']
    const regions = ['RU','CN','KP','IR','NG','UA','BR','TR']
    const sevs    = ['CRITICAL','HIGH','MEDIUM'] as const
    const id = setInterval(() => {
      const now = new Date()
      setFeed(prev => [{
        region: regions[Math.floor(Math.random() * regions.length)],
        actor:  actors[Math.floor(Math.random() * actors.length)],
        type:   types[Math.floor(Math.random() * types.length)],
        severity: sevs[Math.floor(Math.random() * sevs.length)],
        ts: now.toISOString().replace('T', ' ').slice(11, 19) + ' UTC',
      }, ...prev.slice(0, 4)])
      setEvtCount(c => c + Math.floor(Math.random() * 4 + 1))
    }, 4000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
    tl.from(heroTagRef.current,   { opacity: 0, y: -10, duration: 0.6, delay: 0.3 })
      .from(heroTitleRef.current, { opacity: 0, y: 30,  duration: 1.0 }, '-=0.2')
      .from(heroSubRef.current,   { opacity: 0, y: 20,  duration: 0.8 }, '-=0.4')
      .from(heroCtaRef.current,   { opacity: 0, y: 20,  duration: 0.8 }, '-=0.4')
      .from(heroStatsRef.current?.querySelectorAll('.stat-item') ?? [], { opacity: 0, y: 16, duration: 0.6, stagger: 0.15 }, '-=0.3')
    return () => { tl.kill() }
  }, [])

  useEffect(() => {
    if (!pipelineRef.current || !trackRef.current) return
    const totalW = trackRef.current.scrollWidth - window.innerWidth
    const ctx = gsap.context(() => {
      gsap.to(trackRef.current, {
        x: -totalW, ease: 'none',
        scrollTrigger: {
          trigger: pipelineRef.current, start: 'top top',
          end: `+=${totalW + 400}`, pin: true, scrub: 1, anticipatePin: 1,
          onUpdate: s => { if (progressRef.current) progressRef.current.style.width = `${s.progress * 100}%` },
        },
      })
    }, pipelineRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.lp-module-card', {
        opacity: 0, y: 20, duration: 0.6, stagger: 0.12,
        scrollTrigger: { trigger: '#lp-platform', start: 'top 78%' },
      })
      gsap.from('.lp-cap-item', {
        opacity: 0, x: -20, duration: 0.6, stagger: 0.15,
        scrollTrigger: { trigger: '#lp-caps', start: 'top 78%' },
      })
      gsap.from('.lp-platform-title', {
        opacity: 0, y: 30, duration: 0.8,
        scrollTrigger: { trigger: '#lp-platform', start: 'top 80%' },
      })
      gsap.from('.lp-globe-title', {
        opacity: 0, y: 30, duration: 0.8,
        scrollTrigger: { trigger: '#lp-globe', start: 'top 80%' },
      })
      gsap.from('.lp-feed-row', {
        opacity: 0, x: 20, duration: 0.5, stagger: 0.1,
        scrollTrigger: { trigger: '#lp-feed', start: 'top 80%' },
      })
    })
    return () => ctx.revert()
  }, [])

  const base: React.CSSProperties = { fontFamily: MONO, color: TXT, background: BG }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div style={{ ...base, minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>

        {/* ══════════ NAVBAR ══════════ */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', transition: 'all 300ms',
          background: scrolled ? 'rgba(0,0,0,0.95)' : 'transparent',
          borderBottom: scrolled ? `1px solid ${RD}` : 'none',
        }}>
          <a href="#lp-hero" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 2, height: 22, background: R, boxShadow: RG, flexShrink: 0 }} />
            <Shield size={15} color={R} />
            <span style={{ fontSize: 13, letterSpacing: '0.3em', color: TXT }}>
              SKYFALL<span style={{ color: R }}>_</span>CTI
            </span>
          </a>
          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {[['PIPELINE','#lp-pipeline'],['PLATFORM','#lp-platform'],['TELEMETRY','#lp-globe']].map(([l,h]) => (
              <a key={h} href={h} style={{ fontSize: 10, letterSpacing: '0.22em', color: MUT, textDecoration: 'none', transition: 'color 150ms' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = R }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = MUT }}>
                {l}
              </a>
            ))}
          </div>
          <a href="https://nologin.es/en/" target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 14px', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', transition: 'border-color 200ms' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = RD }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)' }}
          >
            <span style={{ fontSize: 8, color: '#4a4a4a', letterSpacing: '0.18em', whiteSpace: 'nowrap' }}>IN COLLAB. WITH</span>
            <NologinLogo height={32} />
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: GRN }}>
              <Radio size={8} style={{ animation: 'lp-flicker 3s infinite' }} /> ACTIVE
            </span>
            <span style={{ color: '#4a4a4a' }}>{clock}</span>
            <Link href="/enter"
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
                border: `1px solid ${R}`, color: R, textDecoration: 'none',
                fontSize: 10, letterSpacing: '0.18em', transition: 'all 200ms',
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = R; el.style.color = '#000' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = R }}
            >
              <Lock size={9} /> ENTER PLATFORM
            </Link>
          </div>
        </nav>

        {/* ══════════ HERO ══════════ */}
        <section id="lp-hero" style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
          <ParticleCanvas />
          <Scanlines />
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3,
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, pointerEvents: 'none', zIndex: 4,
            background: 'linear-gradient(to bottom, transparent, #000)' }} />
          <div style={{
            position: 'relative', zIndex: 6, height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '0 24px',
          }}>
            <div ref={heroTagRef} style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28,
              padding: '6px 16px', border: `1px solid ${RD}`, fontSize: 11, letterSpacing: '0.28em', color: R,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: GRN, boxShadow: `0 0 6px ${GRN}`, animation: 'lp-flicker 2s infinite' }} />
              <span style={{ color: GRN }}>THREAT INTELLIGENCE</span>
              <span style={{ color: RD }}>—</span>
              FEED ACTIVE
            </div>
            <h1
              ref={heroTitleRef}
              className="lp-glitch"
              data-text="SKYFALL_CTI"
              style={{ fontSize: 'clamp(2.8rem, 9vw, 7rem)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, color: '#fff', marginBottom: 20, marginTop: 0 }}
            >
              SKYFALL_CTI
            </h1>
            <p ref={heroSubRef} style={{ fontSize: 16, color: MUT, maxWidth: 540, lineHeight: 1.7, marginBottom: 36 }}>
              Cyber threat intelligence at machine speed.<br />
              <span style={{ color: R }}>Crawl.</span>{' '}
              <span style={{ color: R }}>Correlate.</span>{' '}
              <span style={{ color: R }}>Neutralize.</span>
            </p>
            <div ref={heroCtaRef} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 52 }}>
              <Link href="/enter" style={{
                padding: '12px 32px', background: R, color: '#000', textDecoration: 'none',
                fontSize: 12, fontWeight: 900, letterSpacing: '0.22em',
                boxShadow: `0 0 28px rgba(232,84,25,0.5)`, position: 'relative', transition: 'opacity 150ms',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
              >
                <Brackets color="#000" size={8} />
                ENTER PLATFORM
              </Link>
              <a href="https://nologin.es/en/contact" target="_blank" rel="noopener noreferrer" style={{
                padding: '12px 32px', border: `1px solid ${RD}`, color: R,
                textDecoration: 'none', fontSize: 12, letterSpacing: '0.22em',
                transition: 'all 200ms',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(232,84,25,0.10)'; el.style.borderColor = R }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.borderColor = RD }}
              >
                REQUEST ACCESS
              </a>
              <Link href="/demo" style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '12px 32px', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee',
                textDecoration: 'none', fontSize: 12, letterSpacing: '0.22em',
                transition: 'all 200ms',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(34,211,238,0.08)'; el.style.borderColor = '#22d3ee' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.borderColor = 'rgba(34,211,238,0.3)' }}
              >
                <Eye size={12} /> VIEW DEMO ANALYSIS
              </Link>
            </div>
            <div ref={heroStatsRef} style={{ display: 'flex', gap: 36, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { icon: Shield,   v: '9+',   l: 'CTI DATA SOURCES'    },
                { icon: Database, v: '50+',  l: 'INTELOWL ANALYZERS'  },
                { icon: Globe,    v: '14ms', l: 'GRAPH CORRELATION'   },
              ].map(({ icon: Icon, v, l }) => (
                <div key={l} className="stat-item" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon size={13} color={R} />
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{v}</div>
                    <div style={{ fontSize: 9, color: '#4a4a4a', letterSpacing: '0.15em', marginTop: 3 }}>{l}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'absolute', top: 72, left: 24, fontSize: 9, color: RD, letterSpacing: '0.15em', zIndex: 6 }}
            className="lp-flicker">
            <div>NODE_01 / MADRID-EU</div>
            <div style={{ color: 'rgba(0,255,65,0.5)', marginTop: 4 }}>● GRAPH ACTIVE</div>
          </div>
          <div style={{ position: 'absolute', top: 72, right: 24, textAlign: 'right', fontSize: 9, color: RD, letterSpacing: '0.15em', zIndex: 6 }}
            className="lp-flicker">
            <div>KAFKA TOPICS: 6 ACTIVE</div>
            <div style={{ color: 'rgba(0,255,65,0.5)', marginTop: 4 }}>● STIX 2.1 NORMALIZED</div>
          </div>
          <div className="lp-bounce" style={{
            position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: 'rgba(232,84,25,0.45)', zIndex: 6,
          }}>
            <span style={{ fontSize: 9, letterSpacing: '0.22em' }}>SCROLL</span>
            <ChevronDown size={14} />
          </div>
        </section>

        {/* ══════════ PIPELINE ══════════ */}
        <section id="lp-pipeline" ref={pipelineRef} style={{ position: 'relative', height: '100vh', overflow: 'hidden', background: BG }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#1a1a1a', zIndex: 20 }}>
            <div ref={progressRef} style={{ height: '100%', background: R, boxShadow: `0 0 8px rgba(232,84,25,0.6)`, width: '0%', transition: 'none' }} />
          </div>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            padding: '64px 32px 20px', zIndex: 10, background: BG,
            borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          }}>
            <div>
              <div style={{ fontSize: 10, color: R, letterSpacing: '0.25em', marginBottom: 4 }}>02 / DATA PIPELINE</div>
              <div style={{ fontSize: 28, letterSpacing: '0.2em', fontWeight: 700, color: '#fff' }}>FROM SOURCE TO INSIGHT</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#4a4a4a' }}>
              <Zap size={10} color={R} /> SCROLL TO TRAVERSE
            </div>
          </div>
          <div ref={trackRef} style={{ position: 'absolute', top: 136, left: 0, display: 'flex', alignItems: 'center', paddingLeft: 32, willChange: 'transform' }}>
            {PIPELINE.map((step, i) => (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
                <PipelineCard step={step} idx={i} />
                {i < PIPELINE.length - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', flexShrink: 0 }}>
                    <div style={{ width: 40, height: 1, background: 'rgba(232,84,25,0.2)' }} />
                    <Share2 size={11} color="rgba(232,84,25,0.4)" style={{ margin: '0 4px' }} />
                    <ArrowRight size={13} color="rgba(232,84,25,0.5)" />
                    <div style={{ width: 16, height: 1, background: 'rgba(232,84,25,0.2)' }} />
                  </div>
                )}
              </div>
            ))}
            <div style={{ flexShrink: 0, width: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginLeft: 28, padding: '0 28px' }}>
              <div style={{ width: 1, height: 56, background: 'linear-gradient(to bottom, #E85419, transparent)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#4a4a4a', letterSpacing: '0.18em', marginBottom: 6 }}>PIPELINE COMPLETE</div>
                <div className="lp-neon" style={{ fontSize: 36, fontWeight: 900 }}>4 MIN</div>
                <div style={{ fontSize: 9, color: '#4a4a4a', letterSpacing: '0.15em', marginTop: 4 }}>AVG MEAN TIME TO DETECT</div>
              </div>
              <Link href="/enter" style={{
                marginTop: 12, padding: '8px 20px', border: `1px solid ${RD}`,
                color: R, fontSize: 10, letterSpacing: '0.2em', textDecoration: 'none',
                transition: 'all 200ms',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = R; el.style.color = '#000' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = R }}
              >
                EXPLORE PLATFORM
              </Link>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 20, left: 28, right: 28, display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#4a4a4a', letterSpacing: '0.12em' }}>
            <div style={{ display: 'flex', gap: 20 }}>
              {[{ c: R, l: 'CRAWLERS ACTIVE (6)' }, { c: '#22d3ee', l: 'KAFKA TOPICS STREAMING (6)' }, { c: '#a855f7', l: 'NEO4J GRAPH ACTIVE' }].map(({ c, l }) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: c, animation: 'lp-flicker 2.5s infinite' }} />
                  {l}
                </span>
              ))}
            </div>
            <span>DRAG / SCROLL HORIZONTAL</span>
          </div>
        </section>

        {/* ══════════ PLATFORM MODULES ══════════ */}
        <section id="lp-platform" style={{ position: 'relative', background: BG, padding: '80px 28px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.03,
            backgroundImage: 'linear-gradient(#E85419 1px,transparent 1px),linear-gradient(90deg,#E85419 1px,transparent 1px)',
            backgroundSize: '40px 40px' }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ marginBottom: 48 }}>
              <div style={{ fontSize: 10, color: R, letterSpacing: '0.25em', marginBottom: 8 }}>03 / PLATFORM MODULES</div>
              <div className="lp-platform-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '0.15em', color: '#fff', lineHeight: 1.15 }}>
                INTELLIGENCE<br /><span style={{ color: R }}>COMMAND CENTER</span>
              </div>
              <p style={{ marginTop: 14, fontSize: 12, color: MUT, maxWidth: 520, lineHeight: 1.8 }}>
                Four integrated modules expose the full CTI pipeline to analysts — from raw IOC submission to graph-level correlation and AI-powered querying.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10, marginBottom: 72 }}>
              {MODULES.map(m => {
                const Icon = m.icon
                return (
                  <div key={m.title} className="lp-module-card" style={{ position: 'relative', padding: 20, background: '#0D0D0D', border: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer', transition: 'border-color 160ms,background 160ms' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${m.color}40`; el.style.background = `${m.color}08` }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#1a1a1a'; el.style.background = '#0D0D0D' }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: m.color, opacity: 0.6 }} />
                    <div style={{ position: 'absolute', top: -1, left: -1, width: 10, height: 10, borderTop: `2px solid ${m.color}`, borderLeft: `2px solid ${m.color}` }} />
                    <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderBottom: `2px solid ${m.color}`, borderRight: `2px solid ${m.color}` }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ padding: 8, border: `1px solid ${m.color}40`, background: `${m.color}10` }}>
                        <Icon size={15} color={m.color} />
                      </div>
                      <span style={{ fontSize: 9, color: `${m.color}99`, letterSpacing: '0.12em' }}>{m.metric}</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: m.color, letterSpacing: '0.18em' }}>{m.title}</div>
                    <p style={{ fontSize: 11, color: MUT, lineHeight: 1.7, flex: 1 }}>{m.body}</p>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {m.tags.map(t => <span key={t} style={{ fontSize: 9, padding: '2px 6px', border: `1px solid ${m.color}30`, color: `${m.color}80`, letterSpacing: '0.1em' }}>{t}</span>)}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 56, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div>
                  <div style={{ position: 'relative', padding: 4, border: `1px solid #2a2a2a` }}>
                    <Brackets color="#4a4a4a" size={10} />
                    <ChaosCanvas w={240} h={320} />
                  </div>
                  <div style={{ fontSize: 9, letterSpacing: '0.15em', marginTop: 8, textAlign: 'center', color: '#4a4a4a' }}>CHAOS / RAW DATA</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', height: 320, marginTop: 4, color: R, fontSize: 18, opacity: 0.5 }}>→</div>
                <div>
                  <div style={{ position: 'relative', padding: 4, border: `1px solid ${RD}` }}>
                    <Brackets color={R} size={10} />
                    <GraphCanvas w={240} h={320} />
                  </div>
                  <div style={{ fontSize: 9, letterSpacing: '0.15em', marginTop: 8, textAlign: 'center', color: R }}>STRUCTURE / INTEL</div>
                </div>
              </div>
              <div id="lp-caps" style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 22, marginTop: 8 }}>
                <div style={{ fontSize: 9, color: '#4a4a4a', letterSpacing: '0.2em', marginBottom: 4 }}>INTELLIGENCE ENGINE CAPABILITIES</div>
                {CAPABILITIES.map(({ icon: Icon, title, body }) => (
                  <div key={title} className="lp-cap-item" style={{ display: 'flex', gap: 14, cursor: 'pointer' }}>
                    <div style={{ flexShrink: 0, marginTop: 2 }}>
                      <div style={{ padding: 8, border: `1px solid ${RD}`, transition: 'all 200ms' }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = R; el.style.background = SRF }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = RD; el.style.background = 'transparent' }}
                      >
                        <Icon size={13} color={R} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: R, letterSpacing: '0.18em', marginBottom: 5, fontWeight: 700 }}>{title}</div>
                      <p style={{ fontSize: 12, color: MUT, lineHeight: 1.7 }}>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 64, paddingTop: 28, borderTop: '1px solid #1a1a1a', display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }}>
              {[['992.044','NODES'],['1.992.617','RELATIONSHIPS']].map(([v,l]) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <div className="lp-neon" style={{ fontSize: 26, fontWeight: 900 }}>{v}</div>
                  <div style={{ fontSize: 9, color: '#4a4a4a', letterSpacing: '0.15em', marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ GLOBAL TELEMETRY ══════════ */}
        <section id="lp-globe" style={{ background: BG, borderTop: '1px solid #1a1a1a', padding: '72px 28px 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ marginBottom: 40 }}>
              <div style={{ fontSize: 10, color: R, letterSpacing: '0.25em', marginBottom: 8 }}>04 / GLOBAL TELEMETRY</div>
              <div className="lp-globe-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '0.15em', color: '#fff' }}>
                THREAT LANDSCAPE
              </div>
              <p style={{ marginTop: 10, fontSize: 12, color: MUT, maxWidth: 480, lineHeight: 1.8 }}>
                Global monitoring of threat actor activity across 193 countries. Every arc is a confirmed C2 connection. Every pulse is a threat indicator.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 300 }}>
                <LandingGlobe />
              </div>
              <div id="lp-feed" style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ border: '1px solid #1a1a1a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#0D0D0D', borderBottom: '1px solid #1a1a1a' }}>
                    <span style={{ fontSize: 9, color: '#4a4a4a', letterSpacing: '0.18em' }}>THREAT FEED</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: GRN }}>
                      <Radio size={7} style={{ animation: 'lp-flicker 2s infinite' }} /> ACTIVE
                    </span>
                  </div>
                  {feed.map((item, i) => (
                    <div key={i} className="lp-feed-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: '1px solid #1a1a1a', cursor: 'pointer', transition: 'background 150ms' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#0D0D0D' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: SEV_COLOR[item.severity], boxShadow: `0 0 5px ${SEV_COLOR[item.severity]}`, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span style={{ fontSize: 9, color: '#4a4a4a' }}>[{item.region}]</span>
                          <span style={{ fontSize: 11, color: '#fff' }}>{item.actor}</span>
                        </div>
                        <div style={{ fontSize: 9, color: 'rgba(226,226,226,0.35)' }}>{item.type} · {item.ts}</div>
                      </div>
                      <span style={{ fontSize: 8, color: SEV_COLOR[item.severity], letterSpacing: '0.1em', flexShrink: 0 }}>{item.severity}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', background: '#0D0D0D', fontSize: 9 }}>
                    <span style={{ color: '#4a4a4a' }}>+{evtCount.toLocaleString()} events today</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: R }}>
                      <Zap size={8} /> REAL-TIME
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ INTEGRATIONS ══════════ */}
        <IntegrationsSection />

        {/* ══════════ CTA ══════════ */}
        <section style={{ background: BG, padding: '80px 28px 100px', borderTop: '1px solid #1a1a1a', textAlign: 'center' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', position: 'relative' }}>
            <Brackets color={R} size={20} />
            <div style={{ padding: '60px 40px' }}>
              <div style={{ fontSize: 10, color: R, letterSpacing: '0.3em', marginBottom: 16 }}>
                ▶ SKYFALL_CTI — THREAT_INTELLIGENCE_COMMAND_CENTER
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 3.2rem)', fontWeight: 900, letterSpacing: '0.06em', color: '#fff', marginBottom: 18, lineHeight: 1.15 }}>
                READY TO<br />
                <span style={{ color: R }}>ENTER THE PLATFORM?</span>
              </h2>
              <p style={{ fontSize: 13, color: MUT, lineHeight: 1.8, marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
                All modules are operational — IOC Analysis Engine, AI CTI Assistant, Graph Console, and Analytics Dashboards. Start investigating threats now.
              </p>
              <Link href="/enter"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 12,
                  padding: '18px 52px', background: R, color: '#000',
                  fontSize: 14, fontWeight: 900, letterSpacing: '0.28em',
                  textDecoration: 'none', position: 'relative',
                  boxShadow: `0 0 40px rgba(232,84,25,0.55), 0 0 80px rgba(232,84,25,0.2)`,
                  transition: 'opacity 150ms',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
              >
                <Brackets color="#000" size={10} />
                <Shield size={16} />
                START USING IT NOW
                <ArrowRight size={16} />
              </Link>
              <div style={{ marginTop: 24, fontSize: 10, color: '#4a4a4a', letterSpacing: '0.18em' }}>
                NO SETUP REQUIRED — PLATFORM READY
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ COLLABORATION ══════════ */}
        <section style={{ background: BG, padding: '40px 28px', borderTop: '1px solid #1a1a1a' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
            <div style={{ fontSize: 9, color: '#4a4a4a', letterSpacing: '0.28em' }}>DEVELOPED IN COLLABORATION WITH</div>
            <a href="https://nologin.es/en/" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 14, padding: '14px 28px', border: `1px solid ${RD}`, textDecoration: 'none', position: 'relative', transition: 'all 200ms' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = R; el.style.background = SRF }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = RD; el.style.background = 'transparent' }}
            >
              <Brackets color={R} size={8} />
              <NologinLogo height={50} />
              <ExternalLink size={10} color={R} />
            </a>
          </div>
        </section>

        {/* ══════════ FOOTER ══════════ */}
        <footer style={{ borderTop: '1px solid #1a1a1a', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 2, height: 20, background: R }} />
            <Shield size={13} color={R} />
            <span style={{ fontSize: 11, letterSpacing: '0.28em', color: TXT }}>
              SKYFALL<span style={{ color: R }}>_</span>CTI
            </span>
            <span style={{ fontSize: 9, color: '#4a4a4a', letterSpacing: '0.12em', marginLeft: 8 }}>
              © 2026 — ALL RIGHTS RESERVED
            </span>
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 9, color: '#4a4a4a', letterSpacing: '0.15em' }}>
            {[
              { icon: GitBranch,    label: 'GITHUB' },
              { icon: ExternalLink, label: 'DOCS'   },
              { icon: Layers,       label: 'API'    },
              { icon: Terminal,     label: 'CLI'    },
            ].map(({ icon: Icon, label }) => (
              <a key={label} href="#" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4a4a4a', textDecoration: 'none', transition: 'color 150ms' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = R }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#4a4a4a' }}
              >
                <Icon size={9} /> {label}
              </a>
            ))}
          </div>
        </footer>

      </div>
    </>
  )
}
