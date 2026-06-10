'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ArrowLeft, X, Database, ChevronRight, Layers } from 'lucide-react'

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false })

// ── Types ────────────────────────────────────────────────────────────────────

type Group = 'mitre' | 'nvd' | 'feeds' | 'forge'

interface GraphNode {
  id: string
  label: string
  stixType: string
  group: Group
  count: number
  val: number
  fields: string[]
  description: string
  forgeCapable?: boolean
  x?: number
  y?: number
  z?: number
  vx?: number
  vy?: number
  vz?: number
}

interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  label: string
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  bg:      '#000000',
  red:     '#E85419',
  redDim:  'rgba(232,84,25,0.35)',
  mitre:   '#FF4444',
  nvd:     '#4499FF',
  feeds:   '#22CC77',
  forge:   '#BB55FF',
  text:    '#E2E2E2',
  muted:   'rgba(180,180,180,0.55)',
  surface: 'rgba(8,8,8,0.95)',
  border:  'rgba(255,255,255,0.1)',
  mono:    "'JetBrains Mono','Share Tech Mono',monospace",
}

const GROUP_META: Record<Group, { label: string; color: string; desc: string }> = {
  mitre: { label: 'MITRE ATT&CK', color: C.mitre, desc: 'Bundle STIX 2.1 oficial MITRE · ingestor.py' },
  nvd:   { label: 'NVD / KEVin',  color: C.nvd,   desc: 'National Vulnerability Database + CISA KEV · Kafka' },
  feeds: { label: 'Live Feeds',   color: C.feeds,  desc: 'OTX · VirusTotal · AbuseIPDB · Crowdsec · UrlScan · Skyfall-Geo' },
  forge: { label: 'Forge / Manual', color: C.forge, desc: 'Skyfall Forge Builder · x_ingestion_medium=Forge' },
}

// ── Schema data ───────────────────────────────────────────────────────────────

