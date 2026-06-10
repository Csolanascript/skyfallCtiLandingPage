'use client'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import NologinLogo from '@/components/ui/NologinLogo'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ParticleCanvas } from '@/components/ui/aether-flow-hero'
import { ChaosCanvas, GraphCanvas } from '@/components/landing/EntropyCanvas'
import { LandingGlobe } from '@/components/landing/LandingGlobe'
import IntegrationsSection from '@/components/landing/IntegrationsSection'
import { useTheme } from '@/lib/theme'
import {
  Shield, Radio, Lock, ChevronDown, Database, Globe,
  Network, ScanSearch, BarChart3, LayoutDashboard,
  ArrowRight, Share2, Zap, Crosshair, BrainCircuit, GitMerge,
  GitBranch, ExternalLink, Menu, X,
} from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

/* ─── Landing color context ──────────────────────────────── */
type LC = {
  R: string; RD: string; RG: string
  BG: string; TXT: string; MUT: string; SRF: string; GRN: string; MONO: string
  DIM: string; BDIM: string; CARD: string
  isDark: boolean
}
const LCtx = createContext<LC>({} as LC)
const useLC = () => useContext(LCtx)

/* ─── Bracket corners ────────────────────────────────────── */
function Brackets({ color, size = 10 }: { color?: string; size?: number }) {
  const { R } = useLC()
  const c = color ?? R
  const s: React.CSSProperties = { position: 'absolute', width: size, height: size }
  return (
    <>
      <div style={{ ...s, top: -1, left:  -1, borderTop:    `2px solid ${c}`, borderLeft:  `2px solid ${c}` }} />
      <div style={{ ...s, top: -1, right: -1, borderTop:    `2px solid ${c}`, borderRight: `2px solid ${c}` }} />
      <div style={{ ...s, bottom: -1, left:  -1, borderBottom: `2px solid ${c}`, borderLeft:  `2px solid ${c}` }} />
      <div style={{ ...s, bottom: -1, right: -1, borderBottom: `2px solid ${c}`, borderRight: `2px solid ${c}` }} />
    </>
  )
}

