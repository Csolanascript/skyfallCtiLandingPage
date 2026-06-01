'use client'
import { useState } from 'react'
import { Shield, ArrowLeft, AlertTriangle, Globe, Network, Bug, BarChart3, Database, Clock } from 'lucide-react'

// ── Snapshot data (captured 2026-05-28) ──────────────────────────────────────

const COUNTRY_ORIGINS = [
  { label: 'United States', value: 7391 },
  { label: 'China',         value: 4896 },
  { label: 'Germany',       value: 987  },
  { label: 'Singapore',     value: 905  },
  { label: 'United Kingdom',value: 784  },
  { label: 'Brazil',        value: 771  },
  { label: 'India',         value: 558  },
  { label: 'France',        value: 551  },
  { label: 'Japan',         value: 526  },
  { label: 'Portugal',      value: 488  },
]

const HOSTING_PROVIDERS = [
  { label: 'Alibaba US Technology',      value: 2079 },
  { label: 'Google LLC',                 value: 1878 },
  { label: 'Chinanet',                   value: 1691 },
  { label: 'Microsoft Corporation',      value: 1666 },
  { label: 'CHINA UNICOM China169',      value: 1383 },
  { label: 'UCLOUD HK LIMITED',          value: 1129 },
  { label: 'DigitalOcean, LLC',          value: 1117 },
  { label: 'ONYPHE SAS',                 value: 753  },
  { label: 'Akamai Connected Cloud',     value: 444  },
  { label: 'Amazon.com, Inc.',           value: 380  },
]

const INTRUSION_SETS = [
  { group: 'Sandworm Team',    campaigns: ['2016 Ukraine Electric Power Attack', '2015 Ukraine Electric Power Attack', '2022 Ukraine Electric Power Attack'], total: 3 },
  { group: 'APT41',            campaigns: ['APT41 DUST', 'C0017'], total: 2 },
  { group: 'APT29',            campaigns: ['SolarWinds Compromise', 'Operation Ghost'], total: 2 },
  { group: 'OilRig',           campaigns: ['Juicy Mix', 'Outer Space'], total: 2 },
  { group: 'Volt Typhoon',     campaigns: ['Versa Director Zero Day Exploitation', 'KV Botnet Activity'], total: 2 },
  { group: 'TEMP.Veles',       campaigns: ['C0032', 'Triton Safety Instrumented System Attack'], total: 2 },
  { group: 'Scattered Spider', campaigns: ['C0027'], total: 1 },
  { group: 'Mustang Panda',    campaigns: ['RedDelta Modified PlugX Infection Chain Operations'], total: 1 },
  { group: 'Lazarus Group',    campaigns: ['Operation Dream Job'], total: 1 },
  { group: 'UNC3886',          campaigns: ['RedPenguin'], total: 1 },
]

const CRITICAL_CVES = [
  { cve: 'CVE-2026-20127', cvss: 10, title: 'Cisco Catalyst SD-WAN Controller and Manager Authentication Bypass' },
  { cve: 'CVE-2026-22769', cvss: 10, title: 'Dell RecoverPoint Hard-coded Credentials' },
  { cve: 'CVE-2025-52691', cvss: 10, title: 'SmarterTools SmarterMail Unrestricted Upload of Dangerous File' },
  { cve: 'CVE-2025-37164', cvss: 10, title: 'HPE OneView Code Injection' },
  { cve: 'CVE-2025-20393', cvss: 10, title: 'Cisco Multiple Products Improper Input Validation' },
  { cve: 'CVE-2025-55182', cvss: 10, title: 'Meta React Server Components Remote Code Execution' },
  { cve: 'CVE-2025-54253', cvss: 10, title: 'Adobe Experience Manager Forms Code Execution' },
  { cve: 'CVE-2025-10035', cvss: 10, title: 'Fortra GoAnywhere MFT Deserialization of Untrusted Data' },
  { cve: 'CVE-2025-43300', cvss: 10, title: 'Apple iOS/iPadOS/macOS Out-of-Bounds Write' },
  { cve: 'CVE-2025-20281', cvss: 10, title: 'Cisco Identity Services Engine Injection' },
]

const MALWARE_PLATFORMS = [
  { label: 'Windows',          value: 553 },
  { label: 'Android',          value: 82  },
  { label: 'Linux',            value: 24  },
  { label: 'macOS',            value: 23  },
  { label: 'Network Devices',  value: 22  },
  { label: 'Linux + Windows',  value: 16  },
  { label: 'iOS',              value: 8   },
]