const NODES: GraphNode[] = [
  // MITRE ATT&CK
  { id: 'Technique',           label: 'Technique',          stixType: 'attack-pattern',          group: 'mitre', count: 1249,   val: 22, fields: ['id','name','x_mitre_id','x_mitre_platforms','x_mitre_is_subtechnique','kill_chain_phases','x_mitre_detection','embedding'],          description: 'Técnica o sub-técnica ATT&CK. Describe un método concreto de ataque. Incluye embedding vectorial para búsqueda semántica.' },
  { id: 'Mitigation',          label: 'Mitigation',         stixType: 'course-of-action',        group: 'mitre', count: 334,    val: 9,  fields: ['id','name','x_mitre_id','description','external_references'],                                                                        description: 'Contramedida ATT&CK para mitigar una técnica de ataque concreta.' },
  { id: 'Malware',             label: 'Malware',            stixType: 'malware',                 group: 'mitre', count: 831,    val: 14, fields: ['id','name','is_family','x_mitre_platforms','x_mitre_aliases','x_mitre_domains','embedding'],                                          description: 'Familia o muestra de malware catalogada en ATT&CK. Incluye aliases y plataformas objetivo.' },
  { id: 'Tool',                label: 'Tool',               stixType: 'tool',                    group: 'mitre', count: 93,     val: 8,  fields: ['id','name','x_mitre_platforms','x_mitre_aliases','x_mitre_contributors'],                                                            description: 'Herramienta legítima o dual-use usada por actores de amenaza (Net, Mimikatz, etc.).' },
  { id: 'IntrusionSet',        label: 'IntrusionSet',       stixType: 'intrusion-set',           group: 'mitre', count: 192,    val: 13, fields: ['id','name','aliases','x_mitre_contributors','x_mitre_domains','embedding'],                        forgeCapable: true,              description: 'Grupo APT / actor de amenaza con infraestructura, TTPs y motivación comunes.' },
  { id: 'Campaign',            label: 'Campaign',           stixType: 'campaign',                group: 'mitre', count: 141,    val: 10, fields: ['id','name','first_seen','last_seen','aliases','x_mitre_first_seen_citation'],                                                         description: 'Campaña de ataque con objetivos y temporalidad definidos.' },
  { id: 'X_mitre_data_source', label: 'Data-Source',       stixType: 'x-mitre-data-source',     group: 'mitre', count: 42,     val: 6,  fields: ['id','name','x_mitre_platforms','x_mitre_collection_layers','x_mitre_contributors'],                                                  description: 'Fuente de datos para detección de técnicas ATT&CK (Process, Network Traffic, File…).' },
  { id: 'X_mitre_asset',       label: 'X-Mitre-Asset',     stixType: 'x-mitre-asset',           group: 'mitre', count: 18,     val: 5,  fields: ['id','name','x_mitre_sectors','x_mitre_platforms','x_mitre_related_assets'],                                                          description: 'Activo ICS/OT objetivo de técnicas ATT&CK for ICS (PLC, HMI, Engineering Workstation…).' },
  // NVD / KEVin
  { id: 'Vulnerability',       label: 'Vulnerability',      stixType: 'vulnerability',           group: 'nvd',   count: 572,    val: 14, fields: ['id','name','x_cve_id','x_cvss_score','x_epss_score','x_cisa_known_exploited','description','x_ingestion_medium'], forgeCapable: true, description: 'CVE del NVD enriquecido con CVSS, EPSS y estado CISA KEV.' },
  { id: 'Software',            label: 'Software',           stixType: 'software',                group: 'nvd',   count: 287,    val: 8,  fields: ['id','name','cpe','x_ingestion_medium'],                                                               forgeCapable: true,              description: 'Producto software identificado por CPE, objetivo de CVEs.' },
  // Live Feeds
  { id: 'Indicator',           label: 'Indicator',          stixType: 'indicator',               group: 'feeds', count: 326931, val: 32, fields: ['id','name','pattern','pattern_type','indicator_types','valid_from','x_ioc_type','x_decay_score','x_decay_last_updated','x_ingestion_medium','x_source'], forgeCapable: true, description: 'IOC estructurado en patrón STIX. El nodo más abundante del grafo (327k entradas).' },
  { id: 'IP',                  label: 'IP',                 stixType: 'ipv4-addr',               group: 'feeds', count: 48251,  val: 20, fields: ['id','name','value','x_ingestion_medium','x_source'],                                                  forgeCapable: true,              description: 'Dirección IPv4 observable. Puede estar geolocada y vinculada a infraestructura ASN.' },
  { id: 'Domain',              label: 'Domain',             stixType: 'domain-name',             group: 'feeds', count: 3501,   val: 10, fields: ['id','name','value','x_source','x_ingestion_medium'],                                                                                  description: 'Nombre de dominio. Enriquecido con VirusTotal y UrlScan.' },
  { id: 'URL',                 label: 'URL',                stixType: 'url',                     group: 'feeds', count: 594384, val: 30, fields: ['id','name','value','x_ingestion_medium'],                                                             forgeCapable: true,              description: 'URL maliciosa o sospechosa. Mayor volumen del grafo: 594k entradas.' },
  { id: 'File',                label: 'File',               stixType: 'file',                    group: 'feeds', count: 1087,   val: 7,  fields: ['id','hashes','hash_sha1','type','x_ingestion_medium'],                                                                                description: 'Artefacto de fichero identificado por hashes (SHA1, MD5, SHA256).' },
  { id: 'CryptoWallet',        label: 'CryptoWallet',       stixType: 'cryptocurrency-wallet',   group: 'feeds', count: 2784,   val: 9,  fields: ['id','name','value','extensions','x_ingestion_medium'],                                                                                description: 'Dirección de cartera de criptomoneda (Ethereum, Bitcoin, etc.).' },
  { id: 'Report',              label: 'Report',             stixType: 'report',                  group: 'feeds', count: 668,    val: 10, fields: ['id','name','published','object_refs','x_source','x_otx_pulse_id','x_ingestion_medium'],                                               description: 'Informe de inteligencia (OTX Pulse, Skyfall-CTI). Agrupa IOCs en una narrativa.' },
  { id: 'Note',                label: 'Note',               stixType: 'note',                    group: 'feeds', count: 6333,   val: 11, fields: ['id','abstract','content','x_source','object_refs','x_ingestion_medium'],                                                              description: 'Nota de análisis. Fuentes: VirusTotal, AbuseIPDB, Crowdsec, UrlScan.' },
  { id: 'Sighting',            label: 'Sighting',           stixType: 'sighting',                group: 'feeds', count: 1226,   val: 9,  fields: ['id','first_seen','last_seen','count','x_malicious_scans','x_total_scans','x_source','x_ingestion_medium'], forgeCapable: true,           description: 'Avistamiento confirmado de un indicador (AbuseIPDB, VirusTotal, Crowdsec).' },
  { id: 'Infrastructure',      label: 'Infrastructure',     stixType: 'infrastructure',          group: 'feeds', count: 295,    val: 8,  fields: ['id','name','infrastructure_types','x_source','x_ingestion_medium'],                                                                    description: 'Infraestructura de red asociada (ASN, proveedor cloud). Fuente: AbuseIPDB, VirusTotal.' },
  { id: 'Location',            label: 'Location',           stixType: 'location',                group: 'feeds', count: 2106,   val: 9,  fields: ['id','name','x_location_type','x_source'],                                                            forgeCapable: true,              description: 'Localización geográfica. Generada por el servicio Skyfall-Geo.' },
  { id: 'Identity',            label: 'Identity',           stixType: 'identity',                group: 'feeds', count: 175,    val: 7,  fields: ['id','name','identity_class','x_mitre_attack_spec_version','x_ingestion_medium'],                       forgeCapable: true,              description: 'Organización o sistema que crea o atestigua objetos STIX.' },
  { id: 'MarkingDefinition',   label: 'MarkingDef',         stixType: 'marking-definition',      group: 'feeds', count: 9,      val: 5,  fields: ['id','definition_type','definition','x_ingestion_medium'],                                                                             description: 'Clasificación TLP (Traffic Light Protocol) para control de difusión de inteligencia.' },
]