/* ─── Scanlines ──────────────────────────────────────────── */
function Scanlines() {
  const { isDark } = useLC()
  if (!isDark) return null
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
/* Mobile nav helpers */
@media (max-width: 768px) {
  .desktop-only { display: none !important; }
  .mobile-hamburger { display: inline-flex !important; }
  .mobile-menu { display: flex; }
}
@media (min-width: 769px) {
  .mobile-hamburger { display: none !important; }
  .mobile-menu { display: none !important; }
}
.mobile-hamburger { background: transparent; border: 1px solid transparent; padding: 6px 8px; border-radius: 6px; color: inherit; }
.mobile-enter { display: none; }
.mobile-menu {
  position: fixed; left: 0; right: 0; top: 56px; z-index: 110; display: none; flex-direction: column; gap: 12px;
  padding: 16px; background: rgba(0,0,0,0.85); color: #fff;
}
.mobile-menu a { color: #fff; text-decoration: none; padding: 10px 12px; border-radius: 6px; }
.mobile-menu .actions { display:flex; flex-direction:column; gap:10px; margin-top:6px }
@media (max-width: 420px) {
  .mobile-enter {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 10px;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-decoration: none;
    border-radius: 8px;
  }
}
`

/* ─── Pipeline data ──────────────────────────────────────── */
const PIPELINE = [
  {
    id: 'capture', name: 'COLLECT', tech: 'Multi-Source Ingestion', color: '#E85419',
    icon: Database,
    desc: 'Six crawlers pull threat data automatically from MITRE ATT&CK, CISA KEV, NVD, OTX, Telegram channels and GitHub dumps. No manual work — n8n schedules everything.',
    metrics: [{ l: 'DATA SOURCES', v: '9+' }, { l: 'CRAWLERS', v: '6' }, { l: 'UPTIME', v: '99.9%' }],
    tags: ['MITRE', 'CISA KEV', 'NVD', 'OTX', 'Telegram', 'n8n'],
  },
  {
    id: 'enrich', name: 'ANALYZE', tech: 'IntelOwl On-Demand', color: '#E85419',
    icon: ScanSearch,
    desc: 'When you submit an IOC, IntelOwl runs the right playbook — IP, URL or hash. It queries 50+ services like VirusTotal, Shodan and AbuseIPDB and returns a single unified result.',
    metrics: [{ l: 'ANALYZERS', v: '50+' }, { l: 'IOC TYPES', v: '3' }, { l: 'FP RATE', v: '0.3%' }],
    tags: ['VirusTotal', 'Shodan', 'AbuseIPDB', 'MalwareBazaar', 'urlscan.io', 'MHR'],
  },
  {
    id: 'normalize', name: 'NORMALIZE', tech: 'STIX 2.1', color: '#22d3ee',
    icon: GitMerge,
    desc: 'Everything is converted to STIX 2.1 — the industry standard for sharing threat intelligence. All sources end up in the same format so data can be compared and linked.',
    metrics: [{ l: 'OBJECT TYPES', v: '11' }, { l: 'REL TYPES', v: '6' }, { l: 'STANDARD', v: 'STIX 2.1' }],
    tags: ['indicator', 'malware', 'attack-pattern', 'intrusion-set', 'relationship', 'bundle'],
  },
  {
    id: 'stream', name: 'STREAM', tech: 'Apache Kafka', color: '#a855f7',
    icon: Radio,
    desc: 'Normalized data flows in real time through Kafka queues. Each source has its own channel, so nothing blocks anything else and data is never lost.',
    metrics: [{ l: 'TOPICS', v: '6' }, { l: 'LATENCY', v: '<5ms' }, { l: 'RETENTION', v: '7 days' }],
    tags: ['stix.mitre', 'stix.osint', 'stix.telegram', 'stix.dumps', 'stix.cve', 'enrichment.results'],
  },
  {
    id: 'correlate', name: 'CORRELATE', tech: 'Neo4j Graph DB', color: '#FF8C00',
    icon: Network,
    desc: 'Neo4j connects IOCs to malware, threat actors, techniques and other indicators. Duplicates are merged automatically so the graph stays clean and queryable.',
    metrics: [{ l: 'NODES', v: '5M+' }, { l: 'REL DEPTH', v: '12 hops' }, { l: 'QUERY AVG', v: '14ms' }],
    tags: ['Neo4j', 'Cypher', 'APOC', 'deduplication', 'GDS', 'relationships'],
  },
  {
    id: 'store', name: 'STORE', tech: 'Knowledge Graph', color: '#22c55e',
    icon: Database,
    desc: 'All threat intelligence lives in a graph database — indicators, malware families, threat actors, CVEs and ATT&CK techniques. Query it live, browse links, or export bundles.',
    metrics: [{ l: 'NODES', v: '500K+' }, { l: 'RELATIONSHIPS', v: '2M+' }, { l: 'ENGINE', v: 'Neo4j' }],
    tags: ['indicators', 'malware', 'threat-actors', 'CVEs', 'ATT&CK', 'bundles'],
  },
  {
    id: 'surface', name: 'EXPLORE', tech: 'Skyfall Platform', color: '#22d3ee',
    icon: LayoutDashboard,
    desc: 'A web platform with an IOC analyzer, CVE tracker, malware browser, ATT&CK matrix, graph console and AI chat. Submit IOCs, run queries and get answers — all from the browser.',
    metrics: [{ l: 'API ENDPOINTS', v: '20+' }, { l: 'MODULES', v: '8' }, { l: 'LATENCY', v: '<50ms' }],
    tags: ['IOC Analyzer', 'CVE Tracker', 'Graph Console', 'AI Chat', 'ATT&CK', 'Dashboards'],
  },
]

/* ─── Platform modules ───────────────────────────────────── */
const MODULES = [
  { icon: ScanSearch,    color: '#E85419',  title: 'IOC ANALYZER', metric: '50+ analyzers', body: 'Paste any IP, domain, hash or URL. The platform runs it through 50+ services automatically — VirusTotal, Shodan, AbuseIPDB and more — and gives you a single verdict with full detail.', tags: ['IP','HASH','DOMAIN','URL'] },
  { icon: BrainCircuit,  color: '#a855f7',  title: 'AI ASSISTANT',  metric: 'Ask in plain language', body: 'Ask questions about the graph in plain language — "what malware uses this IP?", "show me APT29 infrastructure". The AI queries Neo4j and answers with sources.', tags: ['MCP','Neo4j','LLM','RAG'] },
  { icon: Network,       color: '#22d3ee',  title: 'GRAPH EXPLORER', metric: '12-hop traversal', body: 'Browse how IOCs connect to malware, threat actors and ATT&CK techniques. Follow chains visually across 5M+ nodes or write your own Cypher queries.', tags: ['Cypher','Neo4j','ATT&CK','Viz'] },
  { icon: BarChart3,     color: '#FF8C00',  title: 'DASHBOARDS',    metric: '8 views', body: 'See the current threat picture at a glance — IOC trends, CVE exposure, malware activity and ATT&CK coverage. All backed by live queries to the graph.', tags: ['ATT&CK','CVEs','IOCs','MITRE'] },
]

const CAPABILITIES = [
  { icon: Shield,       title: 'THREAT ACTOR LOOKUP',   body: 'Link any IOC to known APT groups, ransomware operators or cybercrime infrastructure. The graph shows you who is behind an indicator and what else they use.' },
  { icon: Crosshair,    title: 'CAMPAIGN TRACKING',     body: 'Group related indicators by shared infrastructure, tactics and timing. Isolated IOCs become part of a bigger picture automatically.' },
  { icon: BrainCircuit, title: 'RISK SCORING',          body: 'Every IOC gets a score based on how many sources flagged it, how recent the data is and how it connects to known malicious activity in the graph.' },
  { icon: GitMerge,     title: 'DATA DEDUPLICATION',    body: 'The same indicator from multiple sources — MITRE, OTX, Telegram, manual submissions — is merged into one clean record so results are not repeated.' },
]

const THREAT_FEED_BASE = [
  { region: 'RU', actor: 'APT29',      type: 'C2 Infrastructure', severity: 'CRITICAL' },
  { region: 'CN', actor: 'APT41',      type: 'Phishing Kit',       severity: 'HIGH'     },
  { region: 'KP', actor: 'Lazarus',    type: 'Ransomware',         severity: 'CRITICAL' },
  { region: 'IR', actor: 'MuddyWater', type: 'C2 Beacon',          severity: 'HIGH'     },
  { region: 'BR', actor: 'Unknown',    type: 'Botnet Loader',      severity: 'MEDIUM'   },
]

/* ─── Pipeline card ──────────────────────────────────────── */
function PipelineCard({ step, idx, compact = false }: { step: typeof PIPELINE[0]; idx: number; compact?: boolean }) {
  const { MUT, DIM, BDIM, CARD } = useLC()
  const [hov, setHov] = useState(false)
  const Icon = step.icon
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flexShrink: 0, width: compact ? '100%' : 360, maxWidth: compact ? '100%' : 360, position: 'relative',
        background: hov ? `${step.color}06` : CARD,
        border: `1px solid ${hov ? step.color + '40' : BDIM}`,
        padding: 24, display: 'flex', flexDirection: 'column', gap: 14,
        transition: 'border-color 160ms, background 160ms',
        fontFamily: "'JetBrains Mono','Share Tech Mono',monospace",
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
            <div style={{ fontSize: 10, color: DIM, letterSpacing: '0.15em' }}>{step.tech}</div>
            <div style={{ fontSize: 20, color: step.color, letterSpacing: '0.2em', fontWeight: 700 }}>{step.name}</div>
          </div>
        </div>
        <span style={{ fontSize: 10, color: DIM, letterSpacing: '0.12em' }}>
          {String(idx + 1).padStart(2, '0')} / {String(PIPELINE.length).padStart(2, '0')}
        </span>
      </div>
      <p style={{ fontSize: 12, color: MUT, lineHeight: 1.7, flex: 1 }}>{step.desc}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, borderTop: `1px solid ${BDIM}`, paddingTop: 12 }}>
        {step.metrics.map(m => (
          <div key={m.l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: step.color, fontWeight: 700 }}>{m.v}</div>
            <div style={{ fontSize: 9, color: DIM, letterSpacing: '0.12em', marginTop: 2 }}>{m.l}</div>
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
  const { C, isDark } = useTheme()

  const R    = C.red
  const RD   = C.redDim
  const RG   = C.redGlow
  const BG   = C.bg
  const TXT  = C.white
  const MUT  = C.muted
  const SRF  = C.surface
  const GRN  = C.green
  const MONO = C.mono
  const DIM  = isDark ? '#4a4a4a' : 'rgba(0,0,0,0.42)'
  const BDIM = isDark ? '#1a1a1a' : 'rgba(0,0,0,0.09)'
  const CARD = isDark ? '#0D0D0D' : 'rgba(0,0,0,0.025)'
  const SEV_COLOR: Record<string, string> = { CRITICAL: R, HIGH: C.orange, MEDIUM: '#FFD700' }

  const lc: LC = { R, RD, RG, BG, TXT, MUT, SRF, GRN, MONO, DIM, BDIM, CARD, isDark }

  const pipelineRef = useRef<HTMLDivElement>(null)
  const trackRef    = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const heroTitleRef = useRef<HTMLHeadingElement>(null)
  const heroSubRef   = useRef<HTMLParagraphElement>(null)
  const heroCtaRef   = useRef<HTMLDivElement>(null)
  const heroStatsRef = useRef<HTMLDivElement>(null)

  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [feed,    setFeed]    = useState(() =>
    THREAT_FEED_BASE.map((r, i) => ({ ...r, ts: `00:0${i}:00 UTC` }))
  )
  const [evtCount, setEvtCount] = useState(2341)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const calc = () => setIsMobile(window.innerWidth <= 420)
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
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
    tl.from(heroTitleRef.current, { opacity: 0, y: 30,  duration: 1.0, delay: 0.3 })
      .from(heroSubRef.current,   { opacity: 0, y: 20,  duration: 0.8 }, '-=0.4')
      .from(heroCtaRef.current,   { opacity: 0, y: 20,  duration: 0.8 }, '-=0.4')
      .from(heroStatsRef.current?.querySelectorAll('.stat-item') ?? [], { opacity: 0, y: 16, duration: 0.6, stagger: 0.15 }, '-=0.3')
    return () => { tl.kill() }
  }, [])

  useEffect(() => {
    if (isMobile) return
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
  }, [isMobile])

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

  return (
    <LCtx.Provider value={lc}>
      <>
        <style dangerouslySetInnerHTML={{ __html: STYLES }} />
        <div style={{ fontFamily: MONO, color: TXT, background: BG, minHeight: '100vh', position: 'relative', overflowX: 'hidden', transition: 'background 300ms, color 300ms' }}>

          {/* ══════════ NAVBAR ══════════ */}
          <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 56,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: isMobile ? '0 10px' : '0 28px', transition: 'all 300ms',
            background: scrolled ? (isDark ? 'rgba(0,0,0,0.95)' : 'rgba(240,239,232,0.97)') : 'transparent',
            borderBottom: scrolled ? `1px solid ${RD}` : 'none',
          }}>
            <a href="#lp-hero" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{ width: 2, height: 22, background: R, boxShadow: RG, flexShrink: 0 }} />
              <Shield size={15} color={R} />
              <span style={{ fontSize: 13, letterSpacing: '0.3em', color: TXT }}>
                SKYFALL<span style={{ color: R }}>_</span>CTI
              </span>
            </a>
            <div style={{ display: 'flex', gap: isMobile ? 8 : 28, alignItems: 'center' }}>
              <button aria-label="menu" className="mobile-hamburger" onClick={() => setMobileMenuOpen(v => !v)}>
                {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
              {[['PIPELINE','#lp-pipeline'],['PLATFORM','#lp-platform'],['TELEMETRY','#lp-globe']].map(([l,h]) => (
                <a key={h} href={h} className="desktop-only" style={{ fontSize: 10, letterSpacing: '0.22em', color: MUT, textDecoration: 'none', transition: 'color 150ms' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = R }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = MUT }}>
                  {l}
                </a>
              ))}
            </div>
            <Link href="/dashboard" className="mobile-enter" style={{ border: `1px solid ${R}`, color: R }}>
              ENTER
            </Link>
            <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 10, color: MUT }}>
              <a href="https://nologin.es/en/" target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 14px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)'}`, textDecoration: 'none', transition: 'border-color 200ms' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = RD }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)' }}
              >
                <span style={{ fontSize: 8, color: DIM, letterSpacing: '0.18em', whiteSpace: 'nowrap' }}>IN COLLAB. WITH</span>
                <NologinLogo height={32} />
              </a>
