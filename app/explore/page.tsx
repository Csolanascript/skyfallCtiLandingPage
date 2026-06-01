'use client'
import { useState } from 'react'
import { Shield, ArrowLeft, Clock, AlertTriangle, Search } from 'lucide-react'

// ── Snapshot data (captured 2026-05-28) ──────────────────────────────────────

const STATS = {
  total_iocs:       326511,
  malicious:        418,
  high_confidence:  499,
  recent_24h:       0,
}

const IOC_FEED = [
  { ip: '34.62.196.33',   confidence: 100, decay: 90, vt: 7,  abuse: 172,  types: ['brute-force','malicious-activity','spam','compromised'] },
  { ip: '36.253.9.69',    confidence: 100, decay: 90, vt: 15, abuse: 413,  types: ['social-engineering','malicious-activity','brute-force'] },
  { ip: '104.199.19.60',  confidence: 100, decay: 90, vt: 4,  abuse: 168,  types: ['brute-force','malicious-activity','network-traffic'] },
  { ip: '45.15.226.44',   confidence: 100, decay: 90, vt: 8,  abuse: 1668, types: ['social-engineering','malicious-activity','brute-force','spam'] },
  { ip: '27.79.41.136',   confidence: 100, decay: 90, vt: 16, abuse: 1137, types: ['brute-force','unauthorized-access','malicious-activity'] },
  { ip: '27.79.43.239',   confidence: 100, decay: 90, vt: 14, abuse: 1151, types: ['brute-force','malicious-activity','compromised'] },
  { ip: '34.38.29.170',   confidence: 100, decay: 90, vt: 6,  abuse: 136,  types: ['social-engineering','malicious-activity','brute-force','spam'] },
  { ip: '46.101.94.59',   confidence: 100, decay: 90, vt: 6,  abuse: 69,   types: ['brute-force','malicious-activity','compromised'] },
  { ip: '77.83.39.211',   confidence: 85,  decay: 72, vt: 3,  abuse: 44,   types: ['malicious-activity','network-traffic'] },
  { ip: '193.42.11.108',  confidence: 85,  decay: 72, vt: 5,  abuse: 91,   types: ['malicious-activity','brute-force'] },
  { ip: '137.220.224.67', confidence: 82,  decay: 68, vt: 4,  abuse: 62,   types: ['unauthorized-access','network-traffic'] },
  { ip: '148.178.16.48',  confidence: 80,  decay: 65, vt: 2,  abuse: 33,   types: ['brute-force','network-traffic'] },
  { ip: '154.86.0.33',    confidence: 78,  decay: 60, vt: 3,  abuse: 27,   types: ['malicious-activity','spam'] },
  { ip: '207.56.1.93',    confidence: 75,  decay: 58, vt: 2,  abuse: 19,   types: ['brute-force','unauthorized-access'] },
  { ip: '159.203.120.106',confidence: 72,  decay: 55, vt: 5,  abuse: 88,   types: ['malicious-activity','network-traffic'] },
]

const CAMPAIGNS = [
  { name: 'Malicious PyPI Package - LiteLLM Supply Chain Compromise',                  tag: 'SUPPLY CHAIN' },
  { name: 'Supply Chain Attack: Malicious PyPI Packages',                               tag: 'SUPPLY CHAIN' },
  { name: 'ClickFix Campaigns Targeting Windows and macOS',                             tag: 'SOCIAL ENG' },
  { name: 'Malicious OpenClaw Skills Used to Distribute Atomic MacOS Stealer',          tag: 'STEALER' },
  { name: '59 Victims, Zero Authentication: ClickFix Campaign Force-Installs Chrome Extension Banking Stealer', tag: 'BANKING' },
  { name: '108 Chrome Extensions Linked to Data Exfiltration via Shared C2',            tag: 'C2' },
  { name: 'Device Code Phishing is an Evolution in Identity Takeover',                  tag: 'PHISHING' },
  { name: 'Disclosing new PebbleDash-based tools',                                      tag: 'APT' },
]

const TAG_COLORS: Record<string, string> = {
  'SUPPLY CHAIN': '#FF8C00',
  'SOCIAL ENG':   '#E85419',
  'STEALER':      '#a855f7',
  'BANKING':      '#E85419',
  'C2':           '#22d3ee',
  'PHISHING':     '#FF8C00',
  'APT':          '#E85419',
}