const LINKS: GraphLink[] = [
  // MITRE
  { source: 'Mitigation',          target: 'Technique',       label: 'MITIGATES' },
  { source: 'Malware',             target: 'Technique',       label: 'USES' },
  { source: 'Tool',                target: 'Technique',       label: 'USES' },
  { source: 'Technique',          target: 'Technique',       label: 'SUBTECHNIQUE_OF' },
  { source: 'IntrusionSet',        target: 'Malware',         label: 'USES' },
  { source: 'IntrusionSet',        target: 'Tool',            label: 'USES' },
  { source: 'IntrusionSet',        target: 'Technique',       label: 'USES' },
  { source: 'Campaign',            target: 'IntrusionSet',    label: 'ATTRIBUTED_TO' },
  { source: 'Campaign',            target: 'Technique',       label: 'USES' },
  { source: 'X_mitre_data_source', target: 'Technique',       label: 'DETECTS' },
  { source: 'Technique',          target: 'X_mitre_asset',   label: 'TARGETS' },
  // NVD
  { source: 'Vulnerability',       target: 'Technique',       label: 'USES' },
  { source: 'Vulnerability',       target: 'Software',        label: 'TARGETS' },
  // Cross-zone
  { source: 'Indicator',           target: 'Malware',         label: 'INDICATES' },
  { source: 'IP',                  target: 'Technique',       label: 'EXHIBITS' },
  // IOC
  { source: 'Indicator',           target: 'IP',              label: 'INDICATES' },
  { source: 'Indicator',           target: 'Domain',          label: 'INDICATES' },
  { source: 'Indicator',           target: 'URL',             label: 'INDICATES' },
  { source: 'Indicator',           target: 'File',            label: 'INDICATES' },
  { source: 'Indicator',           target: 'CryptoWallet',    label: 'INDICATES' },
  { source: 'Domain',              target: 'IP',              label: 'RESOLVES_TO' },
  { source: 'IP',                  target: 'Location',        label: 'LOCATED_AT' },
  { source: 'IP',                  target: 'Infrastructure',  label: 'CONSISTS_OF' },
  // Context
  { source: 'Report',              target: 'Indicator',       label: 'REFERENCES' },
  { source: 'Report',              target: 'IP',              label: 'REFERENCES' },
  { source: 'Note',                target: 'IP',              label: 'REFERENCES' },
  { source: 'Note',                target: 'Vulnerability',   label: 'REFERENCES' },
  { source: 'Sighting',            target: 'Indicator',       label: 'SIGHTING_OF' },
  { source: 'Report',              target: 'Identity',        label: 'CREATED_BY' },
  { source: 'Indicator',          target: 'Campaign',        label: 'PART_OF' },
  { source: 'Indicator',          target: 'Location',        label: 'LOCATED_AT' },
  { source: 'Indicator',          target: 'MarkingDefinition', label: 'HAS_MARKING' },
]

// ── Cluster centers ───────────────────────────────────────────────────────────