<Link href="/dashboard"
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
            {mobileMenuOpen && (
              <div className="mobile-menu" role="dialog" aria-label="mobile navigation">
                <a href="#lp-pipeline" onClick={() => setMobileMenuOpen(false)}>PIPELINE</a>
                <a href="#lp-platform" onClick={() => setMobileMenuOpen(false)}>PLATFORM</a>
                <a href="#lp-globe" onClick={() => setMobileMenuOpen(false)}>TELEMETRY</a>
                <div className="actions">
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ padding: '10px', borderRadius: 8, background: R, color: '#000', textDecoration: 'none', textAlign: 'center' }}>ENTER PLATFORM</Link>
                </div>
              </div>
            )}
          </nav>

          {/* ══════════ HERO ══════════ */}
          <section id="lp-hero" style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
            <ParticleCanvas />
            <Scanlines />
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3,
              background: `radial-gradient(ellipse at center, transparent 30%, ${isDark ? 'rgba(0,0,0,0.85)' : 'rgba(240,239,232,0.75)'} 100%)` }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, pointerEvents: 'none', zIndex: 4,
              background: `linear-gradient(to bottom, transparent, ${BG})` }} />
            <div style={{
              position: 'relative', zIndex: 6, height: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', padding: '0 24px',
            }}>
              <h1
                ref={heroTitleRef}
                className="lp-glitch"
                data-text="SKYFALL_CTI"
                style={{ fontSize: 'clamp(2.8rem, 9vw, 7rem)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, color: isDark ? '#fff' : '#080808', marginBottom: 20, marginTop: 0 }}
              >
                SKYFALL_CTI
              </h1>
              <p ref={heroSubRef} style={{ fontSize: 16, color: MUT, maxWidth: 520, lineHeight: 1.7, marginBottom: 36 }}>
                Submit any IP, domain, hash or URL.<br />
                <span style={{ color: R }}>50+ analyzers.</span>{' '}
                <span style={{ color: R }}>Full report.</span>{' '}
                <span style={{ color: R }}>Under 4 minutes.</span>
              </p>
              <div ref={heroStatsRef} style={{ display: 'flex', gap: 36, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  { icon: ScanSearch, v: '50+',  l: 'IOC ANALYZERS'     },
                  { icon: Database,   v: '9+',   l: 'THREAT FEEDS'      },
                  { icon: Network,    v: '5M+',  l: 'GRAPH NODES'       },
                ].map(({ icon: Icon, v, l }) => (
                  <div key={l} className="stat-item" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon size={13} color={R} />
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: isDark ? '#fff' : '#080808', lineHeight: 1 }}>{v}</div>
                      <div style={{ fontSize: 9, color: DIM, letterSpacing: '0.15em', marginTop: 3 }}>{l}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-bounce" style={{
              position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: `${R}70`, zIndex: 6,
            }}>
              <span style={{ fontSize: 9, letterSpacing: '0.22em' }}>SCROLL</span>
              <ChevronDown size={14} />
            </div>
          </section>

          {/* ══════════ PIPELINE ══════════ */}
          <section id="lp-pipeline" ref={pipelineRef} style={{ position: 'relative', height: isMobile ? 'auto' : '100vh', overflow: isMobile ? 'visible' : 'hidden', background: BG, transition: 'background 300ms', paddingBottom: isMobile ? 24 : 0 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: BDIM, zIndex: 20 }}>
              <div ref={progressRef} style={{ height: '100%', background: R, boxShadow: `0 0 8px ${R}80`, width: '0%', transition: 'none' }} />
            </div>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              padding: isMobile ? '64px 14px 14px' : '64px 32px 20px', zIndex: 10, background: BG,
              borderBottom: `1px solid ${BDIM}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
              transition: 'background 300ms',
            }}>
              <div>
                <div style={{ fontSize: 10, color: R, letterSpacing: '0.25em', marginBottom: 4 }}>02 / HOW IT WORKS</div>
                <div style={{ fontSize: 28, letterSpacing: '0.2em', fontWeight: 700, color: TXT }}>FROM IOC TO ANSWER</div>
              </div>
              {!isMobile && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: DIM }}>
                <Zap size={10} color={R} /> SCROLL TO TRAVERSE
              </div>}
            </div>
            <div ref={trackRef} style={{ position: isMobile ? 'relative' : 'absolute', top: isMobile ? 0 : 136, left: 0, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? 12 : 0, paddingLeft: isMobile ? 14 : 32, paddingRight: isMobile ? 14 : 0, paddingTop: isMobile ? 146 : 0, willChange: 'transform' }}>
              {PIPELINE.map((step, i) => (
                <div key={step.id} style={{ display: 'flex', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
                  <PipelineCard step={step} idx={i} compact={isMobile} />
                  {!isMobile && i < PIPELINE.length - 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', flexShrink: 0 }}>
                      <div style={{ width: 40, height: 1, background: `${R}30` }} />
                      <Share2 size={11} color={`${R}60`} style={{ margin: '0 4px' }} />
                      <ArrowRight size={13} color={`${R}70`} />
                      <div style={{ width: 16, height: 1, background: `${R}30` }} />
                    </div>
                  )}
                </div>
              ))}
              <div style={{ flexShrink: 0, width: isMobile ? '100%' : 260, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginLeft: isMobile ? 0 : 28, padding: isMobile ? '8px 0 0' : '0 28px' }}>
                <div style={{ width: 1, height: 56, background: `linear-gradient(to bottom, ${R}, transparent)` }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: DIM, letterSpacing: '0.18em', marginBottom: 6 }}>PIPELINE COMPLETE</div>
                  <div className="lp-neon" style={{ fontSize: 36, fontWeight: 900, color: TXT }}>4 MIN</div>
                  <div style={{ fontSize: 9, color: DIM, letterSpacing: '0.15em', marginTop: 4 }}>AVG MEAN TIME TO DETECT</div>
                </div>
                <Link href="/dashboard" style={{
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
            {!isMobile && <div style={{ position: 'absolute', bottom: 20, left: 28, right: 28, display: 'flex', justifyContent: 'space-between', fontSize: 9, color: DIM, letterSpacing: '0.12em' }}>
              <div style={{ display: 'flex', gap: 20 }}>
                {[{ c: R, l: 'CRAWLERS (6)' }, { c: '#22d3ee', l: 'KAFKA TOPICS STREAMING (6)' }, { c: '#a855f7', l: 'NEO4J GRAPH' }].map(({ c, l }) => (
                  <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: c, animation: 'lp-flicker 2.5s infinite' }} />
                    {l}
                  </span>
                ))}
              </div>
              <span>DRAG / SCROLL HORIZONTAL</span>
            </div>}
          </section>

          {/* ══════════ PLATFORM MODULES ══════════ */}
          <section id="lp-platform" style={{ position: 'relative', background: BG, padding: isMobile ? '66px 14px' : '80px 28px', overflow: 'hidden', transition: 'background 300ms' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: isDark ? 0.03 : 0.015,
              backgroundImage: `linear-gradient(${R} 1px,transparent 1px),linear-gradient(90deg,${R} 1px,transparent 1px)`,
              backgroundSize: '40px 40px' }} />
            <div style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto' }}>
              <div style={{ marginBottom: 48 }}>
                <div style={{ fontSize: 10, color: R, letterSpacing: '0.25em', marginBottom: 8 }}>03 / THE PLATFORM</div>
                <div className="lp-platform-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '0.15em', color: TXT, lineHeight: 1.15 }}>
                  EVERYTHING YOU NEED<br /><span style={{ color: R }}>TO ANALYZE THREATS</span>
                </div>
                <p style={{ marginTop: 14, fontSize: 12, color: MUT, maxWidth: 520, lineHeight: 1.8 }}>
                  Submit IOCs, explore the knowledge graph, track CVEs and query threat actors — all from one place.
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10, marginBottom: 72 }}>
                {MODULES.map(m => {
                  const Icon = m.icon
                  return (
                    <div key={m.title} className="lp-module-card" style={{ position: 'relative', padding: 20, background: CARD, border: `1px solid ${BDIM}`, display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer', transition: 'border-color 160ms,background 160ms' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${m.color}40`; el.style.background = `${m.color}08` }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = BDIM; el.style.background = CARD }}
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
              <div style={{ display: 'flex', gap: isMobile ? 26 : 56, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {!isMobile && <div style={{ flexShrink: 0, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 14, alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
                  <div>
                    <div style={{ position: 'relative', padding: 4, border: `1px solid ${BDIM}` }}>
                      <Brackets color={DIM} size={10} />
                      <ChaosCanvas w={isMobile ? 170 : 240} h={isMobile ? 220 : 320} />
                    </div>
                    <div style={{ fontSize: 9, letterSpacing: '0.15em', marginTop: 8, textAlign: 'center', color: DIM }}>CHAOS / RAW DATA</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', height: isMobile ? 'auto' : 320, marginTop: 4, color: R, fontSize: 18, opacity: 0.5 }}>{isMobile ? '↓' : '→'}</div>
                  <div>
                    <div style={{ position: 'relative', padding: 4, border: `1px solid ${RD}` }}>
                      <Brackets size={10} />
                      <GraphCanvas w={isMobile ? 170 : 240} h={isMobile ? 220 : 320} />
                    </div>
                    <div style={{ fontSize: 9, letterSpacing: '0.15em', marginTop: 8, textAlign: 'center', color: R }}>STRUCTURE / INTEL</div>
                  </div>
                </div>}
                <div id="lp-caps" style={{ flex: 1, minWidth: isMobile ? 0 : 280, width: isMobile ? '100%' : 'auto', display: 'flex', flexDirection: 'column', gap: 22, marginTop: 8 }}>
                  <div style={{ fontSize: 9, color: DIM, letterSpacing: '0.2em', marginBottom: 4 }}>WHAT THE PLATFORM CAN DO</div>
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
              <div style={{ marginTop: 64, paddingTop: 36, borderTop: `1px solid ${BDIM}`, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 24 }}>
                {[['992.044','NODES'],['1.992.617','RELATIONSHIPS']].map(([v,l]) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div className="lp-neon" style={{ fontSize: 'clamp(3.2rem, 8vw, 7rem)', fontWeight: 900, color: TXT, lineHeight: 1 }}>{v}</div>
                    <div style={{ fontSize: 13, color: DIM, letterSpacing: '0.22em', marginTop: 10 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════ GLOBAL TELEMETRY ══════════ */}
          <section id="lp-globe" style={{ background: BG, borderTop: `1px solid ${BDIM}`, padding: isMobile ? '66px 14px 0' : '72px 28px 0', transition: 'background 300ms' }}>
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
              <div style={{ marginBottom: 40 }}>
                <div style={{ fontSize: 10, color: R, letterSpacing: '0.25em', marginBottom: 8 }}>04 / THREAT ACTIVITY</div>
                <div className="lp-globe-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '0.15em', color: TXT }}>
                  WHERE THREATS<br /><span style={{ color: R }}>COME FROM</span>
                </div>
                <p style={{ marginTop: 10, fontSize: 12, color: MUT, maxWidth: 480, lineHeight: 1.8 }}>
                  Live view of attack origins and connections tracked by the platform. Each arc is a known threat path. Each point is a monitored location.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: isMobile ? 0 : 300, width: isMobile ? '100%' : 'auto' }}>
                  <LandingGlobe />
                </div>
                <div id="lp-feed" style={{ width: isMobile ? '100%' : 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ border: `1px solid ${BDIM}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: CARD, borderBottom: `1px solid ${BDIM}` }}>
                      <span style={{ fontSize: 9, color: DIM, letterSpacing: '0.18em' }}>THREAT FEED</span>
                      </div>
                    {feed.map((item, i) => (
                      <div key={i} className="lp-feed-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: `1px solid ${BDIM}`, cursor: 'pointer', transition: 'background 150ms' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = CARD }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      >
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: SEV_COLOR[item.severity], boxShadow: `0 0 5px ${SEV_COLOR[item.severity]}`, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <span style={{ fontSize: 9, color: DIM }}>[{item.region}]</span>
                            <span style={{ fontSize: 11, color: TXT }}>{item.actor}</span>
                          </div>
                          <div style={{ fontSize: 9, color: MUT }}>{item.type} · {item.ts}</div>
                        </div>
                        <span style={{ fontSize: 8, color: SEV_COLOR[item.severity], letterSpacing: '0.1em', flexShrink: 0 }}>{item.severity}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', background: CARD, fontSize: 9 }}>
                      <span style={{ color: DIM }}>+{evtCount.toLocaleString()} events today</span>
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
          <section style={{ background: BG, padding: isMobile ? '66px 14px 86px' : '80px 28px 100px', borderTop: `1px solid ${BDIM}`, textAlign: 'center', transition: 'background 300ms' }}>
            <div style={{ maxWidth: 680, margin: '0 auto', position: 'relative' }}>
              <Brackets size={20} />
              <div style={{ padding: isMobile ? '42px 16px' : '60px 40px' }}>
                <div style={{ fontSize: 10, color: R, letterSpacing: '0.3em', marginBottom: 16 }}>
                  ▶ SKYFALL_CTI
                </div>
                <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 3.2rem)', fontWeight: 900, letterSpacing: '0.06em', color: TXT, marginBottom: 18, lineHeight: 1.15 }}>
                  START ANALYZING<br />
                  <span style={{ color: R }}>YOUR FIRST IOC</span>
                </h2>
                <p style={{ fontSize: 13, color: MUT, lineHeight: 1.8, marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
                  Paste an IP, domain, hash or URL and get a full threat report in seconds. Or explore the graph, browse dashboards and track CVEs.
                </p>
                <Link href="/enter"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 12,
                    padding: isMobile ? '14px 18px' : '18px 52px', background: R, color: '#000',
                    fontSize: 14, fontWeight: 900, letterSpacing: '0.28em',
                    textDecoration: 'none', position: 'relative',
                    boxShadow: `0 0 40px ${R}80, 0 0 80px ${R}30`,
                    transition: 'opacity 150ms',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                >
                  <Brackets color="#000" size={10} />
                  <Shield size={16} />
                  START USING IT
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </section>

          {/* ══════════ COLLABORATION ══════════ */}
          <section style={{ background: BG, padding: '40px 28px', borderTop: `1px solid ${BDIM}`, transition: 'background 300ms' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
              <div style={{ fontSize: 9, color: DIM, letterSpacing: '0.28em' }}>DEVELOPED IN COLLABORATION WITH</div>
              <a href="https://nologin.es/en/" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 14, padding: '14px 28px', border: `1px solid ${RD}`, textDecoration: 'none', position: 'relative', transition: 'all 200ms' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = R; el.style.background = SRF }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = RD; el.style.background = 'transparent' }}
              >
                <Brackets size={8} />
                <NologinLogo height={50} />
                <ExternalLink size={10} color={R} />
              </a>
            </div>
          </section>

          {/* ══════════ FOOTER ══════════ */}
          <footer style={{ borderTop: `1px solid ${BDIM}`, padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, background: BG, transition: 'background 300ms' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 2, height: 20, background: R }} />
              <Shield size={13} color={R} />
              <span style={{ fontSize: 11, letterSpacing: '0.28em', color: TXT }}>
                SKYFALL<span style={{ color: R }}>_</span>CTI
              </span>
              <span style={{ fontSize: 9, color: DIM, letterSpacing: '0.12em', marginLeft: 8 }}>
                © 2026 — ALL RIGHTS RESERVED
              </span>
            </div>
            <div style={{ display: 'flex', gap: 20, fontSize: 9, color: DIM, letterSpacing: '0.15em' }}>
              {[
                { icon: GitBranch,    label: 'GITHUB', href: 'https://github.com/Csolanascript/Skyfall-CTI', external: true },
                { icon: ExternalLink, label: 'DOCS',   href: '/api/docs', external: true },
              ].map(({ icon: Icon, label, href, external }) => (
                <a key={label} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, color: DIM, textDecoration: 'none', transition: 'color 150ms' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = R }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = DIM }}
                >
                  <Icon size={9} /> {label}
                </a>
              ))}
            </div>
          </footer>

        </div>
      </>
    </LCtx.Provider>
  )
}
