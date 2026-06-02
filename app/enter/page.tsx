'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ParticleCanvas } from '@/components/ui/aether-flow-hero'
import { Shield, BarChart3, ScanSearch, ArrowRight, ChevronLeft, Cpu, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme'

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
@keyframes card-pulse-violet {
  0%,100%{ box-shadow: 0 0 0 1px rgba(139,92,246,0.25), 0 0 40px rgba(139,92,246,0.08); }
  50%    { box-shadow: 0 0 0 1px rgba(139,92,246,0.55), 0 0 60px rgba(139,92,246,0.18); }
}
.card-orange { animation: card-pulse-orange 3.5s ease-in-out infinite; }
.card-cyan   { animation: card-pulse-cyan   3.5s ease-in-out 0.8s infinite; }
.card-violet { animation: card-pulse-violet 3.5s ease-in-out 1.6s infinite; }
.lp-neon    { animation: lp-neon 3s ease-in-out infinite; }
.lp-flicker { animation: lp-flicker 7s infinite; }
`

function Brackets({ color, size = 10 }: { color?: string; size?: number }) {
  const s: React.CSSProperties = { position: 'absolute', width: size, height: size }
  const c = color ?? '#E85419'
  return (
    <>
      <div style={{ ...s, top: -1, left:  -1, borderTop:    `2px solid ${c}`, borderLeft:  `2px solid ${c}` }} />
      <div style={{ ...s, top: -1, right: -1, borderTop:    `2px solid ${c}`, borderRight: `2px solid ${c}` }} />
      <div style={{ ...s, bottom: -1, left:  -1, borderBottom: `2px solid ${c}`, borderLeft:  `2px solid ${c}` }} />
      <div style={{ ...s, bottom: -1, right: -1, borderBottom: `2px solid ${c}`, borderRight: `2px solid ${c}` }} />
    </>
  )
}

const OPTIONS = [
  {
    href:    '/dashboard',
    icon:    BarChart3,
    label:   'EXPLORE DASHBOARDS',
    sub:     'INTELLIGENCE ANALYTICS',
    desc:    'IOC heatmaps, CVE exposure, malware activity, intrusion-set tracking, MITRE ATT&CK coverage and full Neo4j graph node status.',
    tags:    ['IOC TRENDS', 'CVE TRACKER', 'MITRE ATT&CK', 'GRAPH STATUS'],
    color:   '#E85419',
    pulse:   'card-orange',
    metric:  '8 VIEWS',
  },
  {
    href:    '/explore',
    icon:    ScanSearch,
    label:   'EXPLORE CONTENTS',
    sub:     'THREAT INTELLIGENCE EXPLORER',
    desc:    'Browse IOC indicators with graph preview, CVE database with EPSS scores, and MITRE ATT&CK matrix with 3D actor correlations.',
    tags:    ['IOC EXPLORER', 'CVE DATABASE', 'MITRE ATT&CK', '3D NODES'],
    color:   '#22d3ee',
    pulse:   'card-cyan',
    metric:  '3 TABS',
  },
  {
    href:    '/forge',
    icon:    Cpu,
    label:   'STIX FORGE',
    sub:     'BUNDLE BUILDER',
    desc:    'Create STIX 2.1 entities visually — no JSON. Define relationships, pick from existing graph nodes, and ingest with live inference across 18 phases.',
    tags:    ['STIX 2.1', 'LIVE INFERENCE', 'GRAPH INGEST', 'ZERO JSON'],
    color:   '#8b5cf6',
    pulse:   'card-violet',
    metric:  '18 PHASES',
  },
]

export default function EnterPage() {
  const { C, isDark, toggle } = useTheme()
  const MONO = C.mono

  const card0   = useRef<HTMLDivElement>(null)
  const card1   = useRef<HTMLDivElement>(null)
  const card2   = useRef<HTMLDivElement>(null)
  const headerR = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<number | null>(null)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.from(headerR.current,                          { opacity: 0, y: -18, duration: 0.5, delay: 0.1 })
      .from([card0.current, card1.current, card2.current], { opacity: 0, y: 44, duration: 0.65, stagger: 0.18 }, '-=0.15')
    return () => { tl.kill() }
  }, [])

  const txtPrimary   = isDark ? '#E2E2E2' : '#1A1A1A'
  const txtMuted     = isDark ? 'rgba(212,212,212,0.35)' : 'rgba(26,26,26,0.40)'
  const txtBody      = isDark ? 'rgba(226,226,226,0.38)' : 'rgba(30,30,30,0.55)'
  const txtBodyHov   = isDark ? 'rgba(226,226,226,0.68)' : 'rgba(30,30,30,0.85)'
  const cardBg       = isDark ? 'rgba(10,10,10,0.88)'   : 'rgba(245,245,240,0.94)'
  const cardBgHov    = (color: string) => isDark ? `${color}12` : `${color}0e`
  const dimStats     = isDark ? 'rgba(212,212,212,0.2)' : 'rgba(30,30,30,0.25)'
  const titleHov     = isDark ? '#fff' : '#0A0A0A'

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: MONO, position: 'relative', overflow: 'hidden', transition: 'background 300ms' }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* ── Blurred bg (always dark, atmospheric) ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        filter: `blur(7px) brightness(${isDark ? 0.28 : 0.65}) saturate(1.6)`,
        transform: 'scale(1.06)',
        transition: 'filter 500ms',
      }}>
        <ParticleCanvas />
      </div>

      {/* ── Scanlines (dark only) ── */}
      {isDark && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.09) 3px,rgba(0,0,0,0.09) 4px)',
        }} />
      )}

      {/* ── Vignette ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none',
        background: isDark
          ? 'radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.82) 100%)'
          : 'radial-gradient(ellipse at 50% 40%, rgba(240,239,232,0.3) 0%, rgba(240,239,232,0.75) 100%)',
        transition: 'background 500ms',
      }} />

      {/* ── Dot grid ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none', opacity: isDark ? 0.035 : 0.025,
        backgroundImage: `linear-gradient(${C.red} 1px,transparent 1px),linear-gradient(90deg,${C.red} 1px,transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      {/* ── Content ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px',
        gap: 0,
      }}>

        {/* Header */}
        <div ref={headerR} style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <a href="/" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 9, letterSpacing: '0.22em', color: txtMuted,
              textDecoration: 'none', transition: 'color 150ms',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.red }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = txtMuted }}
            >
              <ChevronLeft size={10} /> BACK TO LANDING
            </a>
            {/* Theme toggle */}
            <button
              onClick={toggle}
              style={{
                background: 'none', border: `1px solid ${C.redDim}`,
                color: txtMuted, cursor: 'pointer', padding: '3px 9px',
                display: 'flex', alignItems: 'center', gap: 5,
                fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em',
                transition: 'border-color 150ms, color 150ms', marginLeft: 8,
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.red; el.style.color = C.red }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.redDim; el.style.color = txtMuted }}
            >
              {isDark ? <Sun size={9} /> : <Moon size={9} />}
              {isDark ? 'LIGHT' : 'DARK'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 22, marginTop: 8 }}>
            <div style={{ width: 2, height: 24, background: C.red, boxShadow: `0 0 10px ${C.red}` }} />
            <Shield size={16} color={C.red} />
            <span style={{ fontSize: 13, letterSpacing: '0.3em', color: txtPrimary }}>
              SKYFALL<span style={{ color: C.red }}>_</span>CTI
            </span>
          </div>

          <p className="lp-neon" style={{ fontSize: 10, letterSpacing: '0.3em', color: C.red, marginBottom: 10 }}>
            EXPLORE THE PLATFORM
          </p>
          <h1 style={{
            fontSize: 'clamp(1.6rem, 4.5vw, 3rem)', fontWeight: 900,
            letterSpacing: '0.04em', color: txtPrimary, lineHeight: 1.1,
            margin: '0 0 10px',
          }}>
            CHOOSE YOUR<br />
            <span style={{ color: C.red }}>ENTRY POINT</span>
          </h1>
          <p className="lp-flicker" style={{ fontSize: 10, color: txtMuted, letterSpacing: '0.16em' }}>
            SNAPSHOT — 2026-05-28
          </p>
        </div>

        {/* ── Cards ── */}
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
                ref={i === 0 ? card0 : i === 1 ? card1 : card2}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className={opt.pulse}
                style={{
                  position: 'relative',
                  background: isHov ? cardBgHov(opt.color) : cardBg,
                  border: `1px solid ${opt.color}${isHov ? 'cc' : '55'}`,
                  transition: 'background 220ms, border-color 220ms',
                  cursor: 'pointer',
                }}
              >
                {/* Top bar */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: `linear-gradient(90deg, transparent, ${opt.color}, transparent)`,
                  opacity: isHov ? 1 : 0.5, transition: 'opacity 220ms',
                }} />

                <Brackets color={opt.color} size={10} />

                <Link href={opt.href} style={{ display: 'block', padding: '28px 26px', textDecoration: 'none' }}>

                  {/* Icon row */}
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

                  {/* Title */}
                  <h2 style={{
                    fontSize: 'clamp(1.15rem, 2.8vw, 1.55rem)',
                    fontWeight: 900, letterSpacing: '0.07em',
                    color: isHov ? titleHov : txtPrimary,
                    marginBottom: 12, lineHeight: 1.15,
                    transition: 'color 220ms',
                  }}>
                    {opt.label}
                  </h2>

                  {/* Desc */}
                  <p style={{
                    fontSize: 12, lineHeight: 1.8,
                    color: isHov ? txtBodyHov : txtBody,
                    marginBottom: 18, transition: 'color 220ms',
                  }}>
                    {opt.desc}
                  </p>

                  {/* Tags */}
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

                  {/* CTA */}
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
            { v: '5M+',     l: 'GRAPH NODES'    },
          ].map(({ v, l }) => (
            <span key={l} style={{ color: dimStats }}>
              <span style={{ color: `${C.red}80` }}>{v}</span>{'  '}{l}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