const NODE_TYPES = [
  { label: 'URL',        value: 594298 },
  { label: 'Indicator',  value: 326511 },
  { label: 'IP',         value: 48144  },
  { label: 'Note',       value: 6296   },
  { label: 'Domain',     value: 3045   },
  { label: 'CryptoWallet', value: 2784 },
  { label: 'Technique',  value: 1248   },
  { label: 'File',       value: 1072   },
  { label: 'Malware',    value: 831    },
  { label: 'Report',     value: 609    },
  { label: 'Vulnerability', value: 570 },
  { label: 'IntrusionSet',  value: 191 },
  { label: 'Campaign',   value: 101    },
]

// ── Components ────────────────────────────────────────────────────────────────

function BracketCorners({ color = '#E85419', size = 10 }: { color?: string; size?: number }) {
  const s = size
  return (
    <>
      <div style={{ position:'absolute', top:-1, left:-1, width:s, height:s, borderTop:`2px solid ${color}`, borderLeft:`2px solid ${color}` }} />
      <div style={{ position:'absolute', top:-1, right:-1, width:s, height:s, borderTop:`2px solid ${color}`, borderRight:`2px solid ${color}` }} />
      <div style={{ position:'absolute', bottom:-1, left:-1, width:s, height:s, borderBottom:`2px solid ${color}`, borderLeft:`2px solid ${color}` }} />
      <div style={{ position:'absolute', bottom:-1, right:-1, width:s, height:s, borderBottom:`2px solid ${color}`, borderRight:`2px solid ${color}` }} />
    </>
  )
}

function HudCard({ title, color = '#E85419', children }: { title: string; color?: string; children: React.ReactNode }) {
  return (
    <div className="relative p-5 flex flex-col gap-4" style={{ background: '#0D0D0D', border: '1px solid #1a1a1a' }}>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
      <BracketCorners color={color} />
      <p className="font-heading text-[10px] tracking-widest" style={{ color }}>{title}</p>
      {children}
    </div>
  )
}

function BarRow({ label, value, max, color = '#E85419' }: { label: string; value: number; max: number; color?: string }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="font-heading text-[10px] tracking-widest w-44 truncate flex-shrink-0" style={{ color: 'rgba(226,226,226,0.6)' }}>{label}</span>
      <div className="flex-1 h-1 bg-[#1a1a1a] rounded-none">
        <div className="h-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="font-heading text-xs w-16 text-right flex-shrink-0" style={{ color }}>{value.toLocaleString()}</span>
    </div>
  )
}

const TABS = [
  { id: 'geo',      label: 'IOC GEO',      icon: Globe         },
  { id: 'actors',   label: 'THREAT ACTORS',icon: Shield        },
  { id: 'cves',     label: 'CVEs',         icon: Bug           },
  { id: 'malware',  label: 'MALWARE',      icon: AlertTriangle },
  { id: 'graph',    label: 'GRAPH STATUS', icon: Database      },
] as const
type TabId = typeof TABS[number]['id']

// ── Tab panels ────────────────────────────────────────────────────────────────

function GeoTab() {
  const max = COUNTRY_ORIGINS[0].value
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <HudCard title="IOC GEOGRAPHIC ORIGINS — TOP 10">
        <div className="flex flex-col gap-3">
          {COUNTRY_ORIGINS.map(c => <BarRow key={c.label} label={c.label} value={c.value} max={max} />)}
        </div>
      </HudCard>
      <HudCard title="TOP HOSTING PROVIDERS" color="#22d3ee">
        <div className="flex flex-col gap-3">
          {HOSTING_PROVIDERS.map(h => <BarRow key={h.label} label={h.label} value={h.value} max={HOSTING_PROVIDERS[0].value} color="#22d3ee" />)}
        </div>
      </HudCard>
    </div>
  )
}

function ActorsTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {INTRUSION_SETS.map(a => (
        <div key={a.group} className="relative p-4 flex flex-col gap-2" style={{ background: '#0D0D0D', border: '1px solid #1a1a1a' }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'rgba(232,84,25,0.5)' }} />
          <BracketCorners />
          <div className="flex items-center justify-between">
            <span className="font-heading text-sm tracking-widest" style={{ color: '#E85419' }}>{a.group}</span>
            <span className="font-heading text-xs px-2 py-0.5" style={{ border: '1px solid rgba(232,84,25,0.3)', color: '#E85419' }}>
              {a.total} CAMPAIGN{a.total > 1 ? 'S' : ''}
            </span>
          </div>
          <div className="flex flex-col gap-1 mt-1">
            {a.campaigns.map(c => (
              <p key={c} className="font-heading text-[10px] tracking-wider leading-relaxed" style={{ color: 'rgba(226,226,226,0.45)' }}>
                ▸ {c}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function CvesTab() {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-12 gap-3 px-4 py-2 font-heading text-[9px] tracking-widest" style={{ color: '#4a4a4a', borderBottom: '1px solid #1a1a1a' }}>
        <span className="col-span-2">CVE ID</span>
        <span className="col-span-1 text-center">CVSS</span>
        <span className="col-span-9">TITLE</span>
      </div>
      {CRITICAL_CVES.map((cve, i) => (
        <div
          key={cve.cve}
          className="grid grid-cols-12 gap-3 items-center px-4 py-3 transition-colors duration-150"
          style={{ background: i % 2 === 0 ? '#0D0D0D' : 'transparent', border: '1px solid #1a1a1a' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,84,25,0.4)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1a1a1a' }}
        >
          <span className="col-span-2 font-heading text-[10px]" style={{ color: '#E85419' }}>{cve.cve}</span>
          <div className="col-span-1 flex justify-center">
            <span className="font-heading text-[10px] px-1.5 py-0.5" style={{ background: 'rgba(232,84,25,0.15)', color: '#E85419', border: '1px solid rgba(232,84,25,0.4)' }}>
              {cve.cvss}.0
            </span>
          </div>
          <span className="col-span-9 font-heading text-[11px] leading-relaxed" style={{ color: 'rgba(226,226,226,0.65)' }}>{cve.title}</span>
        </div>
      ))}
      <p className="font-heading text-[9px] tracking-widest mt-2 px-1" style={{ color: '#4a4a4a' }}>
        SHOWING TOP 10 CVSS:10.0 — 570 TOTAL CVEs IN DATABASE
      </p>
    </div>
  )
}

function MalwareTab() {
  const max = MALWARE_PLATFORMS[0].value
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <HudCard title="MALWARE TARGETED PLATFORMS" color="#a855f7">
        <div className="flex flex-col gap-3">
          {MALWARE_PLATFORMS.map(m => <BarRow key={m.label} label={m.label} value={m.value} max={max} color="#a855f7" />)}
        </div>
        <p className="font-heading text-[9px] tracking-widest mt-2" style={{ color: '#4a4a4a' }}>
          831 MALWARE FAMILIES TRACKED
        </p>
      </HudCard>
      <HudCard title="TOP THREAT ACTOR TOOLKITS" color="#FF8C00">
        <div className="flex flex-col gap-3">
          {[
            { actor: 'APT29',    tools: 34, sample: ['CozyCar', 'SUNBURST', 'Cobalt Strike', 'MiniDuke'] },
            { actor: 'APT28',    tools: 18, sample: ['X-Agent', 'Mimikatz', 'Empire', 'LoJax'] },
            { actor: 'Lazarus',  tools: 15, sample: ['BLINDINGCAN', 'HOPLIGHT', 'Duuzer'] },
            { actor: 'APT41',    tools: 12, sample: ['MESSAGETAP', 'Cobalt Strike', 'Mimikatz'] },
          ].map(a => (
            <div key={a.actor} className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="font-heading text-xs" style={{ color: '#FF8C00' }}>{a.actor}</span>
                <span className="font-heading text-[10px]" style={{ color: '#FF8C00' }}>{a.tools} tools</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {a.sample.map(t => (
                  <span key={t} className="font-heading text-[9px] px-1.5 py-0.5" style={{ border: '1px solid rgba(255,140,0,0.3)', color: 'rgba(255,140,0,0.7)' }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </HudCard>
    </div>
  )
}

function GraphTab() {
  const maxNode = NODE_TYPES[0].value
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <HudCard title="GRAPH NODE DISTRIBUTION" color="#22d3ee">
        <div className="flex flex-col gap-3">
          {NODE_TYPES.map(n => <BarRow key={n.label} label={n.label} value={n.value} max={maxNode} color="#22d3ee" />)}
        </div>
      </HudCard>
      <div className="flex flex-col gap-4">
        <HudCard title="RELATIONSHIP TYPES" color="#a855f7">
          <div className="flex flex-col gap-3">
            {[
              { label: 'INDICATES',    value: 649619 },
              { label: 'CREATED_BY',   value: 625398 },
              { label: 'HAS_MARKING',  value: 620986 },
              { label: 'REFERENCES',   value: 20273  },
              { label: 'USES',         value: 19503  },
            ].map(r => <BarRow key={r.label} label={r.label} value={r.value} max={649619} color="#a855f7" />)}
          </div>
        </HudCard>
        <HudCard title="INGESTION SOURCE" color="#FF8C00">
          <div className="flex flex-col gap-3">
            {[
              { label: 'Disk (STIX files)',  value: 969341 },
              { label: 'Kafka (live stream)', value: 16067  },
            ].map(r => <BarRow key={r.label} label={r.label} value={r.value} max={969341} color="#FF8C00" />)}
          </div>
          <div className="grid grid-cols-3 gap-3 pt-3" style={{ borderTop: '1px solid #1a1a1a' }}>
            {[
              { v: '5M+',    l: 'TOTAL NODES' },
              { v: '1.9M+',  l: 'RELATIONSHIPS' },
              { v: '14ms',   l: 'AVG QUERY' },
            ].map(({ v, l }) => (
              <div key={l} className="text-center">
                <p className="font-heading text-lg" style={{ color: '#FF8C00' }}>{v}</p>
                <p className="font-heading text-[9px] tracking-widest mt-0.5" style={{ color: '#4a4a4a' }}>{l}</p>
              </div>
            ))}
          </div>
        </HudCard>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('geo')

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
                // INTELLIGENCE_DASHBOARD
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock size={10} style={{ color: '#4a4a4a' }} />
            <span className="font-heading text-[10px] tracking-widest px-3 py-1" style={{ border: '1px solid rgba(255,140,0,0.4)', color: '#FF8C00' }}>
              SNAPSHOT — 2026-05-28
            </span>
            <a href="/explore" className="font-heading text-[10px] tracking-widest px-3 py-1 transition-colors duration-200" style={{ border: '1px solid rgba(232,84,25,0.4)', color: '#E85419' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(232,84,25,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              IOC EXPLORER →
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
          <span style={{ color: 'rgba(226,226,226,0.4)' }}>Data captured on 2026-05-28. Not real-time. Connect Skyfall CTI backend for live intelligence.</span>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          {[
            { v: '326,511', l: 'IOC INDICATORS',  color: '#E85419' },
            { v: '101',     l: 'CAMPAIGNS',        color: '#E85419' },
            { v: '570',     l: 'CVEs',             color: '#FF8C00' },
            { v: '831',     l: 'MALWARE FAMILIES', color: '#a855f7' },
            { v: '191',     l: 'THREAT ACTORS',    color: '#22d3ee' },
            { v: '5M+',     l: 'GRAPH NODES',      color: '#22d3ee' },
            { v: '40',      l: 'ATK VECTORS',      color: '#E85419' },
          ].map(({ v, l, color }) => (
            <div key={l} className="relative p-3 text-center" style={{ background: '#0D0D0D', border: '1px solid #1a1a1a' }}>
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
              <p className="font-heading text-xl leading-none" style={{ color }}>{v}</p>
              <p className="font-heading text-[9px] tracking-widest mt-1.5" style={{ color: '#4a4a4a' }}>{l}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-0 mb-6" style={{ borderBottom: '1px solid #1a1a1a' }}>
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-2 px-5 py-3 font-heading text-[10px] tracking-widest transition-all duration-200 cursor-pointer"
                style={{
                  color:        active ? '#E85419' : '#4a4a4a',
                  borderBottom: active ? '2px solid #E85419' : '2px solid transparent',
                  background:   active ? 'rgba(232,84,25,0.05)' : 'transparent',
                  marginBottom: '-1px',
                }}
              >
                <Icon size={11} />
                {label}
              </button>
            )
          })}
        </div>

        {/* Tab panels */}
        {activeTab === 'geo'    && <GeoTab    />}
        {activeTab === 'actors' && <ActorsTab />}
        {activeTab === 'cves'   && <CvesTab   />}
        {activeTab === 'malware'&& <MalwareTab/>}
        {activeTab === 'graph'  && <GraphTab  />}

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
