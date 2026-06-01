'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState } from 'react'
import {
  Activity, AlertTriangle, BarChart3, CheckCircle2, Clock3, Copy,
  Database, Download, ExternalLink, FileText, Gauge, Globe,
  Link2, MapPinned, Radar, ScanSearch, ShieldCheck, Sparkles,
  Sun, Moon, Target, Waypoints,
} from 'lucide-react'
import styles from '@/components/intelowl/ObservableAnalyzerPage.module.css'

const IOCGlobeMap = dynamic(
  () => import('@/components/intelowl/IOCGlobeMap'),
  { ssr: false }
)

/* ─── Static data for 34.62.196.33 ───────────────────────── */
const OBS = '34.62.196.33'
const TLP = 'CLEAR'
const JOB_ID = 9201
const PLAYBOOK = 'SkyfallCTIipReputation'
const STATUS = 'reported_with_fails'
const PROCESS_TIME = 3.99
const RISK_SCORE = 100
const RISK_LEVEL: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH'
const STIX_COUNT = 59
const INDICATOR_ID = 'indicator--ed70e0e1-3d93-5d5b-8622-294a4809e799'
const BUNDLE_ID    = 'bundle--097c72c4-cf2e-4e46-931a-a97a6425e697'
const VT_MALICIOUS = 9
const VT_TOTAL     = 91
const ABUSE_SCORE  = 100
const ABUSE_REPORTS = 185
const ABUSE_USERS   = 131
const CONFIDENCE    = 97
const LAT = 50.9009
const LNG = 4.4855
const COUNTRY = 'BE'
const CITY    = 'Brussels'
const REGION  = 'Brussels Capital'
const TZ      = 'Europe/Brussels'
const ISP     = 'Google LLC'
const ASN     = 396982
const NETWORK = '34.32.0.0/11'
const DOMAIN  = 'google.com'
const USAGE   = 'Data Center/Web Hosting/Transit'

const RISK_REASONS = [
  'VirusTotal: 9 engines flagged as malicious (high).',
  'AbuseIPDB confidence score 100/100 contributes 30 risk points.',
  'CrowdSec detected 1 behaviour pattern(s): SSH Bruteforce.',
  'Indicator confidence 97/100 adds 10 risk points.',
  '185 independent abuse report(s) contribute 10 risk points.',
  '9 intelligence engine(s) returned a malicious conclusion.',
  '3 intelligence engine(s) returned a suspicious conclusion.',
]

const ABUSE_CATS = [
  { name: 'Brute Force', count: 93 },
  { name: 'SSH',         count: 91 },
  { name: 'Port Scan',   count: 12 },
  { name: 'Hacking',     count: 6  },
  { name: 'Web App Attack', count: 4 },
  { name: 'Exploited Host', count: 1 },
  { name: 'Web Spam',    count: 1  },
]

const BEHAVIORS = ['SSH Bruteforce']

const TARGETS = [
  { country: 'DE', value: 43, percent: 45.3 },
  { country: 'FR', value: 19, percent: 20.0 },
  { country: 'US', value: 14, percent: 14.7 },
  { country: 'RU', value: 5,  percent: 5.3  },
  { country: 'CA', value: 3,  percent: 3.2  },
  { country: 'FI', value: 3,  percent: 3.2  },
  { country: 'GB', value: 3,  percent: 3.2  },
  { country: 'CH', value: 2,  percent: 2.1  },
  { country: 'NL', value: 2,  percent: 2.1  },
  { country: 'AT', value: 1,  percent: 1.1  },
]

const MITRE = ['T1589', 'T1110', 'T1021.004', 'T1595', 'T1566', 'T1595.001', 'T1210', 'T1190']

const LINKS = [
  { label: 'AbuseIPDB Intelligence',  href: 'https://www.abuseipdb.com/check/34.62.196.33',           source: 'AbuseIPDB'  },
  { label: 'VirusTotal Intelligence', href: 'https://www.virustotal.com/gui/ip-address/34.62.196.33',  source: 'VirusTotal' },
  { label: 'CrowdSec CTI',            href: 'https://app.crowdsec.net/cti/34.62.196.33',               source: 'CrowdSec'   },
]

const VT_MAL_ENGINES = ['CRDF','VIPRE','Lionic','Fortinet','Cluster25','GreyNoise','MalwareURL','ADMINUSLabs','EmergingThreats']
const VT_SUS_ENGINES = ['AlphaSOC','Gridinsoft','alphaMountain.ai']

const CROWDSEC_SCORES = { total: 4, trust: 5, threat: 4, aggressiveness: 4, anomaly: 0 }
const CROWDSEC_BLOCKLISTS = ['Targeted Country: Germany', 'CrowdSec Intelligence Blocklist', 'Bruteforce Attackers']

const ATTACK_PATTERNS = [
  { id: 'T1589',     name: 'Gather Victim Identity Information', description: 'Adversaries may gather information about the victim\'s identity that can be used during targeting.', source: 'Crowdsec' },
  { id: 'T1110',     name: 'Brute Force',                        description: 'Adversaries may use brute force techniques to gain access to accounts when passwords are unknown or when password hashes are obtained.', source: 'Crowdsec' },
  { id: 'T1021.004', name: 'SSH',                                description: null, source: 'AbuseIPDB' },
  { id: 'T1595',     name: 'Hacking',                            description: null, source: 'AbuseIPDB' },
  { id: 'T1566',     name: 'Web Spam',                           description: null, source: 'AbuseIPDB' },
  { id: 'T1595.001', name: 'Port Scan',                          description: null, source: 'AbuseIPDB' },
  { id: 'T1210',     name: 'Exploited Host',                     description: null, source: 'AbuseIPDB' },
  { id: 'T1190',     name: 'Web App Attack',                     description: null, source: 'AbuseIPDB' },
]

const INFRA_NODES = [
  { id: 'infra-1', name: 'Google LLC', description: 'ISP/Hosting: Data Center/Web Hosting/Transit', asn: ASN, network: NETWORK, source: 'AbuseIPDB' },
  { id: 'infra-2', name: `AS${ASN} – Google LLC`, description: `ASN: ${ASN} | Owner: Google LLC | Network: ${NETWORK} | RDAP: GOOGL-2 | RIR: RIPE NCC`, asn: ASN, network: NETWORK, source: 'VirusTotal' },
]