function confColor(c: number) {
  if (c >= 95) return '#E85419'
  if (c >= 80) return '#FF8C00'
  return '#FFD700'
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const [search, setSearch] = useState('')

  const filtered = IOC_FEED.filter(ioc =>
    search === '' || ioc.ip.includes(search) || ioc.types.some(t => t.includes(search.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-black text-[#E2E2E2]" style={{
      backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(232,84,25,0.03) 39px,rgba(232,84,25,0.03) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(232,84,25,0.03) 39px,rgba(232,84,25,0.03) 40px)',
    }}>
      {/* Scanlines */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:9998,
        background:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.07) 3px,rgba(0,0,0,0.07) 4px)' }} />

      {/* Top nav */}
      <nav className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 font-heading text-[10px] tracking-widest transition-colors duration-200 hover:opacity-70" style={{ color: '#4a4a4a' }}>
              <ArrowLeft size={12} style={{ color: '#E85419' }} /> BACK TO LANDING
            </a>
            <div className="w-px h-4" style={{ background: '#1a1a1a' }} />
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-5 bg-[#E85419]" />
              <Shield size={14} style={{ color: '#E85419' }} />
              <span className="font-heading text-sm tracking-widest text-white">
                SKYFALL<span style={{ color: '#E85419' }}>_</span>CTI
              </span>
              <span className="font-heading text-[9px] tracking-widest hidden sm:block" style={{ color: '#4a4a4a' }}>
                // IOC_EXPLORER
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock size={10} style={{ color: '#4a4a4a' }} />
            <span className="font-heading text-[10px] tracking-widest px-3 py-1" style={{ border: '1px solid rgba(255,140,0,0.4)', color: '#FF8C00' }}>
              SNAPSHOT — 2026-05-28
            </span>
            <a href="/dashboard" className="font-heading text-[10px] tracking-widest px-3 py-1 transition-colors duration-200" style={{ border: '1px solid rgba(232,84,25,0.4)', color: '#E85419' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(232,84,25,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              DASHBOARD →
            </a>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, #E85419, transparent)' }} />
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Snapshot banner */}
        <div className="flex items-center gap-3 mb-8 px-4 py-2 font-heading text-[10px] tracking-widest" style={{ border: '1px solid rgba(255,140,0,0.2)', background: 'rgba(255,140,0,0.04)' }}>
          <span style={{ color: '#FF8C00' }}>⚠ STATIC SNAPSHOT</span>
          <span style={{ color: '#4a4a4a' }}>—</span>
          <span style={{ color: 'rgba(226,226,226,0.4)' }}>Data captured on 2026-05-28. Search is local only. Connect Skyfall CTI backend for full live explorer.</span>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { v: STATS.total_iocs.toLocaleString(), l: 'TOTAL IOC INDICATORS', color: '#E85419' },
            { v: STATS.malicious.toLocaleString(),      l: 'CONFIRMED MALICIOUS',   color: '#E85419' },
            { v: STATS.high_confidence.toLocaleString(),l: 'HIGH CONFIDENCE',        color: '#FF8C00' },
            { v: '15',                                  l: 'SHOWN IN FEED',          color: '#22d3ee' },
          ].map(({ v, l, color }) => (
            <div key={l} className="relative p-4 text-center" style={{ background: '#0D0D0D', border: '1px solid #1a1a1a' }}>
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
              <p className="font-heading text-2xl leading-none" style={{ color }}>{v}</p>
              <p className="font-heading text-[9px] tracking-widest mt-2" style={{ color: '#4a4a4a' }}>{l}</p>
            </div>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={12} style={{ color: '#4a4a4a' }} />
          </div>
          <input
            type="text"
            placeholder="FILTER BY IP OR INDICATOR TYPE..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0D0D0D] font-heading text-[11px] tracking-widest pl-10 pr-4 py-3 outline-none transition-colors duration-200"
            style={{
              border: '1px solid #1a1a1a',
              color: '#E2E2E2',
              caretColor: '#E85419',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(232,84,25,0.5)' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#1a1a1a' }}
          />
        </div>

        {/* IOC Feed table */}
        <div className="mb-10" style={{ border: '1px solid #1a1a1a' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ background: '#0D0D0D', borderBottom: '1px solid #1a1a1a' }}>
            <span className="font-heading text-[10px] tracking-widest" style={{ color: '#E85419' }}>
              IOC THREAT FEED — TOP CONFIDENCE INDICATORS
            </span>
            <span className="font-heading text-[9px]" style={{ color: '#4a4a4a' }}>
              {filtered.length} / {IOC_FEED.length} RECORDS
            </span>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 font-heading text-[9px] tracking-widest" style={{ color: '#4a4a4a', borderBottom: '1px solid #1a1a1a' }}>
            <span className="col-span-3">IP ADDRESS</span>
            <span className="col-span-1 text-center">CONF</span>
            <span className="col-span-1 text-center">DECAY</span>
            <span className="col-span-1 text-center">VT</span>
            <span className="col-span-1 text-center">ABUSE</span>
            <span className="col-span-5">INDICATOR TYPES</span>
          </div>

          {/* Rows */}
          {filtered.map((ioc, i) => (
            <div
              key={ioc.ip}
              className="grid grid-cols-12 gap-2 items-center px-4 py-3 transition-colors duration-150"
              style={{ borderBottom: '1px solid #1a1a1a', background: i % 2 === 0 ? '#0D0D0D' : 'transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(232,84,25,0.04)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? '#0D0D0D' : 'transparent' }}
            >
              <span className="col-span-3 font-heading text-xs" style={{ color: '#E2E2E2' }}>{ioc.ip}</span>
              <div className="col-span-1 flex justify-center">
                <span className="font-heading text-[10px] px-1.5 py-0.5" style={{
                  background: `${confColor(ioc.confidence)}18`,
                  border: `1px solid ${confColor(ioc.confidence)}40`,
                  color: confColor(ioc.confidence),
                }}>
                  {ioc.confidence}
                </span>
              </div>
              <span className="col-span-1 font-heading text-[10px] text-center" style={{ color: '#4a4a4a' }}>{ioc.decay}</span>
              <span className="col-span-1 font-heading text-[10px] text-center" style={{ color: ioc.vt >= 10 ? '#E85419' : '#FF8C00' }}>{ioc.vt}</span>
              <span className="col-span-1 font-heading text-[10px] text-center" style={{ color: ioc.abuse > 500 ? '#E85419' : '#FF8C00' }}>{ioc.abuse.toLocaleString()}</span>
              <div className="col-span-5 flex flex-wrap gap-1">
                {ioc.types.slice(0, 3).map(t => (
                  <span key={t} className="font-heading text-[9px] px-1.5 py-0.5" style={{ border: '1px solid rgba(232,84,25,0.25)', color: 'rgba(232,84,25,0.7)' }}>
                    {t}
                  </span>
                ))}
                {ioc.types.length > 3 && (
                  <span className="font-heading text-[9px] px-1.5 py-0.5" style={{ color: '#4a4a4a' }}>+{ioc.types.length - 3}</span>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center font-heading text-[11px] tracking-widest" style={{ color: '#4a4a4a' }}>
              NO RESULTS FOR &quot;{search}&quot;
            </div>
          )}
        </div>

        {/* Recent campaigns */}
        <div style={{ border: '1px solid #1a1a1a' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ background: '#0D0D0D', borderBottom: '1px solid #1a1a1a' }}>
            <span className="font-heading text-[10px] tracking-widest" style={{ color: '#a855f7' }}>
              RECENT CAMPAIGNS INTELLIGENCE
            </span>
            <span className="font-heading text-[9px]" style={{ color: '#4a4a4a' }}>
              101 TOTAL IN DATABASE
            </span>
          </div>
          {CAMPAIGNS.map((c, i) => (
            <div
              key={c.name}
              className="flex items-center gap-4 px-4 py-3 transition-colors duration-150"
              style={{ borderBottom: i < CAMPAIGNS.length - 1 ? '1px solid #1a1a1a' : undefined }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.04)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span className="font-heading text-[10px] w-24 flex-shrink-0 text-center px-1.5 py-0.5" style={{
                background: `${TAG_COLORS[c.tag]}15`,
                border: `1px solid ${TAG_COLORS[c.tag]}40`,
                color: TAG_COLORS[c.tag],
              }}>
                {c.tag}
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle size={10} style={{ color: '#a855f7', flexShrink: 0 }} />
                <p className="font-heading text-[11px] tracking-wide leading-relaxed truncate" style={{ color: 'rgba(226,226,226,0.7)' }}>
                  {c.name}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Footer */}
      <div className="mt-16" style={{ borderTop: '1px solid #1a1a1a' }}>
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-0.5 h-5 bg-[#E85419]" />
            <Shield size={14} style={{ color: '#E85419' }} />
            <span className="font-heading text-[11px] tracking-widest" style={{ color: '#E2E2E2' }}>
              SKYFALL<span style={{ color: '#E85419' }}>_</span>CTI
            </span>
            <span className="font-heading text-[10px] ml-2" style={{ color: '#4a4a4a' }}>
              © 2026 — SNAPSHOT VIEW — NOT REAL-TIME DATA
            </span>
          </div>
          <a href="/" className="font-heading text-[10px] tracking-widest transition-colors duration-200" style={{ color: '#4a4a4a' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#E85419' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#4a4a4a' }}>
            ← BACK TO LANDING
          </a>
        </div>
      </div>
    </div>
  )
}