const CLUSTER: Record<Group, { x: number; y: number; z: number }> = {
  mitre: { x: -1000, y:  600, z:  200 },
  nvd:   { x:  1000, y:  600, z: -200 },
  feeds: { x:     0, y: -800, z:    0 },
  forge: { x:  1100, y: -700, z:  250 },
}

// Pre-position each node near its cluster center so the simulation starts spread
function jitter(r: number) { return (Math.random() - 0.5) * r * 2 }

const GRAPH_DATA = {
  nodes: NODES.map(n => {
    const c = CLUSTER[n.group]
    return { ...n, x: c.x + jitter(200), y: c.y + jitter(200), z: c.z + jitter(200) }
  }),
  links: LINKS,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Brackets({ color = C.red, size = 10 }: { color?: string; size?: number }) {
  const s: React.CSSProperties = { position: 'absolute', width: size, height: size }
  return (
    <>
      <div style={{ ...s, top: -1, left:  -1, borderTop:    `1.5px solid ${color}`, borderLeft:  `1.5px solid ${color}` }} />
      <div style={{ ...s, top: -1, right: -1, borderTop:    `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` }} />
      <div style={{ ...s, bottom: -1, left:  -1, borderBottom: `1.5px solid ${color}`, borderLeft:  `1.5px solid ${color}` }} />
      <div style={{ ...s, bottom: -1, right: -1, borderBottom: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` }} />
    </>
  )
}

function fmtCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({ node, onClose }: { node: GraphNode; onClose: () => void }) {
  const meta  = GROUP_META[node.group]
  const color = meta.color
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contentRef.current) return
    const items = contentRef.current.querySelectorAll<HTMLElement>('.field-item')
    gsap.fromTo(items,
      { opacity: 0, x: 18 },
      { opacity: 1, x: 0, duration: 0.22, stagger: 0.04, ease: 'power2.out', delay: 0.18 }
    )
  }, [node.id])

  const incoming = LINKS.filter(l =>
    (typeof l.target === 'string' ? l.target : (l.target as GraphNode).id) === node.id
  )
  const outgoing = LINKS.filter(l =>
    (typeof l.source === 'string' ? l.source : (l.source as GraphNode).id) === node.id
    && (typeof l.target === 'string' ? l.target : (l.target as GraphNode).id) !== node.id
  )

  return (
    <div ref={contentRef} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 14px', borderBottom: `1px solid ${color}22`, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{
            fontSize: 9, fontFamily: C.mono, letterSpacing: '0.16em',
            color, background: `${color}18`, border: `1px solid ${color}44`,
            padding: '3px 8px', marginBottom: 10,
          }}>
            {meta.label}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 2 }}
          >
            <X size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 14, height: 14, borderRadius: '50%',
            background: color, boxShadow: `0 0 10px ${color}88`, flexShrink: 0,
          }} />
          <span style={{ fontSize: 20, fontFamily: C.mono, fontWeight: 700, color: C.text, letterSpacing: '0.03em' }}>
            {node.label}
          </span>
        </div>
        <div style={{ marginTop: 6, fontSize: 10, fontFamily: C.mono, color: C.muted }}>
          stix: {node.stixType}
        </div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontSize: 11, fontFamily: C.mono, color: C.text,
            background: `${color}15`, border: `1px solid ${color}33`,
            padding: '3px 10px',
          }}>
            n = {node.count.toLocaleString()}
          </div>
          {node.forgeCapable && (
            <div style={{
              fontSize: 9, fontFamily: C.mono, color: C.forge,
              background: `${C.forge}12`, border: `1px solid ${C.forge}40`,
              padding: '3px 8px', letterSpacing: '0.1em',
            }}>
              :FORGE
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 20px' }}>
        {/* Description */}
        <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.6, margin: '0 0 18px 0', fontFamily: 'inherit' }}>
          {node.description}
        </p>

        {/* Fields */}
        <div style={{ marginBottom: 18 }}>
          <div style={{
            fontSize: 8, fontFamily: C.mono, letterSpacing: '0.18em',
            color: color, marginBottom: 8,
          }}>
            — PROPIEDADES —
          </div>
          {node.fields.map(f => (
            <div
              key={f}
              className="field-item"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 0', borderBottom: `1px solid ${C.border}`,
              }}
            >
              <ChevronRight size={9} color={color} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontFamily: C.mono, color: C.text }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Outgoing relations */}
        {outgoing.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 8, fontFamily: C.mono, letterSpacing: '0.18em', color: C.feeds, marginBottom: 8 }}>
              — SALIENTES —
            </div>
            {outgoing.map((l, i) => {
              const tgt = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id
              const tgtNode = NODES.find(n => n.id === tgt)
              return (
                <div key={i} className="field-item" style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '3px 0', fontSize: 10, fontFamily: C.mono,
                }}>
                  <span style={{ color: C.muted }}>→</span>
                  <span style={{ color: C.text }}>{l.label}</span>
                  <span style={{ color: tgtNode ? GROUP_META[tgtNode.group].color : C.muted }}>
                    {tgt}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Incoming relations */}
        {incoming.length > 0 && (
          <div>
            <div style={{ fontSize: 8, fontFamily: C.mono, letterSpacing: '0.18em', color: C.nvd, marginBottom: 8 }}>
              — ENTRANTES —
            </div>
            {incoming.map((l, i) => {
              const src = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id
              const srcNode = NODES.find(n => n.id === src)
              return (
                <div key={i} className="field-item" style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '3px 0', fontSize: 10, fontFamily: C.mono,
                }}>
                  <span style={{ color: srcNode ? GROUP_META[srcNode.group].color : C.muted }}>
                    {src}
                  </span>
                  <span style={{ color: C.text }}>{l.label}</span>
                  <span style={{ color: C.muted }}>→</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Origin footer */}
      <div style={{
        padding: '10px 20px', borderTop: `1px solid ${C.border}`,
        fontSize: 9, fontFamily: C.mono, color: C.muted,
        lineHeight: 1.5, flexShrink: 0,
      }}>
        {meta.desc}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GraphPage() {
  const fgRef      = useRef<any>(null)
  const panelRef   = useRef<HTMLDivElement>(null)
  const hudRef     = useRef<HTMLDivElement>(null)
  const titleRef   = useRef<HTMLDivElement>(null)

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [hoveredNode,  setHoveredNode]  = useState<GraphNode | null>(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })
  const [ready, setReady] = useState(false)

  // Dimensions
  useEffect(() => {
    const update = () => setDims({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // GSAP intro
  useEffect(() => {
    if (!hudRef.current || !titleRef.current) return
    const tl = gsap.timeline({ delay: 0.3 })
    tl.fromTo(hudRef.current,  { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.inOut' })
    tl.fromTo(titleRef.current,
      { opacity: 0, y: -12, filter: 'blur(4px)' },
      { opacity: 1, y: 0,   filter: 'blur(0px)', duration: 0.7, ease: 'power3.out' },
      '-=0.8'
    )
  }, [ready])

  // Cluster + charge forces — must run WHILE simulation is active, not after
  useEffect(() => {
    if (!dims.w) return
    const id = setTimeout(() => {
      const fg = fgRef.current
      if (!fg) return
      // Remove center-gravity so clusters don't collapse to origin
      fg.d3Force('center', null)

      fg.d3Force('cluster', (alpha: number) => {
        GRAPH_DATA.nodes.forEach((node: any) => {
          const target = CLUSTER[node.group as Group]
          node.vx = (node.vx ?? 0) + (target.x - (node.x ?? 0)) * alpha * 0.14
          node.vy = (node.vy ?? 0) + (target.y - (node.y ?? 0)) * alpha * 0.14
          node.vz = (node.vz ?? 0) + (target.z - (node.z ?? 0)) * alpha * 0.14
        })
      })

      // Strong repulsion + weak link spring so cross-cluster links don't pull groups together
      fg.d3Force('charge')?.strength(-1800)
      fg.d3Force('link')?.strength(0.06).distance(320)

      fg.d3ReheatSimulation()
    }, 80)
    return () => clearTimeout(id)
  }, [dims.w])

  // Node three object — glowing sphere + label
  const nodeThreeObject = useCallback((node: any) => {
    // Dynamic import at runtime to avoid SSR issues
    const THREE = require('three') as typeof import('three')
    const SpriteText = require('three-spritetext').default

    const color = GROUP_META[node.group as Group].color
    const r     = Math.sqrt(node.val) * 1.8
    const group = new THREE.Group()

    // Core sphere
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(r, 20, 20),
      new THREE.MeshPhongMaterial({
        color:   new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.25,
        shininess: 80,
        transparent: true,
        opacity: 0.92,
      })
    )
    group.add(core)

    // Glow layer 1
    const glow1 = new THREE.Mesh(
      new THREE.SphereGeometry(r * 1.45, 16, 16),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.12,
        side: THREE.BackSide,
      })
    )
    group.add(glow1)

    // Glow layer 2
    const glow2 = new THREE.Mesh(
      new THREE.SphereGeometry(r * 2.1, 12, 12),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.04,
        side: THREE.BackSide,
      })
    )
    group.add(glow2)

    // Label — depthTest off so it's never hidden behind the sphere from any angle
    const sprite = new SpriteText(node.label as string)
    sprite.color           = '#FFFFFF'
    sprite.textHeight      = Math.max(4.5, r * 0.9)
    sprite.backgroundColor = 'rgba(0,0,0,0.88)'
    sprite.padding         = 2.2
    sprite.borderWidth     = 0.35
    sprite.borderColor     = `${color}88`
    sprite.fontFace        = 'JetBrains Mono, Share Tech Mono, monospace'
    sprite.fontWeight      = '700'
    sprite.position.y      = r + 7
    sprite.renderOrder     = 999
    sprite.material.depthTest  = false
    sprite.material.depthWrite = false
    group.add(sprite)

    return group
  }, [])

  // Link label sprite
  const linkThreeObject = useCallback((link: any) => {
    const SpriteText = require('three-spritetext').default
    const sprite = new SpriteText(link.label as string)
    sprite.color = 'rgba(255,255,255,0.82)'
    sprite.textHeight = 2.4
    sprite.backgroundColor = 'rgba(0,0,0,0.62)'
    sprite.padding = 1
    sprite.fontFace = 'JetBrains Mono, Share Tech Mono, monospace'
    return sprite
  }, [])

  const linkPositionUpdate = useCallback((sprite: any, { start, end }: { start: any; end: any }) => {
    sprite.position.set(
      start.x + (end.x - start.x) / 2,
      start.y + (end.y - start.y) / 2,
      start.z + (end.z - start.z) / 2,
    )
  }, [])

  // Node click
  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node as GraphNode)

    // Zoom camera
    if (fgRef.current && node.x != null) {
      const dist      = 80
      const distRatio = 1 + dist / Math.hypot(node.x, node.y, node.z)
      fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
        node,
        900
      )
    }

    // Slide in panel
    if (panelRef.current) {
      gsap.killTweensOf(panelRef.current)
      gsap.fromTo(panelRef.current,
        { x: '100%', opacity: 0 },
        { x: '0%',   opacity: 1, duration: 0.42, ease: 'power3.out' }
      )
    }
  }, [])

  const closePanel = useCallback(() => {
    if (!panelRef.current) return
    gsap.to(panelRef.current, {
      x: '100%', opacity: 0, duration: 0.28, ease: 'power2.in',
      onComplete: () => setSelectedNode(null),
    })
    fgRef.current?.zoomToFit(1000, 120)
  }, [])

  const totalNodes = NODES.reduce((s, n) => s + n.count, 0)
  const totalRels  = LINKS.length

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, overflow: 'hidden', fontFamily: 'var(--font-inter), Inter, sans-serif' }}>

      {/* ── 3-D force graph ── */}
      {dims.w > 0 && (
        <ForceGraph3D
          ref={fgRef}
          width={dims.w}
          height={dims.h}
          graphData={GRAPH_DATA}
          backgroundColor="#000000"
          nodeLabel={() => ''}
          nodeVal={(n: any) => n.val}
          nodeThreeObject={nodeThreeObject}
          nodeThreeObjectExtend={false}
          linkColor={() => 'rgba(255,255,255,0.52)'}
          linkWidth={1.4}
          linkDirectionalArrowLength={7}
          linkDirectionalArrowRelPos={1}
          linkDirectionalArrowColor={() => '#FFFFFF'}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.004}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleColor={() => '#FFFFFF'}
          linkCurvature={0.12}
          linkThreeObject={linkThreeObject}
          linkThreeObjectExtend={true}
          linkPositionUpdate={linkPositionUpdate}
          onNodeClick={handleNodeClick}
          onNodeHover={(n: any) => setHoveredNode(n as GraphNode | null)}
          onEngineStop={() => {
            setReady(true)
            fgRef.current?.zoomToFit(1400, 120)
          }}
          showNavInfo={false}
          enableNodeDrag={true}
          d3AlphaDecay={0.014}
          d3VelocityDecay={0.28}
          rendererConfig={{ antialias: true }}
        />
      )}

      {/* ── HUD overlay ── */}
      <div ref={hudRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0 }}>

        {/* Top-left: title */}
        <div ref={titleRef} style={{ position: 'absolute', top: 20, left: 20, pointerEvents: 'auto' }}>
          <Link href="/explore-hub" style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.muted, textDecoration: 'none', marginBottom: 10, fontSize: 11, fontFamily: C.mono }}>
            <ArrowLeft size={12} />
            <span>EXPLORE DATABASE</span>
          </Link>
          <div style={{ position: 'relative', padding: '10px 14px' }}>
            <Brackets color={C.red} size={8} />
            <div style={{ fontSize: 8, fontFamily: C.mono, letterSpacing: '0.22em', color: C.red, marginBottom: 4 }}>
              SKYFALL-CTI
            </div>
            <div style={{ fontSize: 18, fontFamily: C.mono, fontWeight: 700, color: C.text, letterSpacing: '0.06em' }}>
              DATA MODEL
            </div>
            <div style={{ fontSize: 9, fontFamily: C.mono, color: C.muted, marginTop: 2 }}>
              STIX 2.1 · NEO4J GRAPH SCHEMA
            </div>
          </div>
        </div>

        {/* Top-right: legend */}
        <div style={{
          position: 'absolute', top: 20, right: selectedNode ? 390 : 20,
          display: 'flex', flexDirection: 'column', gap: 6,
          transition: 'right 0.42s cubic-bezier(0.77,0,0.18,1)',
        }}>
          {(Object.entries(GROUP_META) as [Group, typeof GROUP_META[Group]][]).map(([key, meta]) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 10px',
              background: `${meta.color}10`,
              border: `1px solid ${meta.color}30`,
              backdropFilter: 'blur(4px)',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, boxShadow: `0 0 6px ${meta.color}` }} />
              <span style={{ fontSize: 9, fontFamily: C.mono, color: meta.color, letterSpacing: '0.12em' }}>
                {meta.label}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom-left: stats */}
        <div style={{
          position: 'absolute', bottom: 20, left: 20,
          display: 'flex', gap: 16, alignItems: 'flex-end',
        }}>
          {[
            { label: 'TIPOS DE NODO', value: NODES.length },
            { label: 'TOTAL NODOS',   value: fmtCount(totalNodes) },
            { label: 'RELACIONES',    value: totalRels },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 7, fontFamily: C.mono, letterSpacing: '0.16em', color: C.muted }}>{s.label}</span>
              <span style={{ fontSize: 20, fontFamily: C.mono, fontWeight: 700, color: C.text }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Bottom-right: hover label */}
        {hoveredNode && !selectedNode && (
          <div style={{
            position: 'absolute', bottom: 20, right: 20,
            padding: '6px 12px',
            background: C.surface,
            border: `1px solid ${GROUP_META[hoveredNode.group].color}55`,
            fontFamily: C.mono,
          }}>
            <span style={{ fontSize: 12, color: GROUP_META[hoveredNode.group].color }}>
              {hoveredNode.label}
            </span>
            <span style={{ fontSize: 10, color: C.muted, marginLeft: 8 }}>
              n = {hoveredNode.count.toLocaleString()}
            </span>
          </div>
        )}

        {/* Scanlines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.06) 3px,rgba(0,0,0,0.06) 4px)',
        }} />
      </div>

      {/* ── Detail panel ── */}
      <div
        ref={panelRef}
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 0,
          width: 360,
          transform: 'translateX(100%)',
          background: 'rgba(4,4,4,0.97)',
          borderLeft: `1px solid ${selectedNode ? GROUP_META[selectedNode.group].color + '40' : C.redDim}`,
          display: 'flex', flexDirection: 'column',
          pointerEvents: 'auto',
          backdropFilter: 'blur(8px)',
        }}
      >
        {selectedNode && (
          <DetailPanel node={selectedNode} onClose={closePanel} />
        )}
      </div>

      {/* Group zone labels (floating, only while no panel) */}
      {!selectedNode && (
        <style>{`
          @keyframes pulse-glow {
            0%,100% { opacity: 0.6; }
            50%      { opacity: 1;   }
          }
          .zone-label { animation: pulse-glow 3s ease-in-out infinite; pointer-events: none; }
        `}</style>
      )}
    </div>
  )
}