const STIX_SIGHTINGS = [
  {
    id: 'sighting-crowdsec',
    source: 'Crowdsec',
    description: 'Crowdsec: reputation=malicious, overall score=4/5, aggressiveness=4/5, threat=4/5. Behaviors: SSH Bruteforce. Active for 21 days.',
    firstSeen: '2026-05-11T04:00:00.000Z',
    lastSeen:  '2026-05-31T23:00:00.000Z',
    count: 4,
    reputation: 'malicious' as const,
    scores: CROWDSEC_SCORES,
    behaviors: ['ssh:bruteforce'],
    vtMaliciousCount: 0,
    vtSuspiciousCount: 0,
  },
  {
    id: 'sighting-abuse',
    source: 'AbuseIPDB',
    description: 'AbuseIPDB: 185 reports de 131 usuarios distintos. Confidence score: 100/100.',
    firstSeen: '2026-05-11T07:12:10.000Z',
    lastSeen:  '2026-05-24T00:37:52.000Z',
    count: 185,
    reputation: null,
    scores: null,
    behaviors: [],
    vtMaliciousCount: 0,
    vtSuspiciousCount: 0,
  },
  {
    id: 'sighting-vt',
    source: 'VirusTotal',
    description: 'VirusTotal: 9/91 engines detected malicous, 3 suspicious. Engines malicious: CRDF, VIPRE, Lionic, Fortinet, Cluster25, GreyNoise, MalwareURL, ADMINUSLabs, EmergingThreats.',
    firstSeen: null,
    lastSeen:  '2026-05-30T01:39:10.000Z',
    count: 12,
    reputation: null,
    scores: null,
    behaviors: [],
    vtMaliciousCount: 9,
    vtSuspiciousCount: 3,
  },
]

const STIX_NOTES = [
  { id: 'note-1', abstract: 'Crowdsec: IP attacks 10 countries, top: DE (43 reporters)', content: '**Crowdsec Geographic Attack Distribution**\n- Total reporters: 95 · Countries attacked: 10\n\nDE: 43 (45.3%) | FR: 19 (20%) | US: 14 (14.7%) | RU: 5 (5.3%) | CA: 3 (3.2%) | FI: 3 (3.2%) | GB: 3 (3.2%) | CH: 2 (2.1%) | NL: 2 (2.1%) | AT: 1 (1.1%)', source: 'CROWDSEC' },
  { id: 'note-2', abstract: 'Crowdsec: malicious, score 4/5, 1 behaviors, 9 attack scenarios', content: '**Reputation:** malicious · **Score:** 4/5 (aggr=4, threat=4, trust=5, anomaly=0)\n**Active since:** 2026-05-11 (21 days)\n**Behaviors:** SSH Bruteforce\n**Scenarios:** SSH User Enumeration · SSH Bad Key Bruteforce · SSH Slow User Enumeration · SSH Bruteforce · Endlessh Bruteforce · SSH Time-Based Bruteforce · SSH Slow Bruteforce', source: 'CROWDSEC' },
  { id: 'note-3', abstract: 'AbuseIPDB Reporter Comments Summary', content: '- CrowdSec ban for AbuseIPDB Top List\n- Jarvis auto-ban: blocklist:et-compromised\n- 34.62.196.33 fell into Endlessh tarpit; 0/32 connections. Time wasted: 3m 16s. 22.00KiB sent.\n- SSH brute force on kuhioshores', source: 'ABUSEIPDB' },
  { id: 'note-4', abstract: 'VirusTotal: 9 malicious, 3 suspicious', content: '**Malicious:** ADMINUSLabs, CRDF, Cluster25, EmergingThreats, Fortinet, GreyNoise, Lionic, MalwareURL, VIPRE\n**Suspicious:** AlphaSOC, Gridinsoft, alphaMountain.ai', source: 'VIRUSTOTAL' },
  { id: 'note-5', abstract: 'Crowdsec: IP in 3 blocklists', content: '**Targeted Country: Germany**: Most aggressive IPs targeting Germany.\n**CrowdSec Intelligence Blocklist**: Core anti-bot, mass attack list.\n**Bruteforce Attackers**: IPs reported for Bruteforce.', source: 'CROWDSEC' },
]

const ANALYZERS = [
  { name: 'AbuseIPDB',                       ms: 0.470,  status: 'SUCCESS', id: 115364 },
  { name: 'Crowdsec',                        ms: 0.400,  status: 'SUCCESS', id: 115366 },
  { name: 'FireHol_IPList',                  ms: 0.080,  status: 'SUCCESS', id: 115367 },
  { name: 'InQuest_REPdb',                   ms: 1.000,  status: 'SUCCESS', id: 115369 },
  { name: 'IPApi',                           ms: 0.520,  status: 'SUCCESS', id: 115368 },
  { name: 'MalwareBazaar_Google_Observable', ms: 3.160,  status: 'SUCCESS', id: 115370 },
  { name: 'TalosReputation',                 ms: 0.030,  status: 'SUCCESS', id: 115372 },
  { name: 'ThreatFox',                       ms: 0.300,  status: 'SUCCESS', id: 115373 },
  { name: 'TorProject',                      ms: 0.020,  status: 'SUCCESS', id: 115374 },
  { name: 'URLhaus',                         ms: 0.320,  status: 'SUCCESS', id: 115375 },
  { name: 'UrlScan_Search',                  ms: 1.040,  status: 'SUCCESS', id: 115376 },
  { name: 'VirusTotal_v3_Get_Observable',    ms: 0.940,  status: 'SUCCESS', id: 115377 },
  { name: 'GoogleSafeBrowsing',              ms: null,   status: 'FAILED',  id: 115378 },
  { name: 'Shodan_Honeyscore',               ms: null,   status: 'FAILED',  id: 115379 },
]

const LOCAL_NODES = [
  { labels: 'PUBLIC, INDICATOR, KAFKA',      props: 'x_abuseipdb_domain: google.com · x_crowdsec_as_name: Google LLC',    edges: 4  },
  { labels: 'IP, KAFKA, PUBLIC',             props: `spec_version: 2.1 · name: ${OBS} · x_public: true`,                  edges: 52 },
  { labels: 'LOCATION',                      props: `country: ${COUNTRY} · name: ${COUNTRY} · type: location`,            edges: 1  },
  { labels: 'PUBLIC, KAFKA, INFRASTRUCTURE', props: 'description: ISP/Hosting: Data Center/Web Hosting/Transit',           edges: 4  },
  { labels: 'LOCATION, PUBLIC, KAFKA',       props: `country: ${COUNTRY} · name: Belgium`,                                edges: 1  },
  { labels: 'LOCATION, PUBLIC, KAFKA',       props: `country: ${COUNTRY} · latitude: 50.8534`,                            edges: 1  },
  { labels: 'PUBLIC, KAFKA, INFRASTRUCTURE', props: `x_network: ${NETWORK} · description: ASN: ${ASN} | Owner: ${ISP}`,  edges: 2  },
  { labels: 'PUBLIC, KAFKA, REPORT',         props: `description: Skyfall-CTI enrichment report for IP ${OBS}. Confidence: 97/100.`, edges: 1 },
]

