'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ParticleCanvas } from '@/components/ui/aether-flow-hero'
import { Shield, BarChart3, ScanSearch, ArrowRight, ChevronLeft, Network, Layers } from 'lucide-react'

const R    = '#E85419'
const MONO = "'JetBrains Mono','Share Tech Mono',monospace"

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
@keyframes lp-neon {
  0%,100%{ text-shadow:0 0 4px #E85419,0 0 12px #E85419,0 0 22px rgba(232,84,25,0.5); }
  50%    { text-shadow:0 0 8px #E85419,0 0 22px #E85419,0 0 44px rgba(232,84,25,0.5); }
}
@keyframes lp-flicker {
  0%,100%{ opacity:1; } 92%{ opacity:1; } 93%{ opacity:0.35; } 94%{ opacity:1; } 96%{ opacity:0.6; } 97%{ opacity:1; }
}
@keyframes card-pulse-orange {
  0%,100%{ box-shadow: 0 0 0 1px rgba(232,84,25,0.35), 0 0 40px rgba(232,84,25,0.10); }
  50%    { box-shadow: 0 0 0 1px rgba(232,84,25,0.65), 0 0 60px rgba(232,84,25,0.22); }
}
@keyframes card-pulse-cyan {
  0%,100%{ box-shadow: 0 0 0 1px rgba(34,211,238,0.25), 0 0 40px rgba(34,211,238,0.08); }
  50%    { box-shadow: 0 0 0 1px rgba(34,211,238,0.55), 0 0 60px rgba(34,211,238,0.18); }
}
@keyframes card-pulse-green {
  0%,100%{ box-shadow: 0 0 0 1px rgba(74,222,128,0.25), 0 0 40px rgba(74,222,128,0.08); }
  50%    { box-shadow: 0 0 0 1px rgba(74,222,128,0.55), 0 0 60px rgba(74,222,128,0.18); }
}
.card-orange { animation: card-pulse-orange 3.5s ease-in-out infinite; }
.card-cyan   { animation: card-pulse-cyan   3.5s ease-in-out 0.8s infinite; }
.card-green  { animation: card-pulse-green  3.5s ease-in-out 1.6s infinite; }
@keyframes card-pulse-purple {
  0%,100%{ box-shadow: 0 0 0 1px rgba(187,85,255,0.25), 0 0 40px rgba(187,85,255,0.08); }
  50%    { box-shadow: 0 0 0 1px rgba(187,85,255,0.55), 0 0 60px rgba(187,85,255,0.18); }
}
.card-purple { animation: card-pulse-purple 3.5s ease-in-out 2.4s infinite; }
.lp-neon    { animation: lp-neon 3s ease-in-out infinite; }
.lp-flicker { animation: lp-flicker 7s infinite; }
`

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

const OPTIONS = [
  {
    href:    '/dashboards',
    icon:    BarChart3,
    label:   'ANALYTICS DASHBOARDS',
    sub:     'INTELLIGENCE ANALYTICS',
    desc:    'IOC heatmaps, CVE exposure, malware activity, intrusion-set tracking, MITRE ATT&CK coverage and full graph node status.',
    tags:    ['IOC TRENDS', 'CVE TRACKER', 'MITRE ATT&CK', 'GRAPH STATUS'],
    color:   '#E85419',
    pulse:   'card-orange',
    metric:  '8 VIEWS',
  },
  {
    href:    '/explore',
    icon:    ScanSearch,
    label:   'IOC EXPLORER',
    sub:     'THREAT INTELLIGENCE EXPLORER',
    desc:    'Browse IOC indicators with graph preview, CVE database with EPSS scores, and MITRE ATT&CK matrix with 3D actor correlations.',
    tags:    ['IOC INDICATORS', 'CVE DATABASE', 'MITRE ATT&CK', '3D NODES'],
    color:   '#22d3ee',
    pulse:   'card-cyan',
    metric:  '3 TABS',
  },
  {
    href:    '/explore/graph',
    icon:    Network,
    label:   'GRAPH CONSOLE',
    sub:     'CTI KNOWLEDGE GRAPH',
    desc:    'Navigate the CTI knowledge graph — query nodes, traverse relationships and inspect the full STIX entity topology interactively.',
    tags:    ['STIX TOPOLOGY', 'LIVE GRAPH', 'IOC NODES', 'RELATIONSHIPS'],
    color:   '#4ade80',
    pulse:   'card-green',
    metric:  '5M+ NODES',
  },
  {
    href:    '/graph',
    icon:    Layers,
    label:   'DATA MODEL GRAPH',
    sub:     'STIX 2.1 SCHEMA EXPLORER',
    desc:    'Visualización 3D interactiva del esquema STIX 2.1 — nodos, relaciones, propiedades y origen de cada tipo de entidad en el grafo.',
    tags:    ['STIX 2.1', 'SCHEMA', '3D GRAPH', 'NEO4J TYPES'],
    color:   '#BB55FF',
    pulse:   'card-purple',
    metric:  '22 TIPOS',
  },
]

export default function ExploreHubPage() {
  const card0   = useRef<HTMLDivElement>(null)
  const card1   = useRef<HTMLDivElement>(null)
  const card2   = useRef<HTMLDivElement>(null)
  const card3   = useRef<HTMLDivElement>(null)
  const headerR = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<number | null>(null)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.from(headerR.current,                          { opacity: 0, y: -18, duration: 0.5, delay: 0.1 })
      .from([card0.current, card1.current, card2.current, card3.current], { opacity: 0, y: 44, duration: 0.65, stagger: 0.18 }, '-=0.15')
    return () => { tl.kill() }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#000', fontFamily: MONO, position: 'relative', overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Blurred bg */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        filter: 'blur(7px) brightness(0.28) saturate(1.6)',
        transform: 'scale(1.06)',
      }}>
        <ParticleCanvas />
      </div>

      {/* Scanlines */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.09) 3px,rgba(0,0,0,0.09) 4px)',
      }} />

      {/* Vignette */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.82) 100%)',
      }} />

      {/* Dot grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none', opacity: 0.035,
        backgroundImage: 'linear-gradient(#E85419 1px,transparent 1px),linear-gradient(90deg,#E85419 1px,transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 10,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px',
      }}>

        {/* Header */}
        <div ref={headerR} style={{ textAlign: 'center', marginBottom: 44 }}>
          <a href="/dashboard" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 9, letterSpacing: '0.22em', color: 'rgba(212,212,212,0.35)',
            textDecoration: 'none', marginBottom: 24, transition: 'color 150ms',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = R }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(212,212,212,0.35)' }}
          >
            <ChevronLeft size={10} /> BACK TO COMMAND CENTER
          </a>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 22 }}>
            <div style={{ width: 2, height: 24, background: R, boxShadow: `0 0 10px ${R}` }} />
            <Shield size={16} color={R} />
            <span style={{ fontSize: 13, letterSpacing: '0.3em', color: '#E2E2E2' }}>
              SKYFALL<span style={{ color: R }}>_</span>CTI
            </span>
          </div>

          <p className="lp-neon" style={{ fontSize: 10, letterSpacing: '0.3em', color: R, marginBottom: 10 }}>
            EXPLORE DATABASE
          </p>
          <h1 style={{
            fontSize: 'clamp(1.6rem, 4.5vw, 3rem)', fontWeight: 900,
            letterSpacing: '0.04em', color: '#fff', lineHeight: 1.1,
            margin: '0 0 10px',
          }}>
            SELECT YOUR<br />
            <span style={{ color: R }}>ACCESS MODE</span>
          </h1>
          <p className="lp-flicker" style={{ fontSize: 10, color: 'rgba(212,212,212,0.3)', letterSpacing: '0.16em' }}>
            KNOWLEDGE GRAPH — DEMO
          </p>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 380px))',
          justifyContent: 'center',
          gap: 20, width: '100%', maxWidth: 1240,
        }}>
          {OPTIONS.map((opt, i) => {
            const Icon = opt.icon
            const isHov = hovered === i
            return (
              <div
                key={opt.href}
                ref={i === 0 ? card0 : i === 1 ? card1 : i === 2 ? card2 : card3}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className={opt.pulse}
                style={{
                  position: 'relative',
                  background: isHov ? `${opt.color}12` : 'rgba(10,10,10,0.88)',
                  border: `1px solid ${opt.color}${isHov ? 'cc' : '55'}`,
                  transition: 'background 220ms, border-color 220ms',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: `linear-gradient(90deg, transparent, ${opt.color}, transparent)`,
                  opacity: isHov ? 1 : 0.5, transition: 'opacity 220ms',
                }} />

                <Brackets color={opt.color} size={10} />

                <Link href={opt.href} style={{ display: 'block', padding: '28px 26px', textDecoration: 'none' }}>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                    <div style={{
                      padding: '10px 12px',
                      border: `1px solid ${opt.color}50`,
                      background: `${opt.color}15`,
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                    }}>
                      <Icon size={20} color={opt.color} />
                      <span style={{ fontSize: 9, letterSpacing: '0.2em', color: opt.color, fontWeight: 700 }}>
                        {opt.sub}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 8, letterSpacing: '0.22em',
                      padding: '3px 8px',
                      border: `1px solid ${opt.color}40`,
                      color: `${opt.color}cc`,
                    }}>
                      {opt.metric}
                    </span>
                  </div>

                  <h2 style={{
                    fontSize: 'clamp(1.15rem, 2.8vw, 1.55rem)',
                    fontWeight: 900, letterSpacing: '0.07em',
                    color: isHov ? '#fff' : '#D4D4D4',
                    marginBottom: 12, lineHeight: 1.15,
                    transition: 'color 220ms',
                  }}>
                    {opt.label}
                  </h2>

                  <p style={{
                    fontSize: 12, lineHeight: 1.8,
                    color: isHov ? 'rgba(226,226,226,0.68)' : 'rgba(226,226,226,0.38)',
                    marginBottom: 18, transition: 'color 220ms',
                  }}>
                    {opt.desc}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 22 }}>
                    {opt.tags.map(tag => (
                      <span key={tag} style={{
                        fontSize: 8, letterSpacing: '0.15em', padding: '3px 8px',
                        border: `1px solid ${opt.color}35`, color: `${opt.color}99`,
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    paddingTop: 16, borderTop: `1px solid ${opt.color}25`,
                    fontSize: 11, fontWeight: 900, letterSpacing: '0.22em',
                    color: isHov ? opt.color : `${opt.color}70`,
                    transition: 'color 220ms',
                  }}>
                    ENTER
                    <ArrowRight size={13} style={{
                      transform: isHov ? 'translateX(5px)' : 'translateX(0)',
                      transition: 'transform 220ms',
                    }} />
                  </div>
                </Link>
              </div>
            )
          })}
        </div>

        {/* Bottom HUD strip */}
        <div style={{
          marginTop: 44, display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'center',
          fontSize: 9, letterSpacing: '0.18em',
        }}>
          {[
            { v: '326,511', l: 'IOC INDICATORS' },
            { v: '570',     l: 'CVEs TRACKED'   },
            { v: '191',     l: 'THREAT ACTORS'  },
            { v: '22',      l: 'STIX TYPES'     },
          ].map(({ v, l }) => (
            <span key={l} style={{ color: 'rgba(212,212,212,0.2)' }}>
              <span style={{ color: 'rgba(232,84,25,0.55)' }}>{v}</span>{'  '}{l}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