/* ─── Helpers ─────────────────────────────────────────────── */
function fmtSec(s: number | null): string {
  if (s === null) return '—'
  return s < 1 ? `${Math.round(s * 1000)} ms` : `${s.toFixed(s >= 10 ? 1 : 2)} s`
}
function fmtDt(iso: string | null): string {
  if (!iso) return 'n/a'
  return new Date(iso).toLocaleString()
}
function pct(n: number): string {
  return `${n >= 10 ? n.toFixed(0) : n.toFixed(1)}%`
}
function normalizeStatus(s: string): 'success' | 'failed' | 'other' {
  const u = s.toUpperCase()
  if (u.includes('SUCCESS') || u.includes('REPORTED')) return 'success'
  if (u.includes('FAIL') || u.includes('ERROR')) return 'failed'
  return 'other'
}
function statusBadgeClass(s: string): string {
  const n = normalizeStatus(s)
  if (n === 'success') return `${styles.statusBadge} ${styles.statusSuccess}`
  if (n === 'failed')  return `${styles.statusBadge} ${styles.statusFailed}`
  return `${styles.statusBadge} ${styles.statusOther}`
}

/* ─── PDF export — identical logic to ObservableAnalyzerPage ─ */
function exportPdfReport(): void {
  const now = new Date().toLocaleString()
  const lvlColor = '#c0392b'
  const analyzerRows = ANALYZERS
    .filter(a => normalizeStatus(a.status) !== 'failed')
    .map(a => {
      const dur = a.ms !== null ? (a.ms < 1 ? `${Math.round(a.ms * 1000)}ms` : `${a.ms.toFixed(2)}s`) : 'n/a'
      return `<tr><td>${a.name}</td><td style="color:#27ae60;font-weight:700">YES</td><td>${dur}</td></tr>`
    }).join('')

  const pdfTitle = `Skyfall_CTI_34.62.196.33_${new Date().toISOString().slice(0, 10)}`
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>${pdfTitle}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Helvetica,Arial,sans-serif;background:#fff;color:#1c2333;font-size:10.5pt;line-height:1.6;padding:2.2cm 2cm}
  .cover{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #0a2342;padding-bottom:0.9em;margin-bottom:1.5em}
  .cover-left{display:flex;flex-direction:column;gap:0.2em}
  .report-title{font-size:17pt;font-weight:700;color:#0a2342}
  .report-sub{font-size:8.5pt;color:#55657a}
  .cover-right{display:flex;flex-direction:column;align-items:flex-end;gap:0.5em}
  .cover-right img{height:38px;object-fit:contain}
  .cover-meta{font-size:8pt;color:#55657a;text-align:right;line-height:1.5}
  .obs-banner{background:#f0f4fa;border-left:4px solid #0a2342;padding:0.55em 0.9em;margin-bottom:1.5em;border-radius:0 3px 3px 0}
  .obs-label{display:block;font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#55657a;margin-bottom:0.15em}
  .obs-val{font-family:'Courier New',monospace;font-size:10pt;color:#0a2342;font-weight:600}
  .pdf-section{margin-bottom:1.7em;page-break-inside:avoid}
  .sec-hd{display:flex;align-items:center;gap:0.5em;border-bottom:1.5px solid #dce4f0;padding-bottom:0.35em;margin-bottom:0.85em}
  .sec-num{font-size:8pt;font-weight:700;color:#fff;background:#0a2342;border-radius:50%;width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
  .sec-title{font-size:12pt;font-weight:700;color:#0a2342}
  .risk-row{display:flex;align-items:center;gap:1.4em;margin-bottom:0.6em}
  .risk-score{font-size:30pt;font-weight:800;color:${lvlColor};line-height:1}
  .risk-denom{font-size:13pt;font-weight:400;color:#7a8a9a}
  .risk-level{display:inline-block;padding:2px 9px;border-radius:2px;font-size:8.5pt;font-weight:700;background:${lvlColor}22;color:${lvlColor};margin-bottom:0.3em}
  .risk-stats{color:#444;font-size:9.5pt}
  .risk-bar-bg{width:100%;height:7px;background:#e6ecf5;margin-bottom:0.75em}
  .risk-bar-fg{height:100%;background:${lvlColor}}
  .risk-reasons{padding-left:1.1em;font-size:9.5pt;color:#2c3e50}
  .risk-reasons li{margin-bottom:0.15em}
  .kv-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0.5em 1em;margin-bottom:0.5em}
  .kv-item{background:#f7f9fc;padding:0.35em 0.6em;border-radius:2px}
  .kv-label{display:block;font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:#55657a;margin-bottom:0.1em}
  .kv-val{font-size:9.5pt;color:#1c2333;font-weight:500}
  table{width:100%;border-collapse:collapse;font-size:9.5pt;margin-top:0.2em}
  thead tr{background:#0a2342}
  th{color:#fff;padding:6px 10px;text-align:left;font-size:8.5pt;font-weight:600}
  td{padding:5px 10px;border-bottom:1px solid #e8edf5;vertical-align:top}
  tr:nth-child(even) td{background:#f7f9fc}
  .link-item{padding:0.45em 0;border-bottom:1px solid #edf0f7}
  .link-item:last-child{border-bottom:none}
  .link-label{font-weight:600;font-size:9.5pt;color:#1c2333}
  .link-source{display:inline-block;font-size:7.5pt;font-weight:700;background:#e6ecf5;color:#0a2342;border-radius:2px;padding:1px 6px;margin-left:5px;text-transform:uppercase}
  .link-href{color:#1a6cbd;font-size:9pt;word-break:break-all;display:block;margin-top:2px}
  .stix-item{border-left:3px solid #3a7bd5;padding:0.45em 0.8em;margin-bottom:0.7em;background:#fafbfd}
  .stix-meta{display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin-bottom:0.2em}
  .badge{font-size:7.5pt;font-weight:700;border-radius:2px;padding:1px 7px;text-transform:uppercase}
  .badge-source{background:#e6ecf5;color:#0a2342}
  .badge-mal{background:#ffe5e5;color:#a00}
  .stix-count{font-size:8.5pt;color:#55657a}
  .stix-desc{font-size:9.5pt;margin:0.15em 0}
  .stix-dates{font-size:8pt;color:#7a8a9a}
  .note-item{border:1px solid #dce4f0;padding:0.6em 0.8em;margin-bottom:0.6em;border-radius:2px}
  .note-title{font-size:10pt;font-weight:600;margin-bottom:0.2em}
  .note-target{font-size:8.5pt;color:#1a6cbd;font-weight:600;margin-bottom:0.4em}
  .note-body{font-family:'Courier New',monospace;font-size:8.5pt;color:#2c3e50;white-space:pre-wrap}
  .muted{color:#7a8a9a;font-size:9.5pt}
  .pdf-footer{margin-top:2em;padding-top:0.6em;border-top:1px solid #dce4f0;display:flex;justify-content:space-between;font-size:8pt;color:#7a8a9a}
  @media print{body{padding:1.2cm}a{color:#1a6cbd}.pdf-section{page-break-inside:avoid}}
</style></head><body>
<div class="cover">
  <div class="cover-left">
    <div class="report-title">Threat Intelligence Report</div>
    <div class="report-sub">Skyfall CTI Platform &nbsp;·&nbsp; IP Analysis &nbsp;·&nbsp; TLP:${TLP}</div>
    <div class="report-sub">Generated: ${now}</div>
  </div>
  <div class="cover-right">
    <img src="/nologin-logo.webp" alt="NoLogin" />
    <div class="cover-meta">Job ID: ${JOB_ID}<br/>Status: ${STATUS}</div>
  </div>
</div>
<div class="obs-banner">
  <span class="obs-label">Observable Analyzed</span>
  <span class="obs-val">${OBS}</span>
</div>
<section class="pdf-section">
  <div class="sec-hd"><span class="sec-num">1</span><span class="sec-title">Risk Assessment</span></div>
  <div class="risk-row">
    <div class="risk-score">${RISK_SCORE}<span class="risk-denom">/100</span></div>
    <div>
      <div class="risk-level">HIGH</div>
      <div class="risk-stats">VirusTotal: <strong>${VT_MALICIOUS}/${VT_TOTAL}</strong> engines malicious &nbsp;·&nbsp; Abuse Score: <strong>${ABUSE_SCORE}/100</strong></div>
    </div>
  </div>
  <div class="risk-bar-bg"><div class="risk-bar-fg" style="width:${RISK_SCORE}%"></div></div>
  <ul class="risk-reasons">${RISK_REASONS.map(r => `<li>${r}</li>`).join('')}</ul>
</section>
<section class="pdf-section">
  <div class="sec-hd"><span class="sec-num">2</span><span class="sec-title">Investigation Links</span></div>
  <div>${LINKS.map(l => `<div class="link-item"><span class="link-label">${l.label}</span><span class="link-source">${l.source}</span><a class="link-href" href="${l.href}">${l.href}</a></div>`).join('')}</div>
</section>
<section class="pdf-section">
  <div class="sec-hd"><span class="sec-num">3</span><span class="sec-title">Geolocation</span></div>
  <div class="kv-grid">
    <div class="kv-item"><span class="kv-label">Coordinates</span><span class="kv-val">${LAT}, ${LNG}</span></div>
    <div class="kv-item"><span class="kv-label">Country</span><span class="kv-val">${COUNTRY}</span></div>
    <div class="kv-item"><span class="kv-label">City</span><span class="kv-val">${CITY}</span></div>
    <div class="kv-item"><span class="kv-label">Region</span><span class="kv-val">${REGION}</span></div>
    <div class="kv-item"><span class="kv-label">Timezone</span><span class="kv-val">${TZ}</span></div>
    <div class="kv-item"><span class="kv-label">ISP / Org</span><span class="kv-val">${ISP}</span></div>
    <div class="kv-item"><span class="kv-label">ASN</span><span class="kv-val">AS${ASN}</span></div>
  </div>
  <div style="position:relative;margin-top:0.8em">
    <img src="https://staticmap.openstreetmap.de/staticmap.php?center=${LAT},${LNG}&zoom=7&size=800x300&markers=${LAT},${LNG},red-pushpin"
      style="width:100%;border:1.5px solid #d4dce8;border-radius:3px;display:block"
      onerror="this.outerHTML='<p style=\\'color:#7a8a9a;font-size:9pt;margin-top:0.4em\\'>Map unavailable — coordinates: ${LAT}, ${LNG}</p>'" />
    <div style="position:absolute;bottom:5px;right:7px;background:rgba(255,255,255,0.88);font-size:7pt;padding:2px 6px;color:#555;border-radius:2px">© OpenStreetMap contributors</div>
  </div>
</section>
<section class="pdf-section">
  <div class="sec-hd"><span class="sec-num">4</span><span class="sec-title">Analyzer Results</span></div>
  <table><thead><tr><th>Analyzer</th><th>Result</th><th>Duration</th></tr></thead>
  <tbody>${analyzerRows}</tbody></table>
</section>
<section class="pdf-section">
  <div class="sec-hd"><span class="sec-num">5</span><span class="sec-title">STIX Sightings</span></div>
  ${STIX_SIGHTINGS.map(s => `<div class="stix-item">
    <div class="stix-meta">
      <span class="badge badge-source">${s.source}</span>
      ${s.reputation ? `<span class="badge badge-mal">${s.reputation}</span>` : ''}
      <span class="stix-count">${s.count} event${s.count !== 1 ? 's' : ''}</span>
    </div>
    <p class="stix-desc">${s.description}</p>
    ${(s.firstSeen || s.lastSeen) ? `<div class="stix-dates">${s.firstSeen ? `First: ${new Date(s.firstSeen).toLocaleString()}` : ''}${s.firstSeen && s.lastSeen ? ' &nbsp;·&nbsp; ' : ''}${s.lastSeen ? `Last: ${new Date(s.lastSeen).toLocaleString()}` : ''}</div>` : ''}
  </div>`).join('')}
</section>
<section class="pdf-section">
  <div class="sec-hd"><span class="sec-num">6</span><span class="sec-title">Analyst Notes</span></div>
  ${STIX_NOTES.map(n => `<div class="note-item">
    <div class="note-title">${n.abstract} <span class="badge badge-source">${n.source}</span></div>
    <div class="note-target">[IP: ${OBS}]</div>
    <div class="note-body">${n.content}</div>
  </div>`).join('')}
</section>
<section class="pdf-section">
  <div class="sec-hd"><span class="sec-num">7</span><span class="sec-title">Local Intelligence Database</span></div>
  <p style="margin-bottom:0.6em;font-size:9.5pt;color:#2c3e50"><strong>22</strong> nodes and <strong>52</strong> relationships found in local Neo4j database.</p>
  <table>
    <thead><tr><th>Label(s)</th><th>Key Properties</th><th>Edges</th></tr></thead>
    <tbody>${LOCAL_NODES.map(n => `<tr>
      <td><span class="badge badge-source">${n.labels}</span></td>
      <td style="font-size:8.5pt;line-height:1.5">${n.props}</td>
      <td style="text-align:center;font-weight:600">${n.edges}</td>
    </tr>`).join('')}</tbody>
  </table>
  <p style="margin-top:0.6em;font-size:8.5pt;color:#55657a">Relationship types: BASED_ON, LOCATED_AT, CONSISTS_OF, REFERENCES, SAME_AS, EXHIBITS</p>
</section>
<div class="pdf-footer">
  <span>Skyfall CTI &nbsp;·&nbsp; Confidential</span>
  <span>TLP:${TLP} &nbsp;·&nbsp; ${now}</span>
</div>
</body></html>`

  try {
    const printFrame = document.createElement('iframe')
    Object.assign(printFrame.style, { position: 'fixed', left: '-9999px', top: '-9999px', width: '0', height: '0', border: 'none' })
    document.body.appendChild(printFrame)
    const frameDoc = printFrame.contentDocument ?? printFrame.contentWindow?.document
    if (!frameDoc) { document.body.removeChild(printFrame); return }
    frameDoc.open(); frameDoc.write(html); frameDoc.close()
    const triggerPrint = () => {
      try { printFrame.contentWindow?.print() } catch {
        const win = window.open('', '_blank')
        if (win) { win.document.write(html); win.document.close(); win.print() }
      }
      setTimeout(() => { if (printFrame.parentNode) document.body.removeChild(printFrame) }, 1000)
    }
    if (printFrame.contentWindow) {
      printFrame.contentWindow.onafterprint = () => {
        setTimeout(() => { if (printFrame.parentNode) document.body.removeChild(printFrame) }, 500)
      }
    }
    setTimeout(triggerPrint, 1800)
  } catch { /* noop */ }
}

/* ─── Page component ──────────────────────────────────────── */
export default function DemoPage() {
  const [isDark, setIsDark] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [selAnalyzer, setSelAnalyzer] = useState<number | null>(null)

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setFeedback(`Copied ${key}`)
      setTimeout(() => { setCopied(null); setFeedback(null) }, 1600)
    })
  }

  const handlePdf = () => {
    setFeedback('Opening print dialog — save as PDF…')
    setTimeout(() => setFeedback(null), 3000)
    exportPdfReport()
  }

  return (
    <div className={`${styles.shell}${isDark ? '' : ` ${styles.light}`}`}>
      <div className={styles.inner}>

        {/* Header */}
        <header data-anim="header" className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nologin-logo.webp" alt="NoLogin" style={{ height: 28, objectFit: 'contain', flexShrink: 0 }} />
            <div style={{ width: 1, height: 28, background: 'rgba(128,128,128,0.2)', flexShrink: 0 }} />
            <div className={styles.headerMeta}>
              <p className={styles.eyebrow}>Skyfall CTI</p>
              <h1 className={styles.headerTitle}>IntelOwl IP Analyzer</h1>
              <p className={styles.headerSubtitle}>Launch enrichment jobs for IPv4/IPv6 observables and receive STIX-ready output.</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.onlineBadge}><Radar size={12} /> IntelOwl Online</span>
            <button onClick={() => setIsDark(p => !p)} className={styles.backButton} style={{ cursor: 'pointer' }}>
              {isDark ? <Sun size={12} /> : <Moon size={12} />}
              {isDark ? 'LIGHT' : 'DARK'}
            </button>
          </div>
          <div style={{ flex: '0 0 100%', paddingLeft: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 9, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.16em', color: 'rgba(248,248,248,0.88)' }}>
              <Link href="/" style={{ color: 'rgba(248,248,248,0.88)', textDecoration: 'none', letterSpacing: '0.16em', transition: 'color 120ms' }}>HOME</Link>
              <span style={{ margin: '0 7px', color: 'rgba(232,84,25,0.45)', fontSize: 8 }}>/</span>
              <span style={{ fontWeight: 700, letterSpacing: '0.18em', color: '#f5f5f5' }}>DEMO_ANALYSIS</span>
            </div>
          </div>
        </header>

        <main className={styles.layout}>

          {/* Request panel */}
          <section data-anim="request" className={`${styles.panel} ${styles.requestPanel}`}>
            <h2 className={styles.panelTitle}><Globe size={13} /> Analysis Request</h2>
            <form className={styles.form} onSubmit={e => e.preventDefault()}>
              <div>
                <label className={styles.fieldLabel}>IP Observable</label>
                <input defaultValue={OBS} className={`${styles.input} font-mono`} readOnly />
              </div>
              <div>
                <label className={styles.fieldLabel}>TLP</label>
                <select className={styles.select} defaultValue="CLEAR">
                  <option value="CLEAR">CLEAR</option>
                  <option value="GREEN">GREEN</option>
                  <option value="AMBER">AMBER</option>
                  <option value="RED">RED</option>
                </select>
              </div>
              <div className={styles.actionRow}>
                <button type="button" className={styles.primaryButton} onClick={() => setFeedback('Demo mode — result already loaded.')}>
                  <Sparkles size={14} /> Analyze Now
                </button>
                <Link href="/intelowl/analyze-ip"     className={`${styles.consoleLink} ${styles.consoleLinkActive}`}>IP Console</Link>
                <Link href="/intelowl/analyze-hash"   className={styles.consoleLink}>Hash Console</Link>
                <Link href="/intelowl/analyze-domain" className={styles.consoleLink}>Domain Console</Link>
              </div>
            </form>
          </section>

          {/* Result panel */}
          <section data-anim="result" className={`${styles.panel} ${styles.resultPanel}`}>
            <div className={styles.resultHeader}>
              <h2 className={styles.resultTitle}>Analysis Result</h2>
              <div className={styles.tabBar}>
                <button type="button" className={`${styles.tabButton} ${styles.tabButtonActive}`}>external summary</button>
                <button type="button" className={styles.tabButton}>local summary</button>
              </div>
            </div>

            <div className={styles.summary}>

              {/* KPI grid */}
              <div className={styles.kpiGrid}>
                {[
                  { label: 'Job ID',            value: String(JOB_ID),     meta: `Playbook: ${PLAYBOOK}` },
                  { label: 'Execution Status',  value: STATUS,              meta: `Total Time: ${PROCESS_TIME} s` },
                  { label: 'Analyzer Coverage', value: '12/14',             meta: 'trusted sources completed' },
                  { label: 'STIX Bundle',       value: String(STIX_COUNT),  meta: 'objects exported' },
                ].map(({ label, value, meta }) => (
                  <article key={label} data-anim="kpi" className={styles.kpiCard}>
                    <p className={styles.kpiLabel}>{label}</p>
                    <p className={styles.kpiValue}>{value}</p>
                    <p className={styles.kpiMeta}>{meta}</p>
                  </article>
                ))}
              </div>

              {/* Risk + Quick Actions + Context */}
              <div data-anim="detail" className={styles.rowThree}>
                <article className={`${styles.riskCard} ${RISK_LEVEL === 'HIGH' ? styles.riskHigh : RISK_LEVEL === 'MEDIUM' ? styles.riskMedium : styles.riskLow}`}>
                  <h3 className={styles.sectionTitle}><Gauge size={12} /> Risk Semaphore</h3>
                  <p className={styles.riskScore}>{RISK_SCORE}/100</p>
                  <div className={styles.progressTrack}>
                    <div className={`${styles.progressBar} ${RISK_LEVEL === 'HIGH' ? styles.riskMeterHigh : RISK_LEVEL === 'MEDIUM' ? styles.riskMeterMedium : styles.riskMeterLow}`} style={{ width: `${RISK_SCORE}%` }} />
                  </div>
                  <div className={styles.riskNotes}>
                    <span className={RISK_LEVEL === 'HIGH' ? styles.riskBadgeHigh : RISK_LEVEL === 'MEDIUM' ? styles.riskBadgeMedium : styles.riskBadgeLow}>{RISK_LEVEL}</span>
                    {RISK_REASONS.slice(0, 2).map(r => <p key={r}>{r}</p>)}
                  </div>
                </article>

                <article className={styles.quickActions}>
                  <h3 className={styles.sectionTitle}><FileText size={12} /> Quick Actions</h3>
                  <div className={styles.quickActionsButtons}>
                    <button type="button" className={styles.quickButton} onClick={() => copyText(OBS, 'IOC')}>
                      <Copy size={11} /> {copied === 'IOC' ? 'Copied!' : 'Copy IOC'}
                    </button>
                    <button type="button" className={styles.quickButton} onClick={() => copyText(INDICATOR_ID, 'STIX ID')}>
                      <Copy size={11} /> {copied === 'STIX ID' ? 'Copied!' : 'Copy STIX ID'}
                    </button>
                    <button type="button" className={styles.quickButton} onClick={handlePdf}>
                      <Download size={11} /> Download PDF Report
                    </button>
                    <button type="button" className={styles.quickButton} onClick={() => setFeedback('Demo mode — result already loaded.')}>
                      <Sparkles size={11} /> Repeat Analysis
                    </button>
                  </div>
                  <div className={styles.quickMeta}>
                    <p className={styles.truncate}>Indicator ID: {INDICATOR_ID}</p>
                    <p className={styles.truncate}>Bundle ID: {BUNDLE_ID}</p>
                  </div>
                  {feedback && <p className={styles.feedback}>{feedback}</p>}
                </article>

                <article className={styles.contextCard}>
                  <h3 className={styles.sectionTitle}><Activity size={12} /> Threat and Context</h3>
                  <div className={styles.contextList}>
                    <p>Observable: <span className="font-mono">{OBS}</span></p>
                    <p>TLP: <strong>{TLP}</strong></p>
                    <p>Mode: <strong>IP</strong></p>
                    <p>Country: <strong>{COUNTRY}</strong></p>
                    <p>ISP/Owner: <strong>{ISP}</strong></p>
                    <p>ASN: <strong>{ASN}</strong></p>
                  </div>
                  <div className={styles.vtSignal}>
                    <p>{VT_MALICIOUS}/{VT_TOTAL} engines flagged malicious</p>
                    <p>Indicator confidence: {CONFIDENCE}</p>
                  </div>
                </article>
              </div>

              {/* Globe */}
              <section data-anim="detail" className={styles.globeShowcase}>
                <div className={styles.investigationHeader}>
                  <h3 className={styles.sectionTitle}><MapPinned size={12} /> IOC Exact Geolocation Map</h3>
                  <span className={styles.sectionMuted}>Transparent animated globe with outbound attack paths</span>
                </div>
                <IOCGlobeMap
                  observable={OBS}
                  sourceLatitude={LAT}
                  sourceLongitude={LNG}
                  sourceCountry={COUNTRY}
                  targets={TARGETS}
                />
              </section>

              {/* Investigation report */}
              <section data-anim="detail" className={styles.investigationBoard}>
                <div className={styles.investigationHeader}>
                  <h3 className={styles.sectionTitle}><ScanSearch size={12} /> Expanded Investigation Report</h3>
                  <span className={styles.sectionMuted}>Concrete evidence, mapped context and direct intel pivots</span>
                </div>
                <div className={styles.investigationGrid}>
                  <article data-anim="report-block" className={styles.reportCard}>
                    <h4 className={styles.reportTitle}><ShieldCheck size={14} /> Operational Verdict</h4>
                    <p className={styles.reportLead}>
                      HIGH risk posture with score {RISK_SCORE}/100 for IOC<span className="font-mono"> {OBS}</span>.
                    </p>
                    <div className={styles.reportMetrics}>
                      <span>Abuse score: <strong>{ABUSE_SCORE}</strong></span>
                      <span>Reports: <strong>{ABUSE_REPORTS}</strong></span>
                      <span>Distinct reporters: <strong>{ABUSE_USERS}</strong></span>
                      <span>Indicator confidence: <strong>{CONFIDENCE}</strong></span>
                    </div>
                    <ul className={styles.reportList}>
                      {RISK_REASONS.slice(0, 3).map(r => <li key={r}>{r}</li>)}
                    </ul>
                  </article>

                  <article data-anim="report-block" className={styles.reportCard}>
                    <h4 className={styles.reportTitle}><MapPinned size={14} /> Infrastructure and Geo Context</h4>
                    <div className={styles.reportLines}>
                      <p>ISP/Owner: <strong>{ISP}</strong></p>
                      <p><span>ASN: <strong>{ASN}</strong></span><span> · </span><span>Network: <span className="font-mono">{NETWORK}</span></span></p>
                      <p>Usage type: <strong>{USAGE}</strong></p>
                      <p>Domain: <strong>{DOMAIN}</strong></p>
                      <p>Geo: <strong>{CITY}</strong><span>, <strong>{REGION}</strong></span><span> · {COUNTRY}</span></p>
                      <p>Coordinates: <strong>{LAT}</strong>, <strong>{LNG}</strong></p>
                      <p>Timezone: <strong>{TZ}</strong></p>
                    </div>
                  </article>

                  <article data-anim="report-block" className={styles.reportCard}>
                    <h4 className={styles.reportTitle}><Activity size={14} /> Threat Evidence</h4>
                    <div className={styles.inlineSection}>
                      <p className={styles.reportMiniTitle}>Abuse categories</p>
                      <div className={styles.badgeWrap}>
                        {ABUSE_CATS.map(c => <span key={c.name} className={styles.reportBadge}>{c.name} ({c.count})</span>)}
                      </div>
                    </div>
                    <div className={styles.inlineSection}>
                      <p className={styles.reportMiniTitle}>Observed behaviors</p>
                      <div className={styles.badgeWrap}>
                        {BEHAVIORS.map(b => <span key={b} className={styles.reportBadgeSoft}>{b}</span>)}
                      </div>
                    </div>
                  </article>

                  <article data-anim="report-block" className={styles.reportCard}>
                    <h4 className={styles.reportTitle}><Target size={14} /> Targeting and MITRE Mapping</h4>
                    <div className={styles.inlineSection}>
                      <p className={styles.reportMiniTitle}>Target distribution</p>
                      <ul className={styles.reportListCompact}>
                        {TARGETS.slice(0, 6).map(t => (
                          <li key={t.country}>{t.country}: <strong>{t.value}</strong> ({pct(t.percent)})</li>
                        ))}
                      </ul>
                    </div>
                    <div className={styles.inlineSection}>
                      <p className={styles.reportMiniTitle}>MITRE techniques</p>
                      <div className={styles.badgeWrap}>
                        {MITRE.map(m => <span key={m} className={styles.reportBadgeSoft}>{m}</span>)}
                      </div>
                    </div>
                  </article>

                  <article data-anim="report-block" className={styles.reportCard}>
                    <h4 className={styles.reportTitle}><Link2 size={14} /> Investigation Links</h4>
                    <div className={styles.referenceList}>
                      {LINKS.map(l => (
                        <a key={l.source} href={l.href} target="_blank" rel="noreferrer" className={styles.referenceItem}>
                          <span>{l.label}</span>
                          <span className={styles.referenceMeta}>{l.source}</span>
                          <ExternalLink size={13} />
                        </a>
                      ))}
                    </div>
                  </article>

                  <article data-anim="report-block" className={styles.reportCard}>
                    <h4 className={styles.reportTitle}><Waypoints size={14} /> Recommended Actions</h4>
                    <ul className={styles.recommendationList}>
                      <li><CheckCircle2 size={13} />Block IOC at email and perimeter gateways.</li>
                      <li><CheckCircle2 size={13} />Create SIEM detection on inbound SMTP from this IP.</li>
                      <li><CheckCircle2 size={13} />Hunt related events in network range <span className="font-mono">{NETWORK}</span>.</li>
                      <li><CheckCircle2 size={13} />Track STIX indicator <span className="font-mono">{INDICATOR_ID}</span> for campaign pivots.</li>
                    </ul>
                  </article>
                </div>
              </section>

              {/* Analyzer board + Timeline */}
              <div data-anim="detail" className={styles.rowAnalyzer}>
                <article className={styles.analyzerBoard}>
                  <div className={styles.resultHeader}>
                    <h3 className={styles.sectionTitle}><BarChart3 size={12} /> Analyzer Execution Board</h3>
                    <span className={styles.sectionMuted}>14 reports · 12 success · 2 failed</span>
                  </div>
                  <div className={styles.coverageTrack}>
                    <div className={styles.coverageBar} style={{ width: '85.71%' }} />
                  </div>
                  <div className={styles.analyzerList}>
                    {ANALYZERS.map((a, i) => (
                      <button key={a.name} type="button" className={styles.analyzerItemButton} onClick={() => setSelAnalyzer(selAnalyzer === i ? null : i)}>
                        <div className={styles.analyzerItemHead}>
                          <p className={styles.analyzerName}>{a.name}</p>
                          <div className={styles.analyzerMeta}>
                            <span className={styles.sectionMuted}>{fmtSec(a.ms)}</span>
                            <span className={statusBadgeClass(a.status)}>{a.status}</span>
                          </div>
                        </div>
                        <div className={styles.analyzerCounts}>
                          <span><Activity size={12} /> analyzer</span>
                          <span><Clock3 size={12} /> 6/1/2026, 4:17:17 PM</span>
                          <span><Database size={12} /> ID {a.id}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </article>

                <article className={styles.timelineCard}>
                  <h3 className={styles.sectionTitle}><Clock3 size={12} /> Timeline and Output</h3>
                  <div className={styles.contextList}>
                    <p>Received: <span>6/1/2026, 4:17:17 PM</span></p>
                    <p>Finished: <span>6/1/2026, 4:17:20 PM</span></p>
                    <p>Warnings: <strong>0</strong></p>
                    <p>Errors: <strong>0</strong></p>
                  </div>
                  <div className={styles.resolutionCard}>
                    <p className={styles.sectionTitle}>Resolved Domains</p>
                    <div className={styles.resolutionList}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <p className="font-mono" style={{ fontSize: 12, color: '#93c5fd', marginRight: 8 }}>33.196.62.34.bc.googleusercontent.com</p>
                        <span style={{ fontSize: 9, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--hud-red)', letterSpacing: '0.1em' }}>
                          <ScanSearch size={10} /> Pivot
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </div>

              {/* STIX Sightings */}
              <div data-anim="detail" className={styles.rowAnalyzer}>
                <article className={`${styles.stixCard} ${styles.stixWide}`}>
                  <h3 className={styles.sectionTitle}><ScanSearch size={12} /> STIX Sightings Timeline</h3>
                  <div className={styles.sightingList}>
                    {STIX_SIGHTINGS.map(s => (
                      <article key={s.id} className={styles.sightingCard}>
                        <div className={styles.sightingHeader}>
                          <span className={styles.reportBadge}>{s.source}</span>
                          {s.reputation && <span className={`${styles.reportBadge} ${styles.statusFailed}`}>{s.reputation}</span>}
                          <span className={styles.sightingCount}>{s.count} events</span>
                        </div>
                        <p className={styles.sightingDesc}>{s.description}</p>
                        <div className={styles.sightingTimeline}>
                          {s.firstSeen && <span>First seen: {fmtDt(s.firstSeen)}</span>}
                          {s.lastSeen  && <span>Last seen: {fmtDt(s.lastSeen)}</span>}
                        </div>
                        {s.scores && (
                          <div className={styles.sightingScoreGrid}>
                            {Object.entries(s.scores).map(([k, v]) => (
                              <div key={k} className={styles.sightingScoreItem}>
                                <span className={styles.sightingScoreLabel}>{k}</span>
                                <span className={styles.sightingScoreValue}>{v}/5</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {s.behaviors.length > 0 && (
                          <div className={styles.badgeWrap}>
                            {s.behaviors.map(b => <span key={b} className={styles.sightingBehaviorBadge}>{b}</span>)}
                          </div>
                        )}
                        {s.vtMaliciousCount > 0 && (
                          <div className={styles.sightingEngines}>
                            <span className={styles.engineMalicious}>{s.vtMaliciousCount} malicious</span>
                            {s.vtSuspiciousCount > 0 && <span className={styles.engineSuspicious}>{s.vtSuspiciousCount} suspicious</span>}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </article>
              </div>

              {/* VT Breakdown + CrowdSec */}
              <div data-anim="detail" className={styles.investigationGrid}>
                <article data-anim="report-block" className={styles.reportCard}>
                  <h4 className={styles.reportTitle}><ShieldCheck size={14} /> VirusTotal Engine Breakdown</h4>
                  <div className={styles.reportMetrics}>
                    <span>Malicious: <strong className={styles.engineMalicious}>{VT_MAL_ENGINES.length}</strong></span>
                    <span>Suspicious: <strong className={styles.engineSuspicious}>{VT_SUS_ENGINES.length}</strong></span>
                    <span>Total: <strong>{VT_TOTAL}</strong></span>
                  </div>
                  <div className={styles.inlineSection}>
                    <p className={styles.reportMiniTitle}>Malicious Engines</p>
                    <div className={styles.engineGrid}>
                      {VT_MAL_ENGINES.map(e => <span key={e} className={styles.engineMaliciousBadge}>{e}</span>)}
                    </div>
                  </div>
                  <div className={styles.inlineSection}>
                    <p className={styles.reportMiniTitle}>Suspicious Engines</p>
                    <div className={styles.engineGrid}>
                      {VT_SUS_ENGINES.map(e => <span key={e} className={styles.engineSuspiciousBadge}>{e}</span>)}
                    </div>
                  </div>
                  <div className={styles.inlineSection}>
                    <p className={styles.reportMiniTitle}>Flags</p>
                    <div className={styles.reportMetrics}>
                      <span>Whitelisted: <strong>No</strong></span>
                      <span>Tor Exit: <strong>No</strong></span>
                    </div>
                  </div>
                </article>

                <article data-anim="report-block" className={styles.reportCard}>
                  <h4 className={styles.reportTitle}><AlertTriangle size={14} /> CrowdSec Intelligence</h4>
                  <div className={styles.reportMetrics}>
                    <span>Noise: <strong>medium</strong></span>
                    <span>Active: <strong>21 days</strong></span>
                  </div>
                  <div className={styles.sightingScoreGrid}>
                    {Object.entries(CROWDSEC_SCORES).filter(([, v]) => v > 0).map(([k, v]) => (
                      <div key={k} className={styles.sightingScoreItem}>
                        <span className={styles.sightingScoreLabel}>{k}</span>
                        <span className={styles.sightingScoreValue}>{v}/5</span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.inlineSection}>
                    <p className={styles.reportMiniTitle}>Blocklists</p>
                    <div className={styles.badgeWrap}>
                      {CROWDSEC_BLOCKLISTS.map(b => <span key={b} className={styles.reportBadge}>{b}</span>)}
                    </div>
                  </div>
                </article>
              </div>

              {/* Attack Patterns + Infra */}
              <div data-anim="detail" className={styles.investigationGrid}>
                {ATTACK_PATTERNS.map(ap => (
                  <article key={ap.id} data-anim="report-block" className={styles.reportCard}>
                    <h4 className={styles.reportTitle}><ShieldCheck size={14} /> {ap.name}</h4>
                    <p className={styles.reportMiniTitle}>{ap.id}</p>
                    {ap.description && <p className={styles.reportHint} style={{ marginTop: 6 }}>{ap.description}</p>}
                    <div className={styles.badgeWrap} style={{ marginTop: 8 }}>
                      <span className={styles.reportBadgeSoft}>{ap.source}</span>
                    </div>
                  </article>
                ))}
                {INFRA_NODES.map(n => (
                  <article key={n.id} data-anim="report-block" className={styles.reportCard}>
                    <h4 className={styles.reportTitle}><Globe size={14} /> {n.name}</h4>
                    <p className={styles.reportLead} style={{ fontSize: 10 }}>{n.description}</p>
                    <div className={styles.reportMetrics} style={{ marginTop: 8 }}>
                      <span>ASN: <strong>{n.asn}</strong></span>
                      <span>Network: <span className="font-mono">{n.network}</span></span>
                    </div>
                    <div className={styles.badgeWrap} style={{ marginTop: 6 }}>
                      <span className={styles.reportBadgeSoft}>Source: {n.source}</span>
                    </div>
                  </article>
                ))}
              </div>

              {/* Analyst Notes */}
              <div data-anim="detail" className={styles.rowAnalyzer}>
                <article className={`${styles.stixCard} ${styles.stixWide}`}>
                  <div className={styles.resultHeader}>
                    <h3 className={styles.sectionTitle}><FileText size={12} /> Analyst Notes ({STIX_NOTES.length})</h3>
                  </div>
                  <div className={styles.sightingList}>
                    {STIX_NOTES.map(n => (
                      <article key={n.id} className={styles.sightingCard}>
                        <div className={styles.sightingHeader}>
                          <span className={styles.reportBadge}>{n.source}</span>
                          <span className={styles.sightingCount} style={{ fontSize: 10, color: 'var(--hud-white)' }}>{n.abstract}</span>
                        </div>
                        <pre style={{ fontFamily: 'monospace', fontSize: 9, whiteSpace: 'pre-wrap', color: 'var(--hud-muted)', marginTop: 6, lineHeight: 1.7 }}>
                          {n.content}
                        </pre>
                      </article>
                    ))}
                  </div>
                </article>
              </div>

              {/* Local Neo4j DB */}
              <div data-anim="detail" className={styles.rowAnalyzer}>
                <article className={`${styles.stixCard} ${styles.stixWide}`}>
                  <div className={styles.resultHeader}>
                    <h3 className={styles.sectionTitle}><Database size={12} /> Local Intelligence Database</h3>
                    <span className={styles.sectionMuted}>22 nodes and 52 relationships found in local Neo4j database.</span>
                  </div>
                  <div style={{ overflowX: 'auto', marginTop: 8 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                      <thead>
                        <tr style={{ background: 'rgba(232,84,25,0.10)' }}>
                          {['Label(s)', 'Key Properties', 'Edges'].map(h => (
                            <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 9, letterSpacing: '0.12em', color: 'var(--hud-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {LOCAL_NODES.map((n, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '5px 10px', verticalAlign: 'top' }}>
                              <span className={styles.reportBadge} style={{ display: 'inline-block', whiteSpace: 'nowrap', fontSize: 8 }}>{n.labels}</span>
                            </td>
                            <td style={{ padding: '5px 10px', fontSize: 9, color: 'var(--hud-muted)', lineHeight: 1.7 }}>{n.props}</td>
                            <td style={{ padding: '5px 10px', textAlign: 'center', fontWeight: 700, color: 'var(--hud-red)' }}>{n.edges}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p style={{ marginTop: 8, fontSize: 9, color: 'var(--hud-muted)', letterSpacing: '0.1em' }}>
                    Relationship types: BASED_ON, LOCATED_AT, CONSISTS_OF, REFERENCES, SAME_AS, EXHIBITS
                  </p>
                </article>
              </div>

            </div>{/* /summary */}
          </section>
        </main>
      </div>
    </div>
  )
}
