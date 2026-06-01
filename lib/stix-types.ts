// STIX 2.1 type definitions and vocabulary for the Forge UI

export interface StixTypeEntry {
  id: string;
  label: string;
  icon: string;          // lucide-react component name
  color: string;
  required: string[];
  optional: string[];
}

export interface CanvasEntity {
  uid: string;           // local canvas ID (not STIX id yet)
  stixId?: string;       // set once entity is fully defined
  type: string;          // STIX type string (e.g. "indicator")
  label: string;         // display label
  name?: string;         // entity name/value for display
  data: Record<string, unknown>;  // all STIX fields
  x: number;
  y: number;
  isExisting?: boolean;  // true if loaded from Neo4j
}

export interface CanvasRelationship {
  uid: string;
  sourceUid: string;
  targetUid: string;
  relationshipType: string;
  description?: string;
  confidence?: number;
  stixId?: string;
}

// ─── STIX Type Catalogue ────────────────────────────────────────────────────
export const STIX_TYPES: StixTypeEntry[] = [
  {
    id: "indicator",     label: "Indicator",     icon: "Target",
    color: "#E85419",
    required: ["pattern", "pattern_type", "valid_from"],
    optional: ["name", "description", "indicator_types", "valid_until", "confidence", "labels"],
  },
  {
    id: "malware",       label: "Malware",       icon: "Bug",
    color: "#FF0033",
    required: ["name", "is_family"],
    optional: ["description", "malware_types", "aliases", "kill_chain_phases", "labels", "confidence"],
  },
  {
    id: "threat-actor",  label: "Threat Actor",  icon: "UserCog",
    color: "#FF4444",
    required: ["name"],
    optional: ["description", "threat_actor_types", "aliases", "roles", "sophistication",
                "resource_level", "primary_motivation", "goals", "labels", "confidence"],
  },
  {
    id: "intrusion-set", label: "Intrusion Set", icon: "Shield",
    color: "#CC0022",
    required: ["name"],
    optional: ["description", "aliases", "first_seen", "last_seen", "goals",
                "resource_level", "primary_motivation", "secondary_motivations", "labels", "confidence"],
  },
  {
    id: "campaign",      label: "Campaign",      icon: "Flag",
    color: "#FF6600",
    required: ["name"],
    optional: ["description", "aliases", "first_seen", "last_seen", "objective", "labels", "confidence"],
  },
  {
    id: "vulnerability", label: "Vulnerability", icon: "AlertTriangle",
    color: "#FFAA00",
    required: ["name"],
    optional: ["description", "external_references", "labels", "confidence",
                "x_cvss_score", "x_epss_score", "x_vendor", "x_product"],
  },
  {
    id: "attack-pattern", label: "Technique",   icon: "Layers",
    color: "#9933FF",
    required: ["name"],
    optional: ["description", "external_references", "kill_chain_phases", "x_mitre_id", "labels"],
  },
  {
    id: "tool",          label: "Tool",          icon: "Wrench",
    color: "#3366FF",
    required: ["name"],
    optional: ["description", "tool_types", "aliases", "tool_version", "labels", "confidence"],
  },
  {
    id: "infrastructure", label: "Infrastructure", icon: "Server",
    color: "#0099FF",
    required: ["name", "infrastructure_types"],
    optional: ["description", "aliases", "first_seen", "last_seen", "labels", "confidence"],
  },
  {
    id: "location",      label: "Location",      icon: "MapPin",
    color: "#00CC66",
    required: ["name"],
    optional: ["description", "country", "country_code", "city", "latitude", "longitude",
                "administrative_area", "region", "labels"],
  },
  {
    id: "identity",      label: "Identity",      icon: "Users",
    color: "#00AAAA",
    required: ["name", "identity_class"],
    optional: ["description", "sectors", "contact_information", "labels", "confidence"],
  },
  {
    id: "report",        label: "Report",        icon: "FileText",
    color: "#888888",
    required: ["name", "published", "object_refs"],
    optional: ["description", "report_types", "labels", "confidence"],
  },
  {
    id: "sighting",      label: "Sighting",      icon: "Eye",
    color: "#FFCC00",
    required: ["sighting_of_ref"],
    optional: ["description", "first_seen", "last_seen", "count", "where_sighted_refs",
                "summary", "confidence"],
  },
  {
    id: "software",      label: "Software",      icon: "Code",
    color: "#66AAFF",
    required: ["name"],
    optional: ["description", "cpe", "swid", "languages", "vendor", "version", "labels"],
  },
  {
    id: "x509-certificate", label: "Certificate", icon: "Award",
    color: "#AADDFF",
    required: ["hashes"],
    optional: ["issuer", "subject", "serial_number", "validity_not_before",
                "validity_not_after", "subject_public_key_algorithm", "labels"],
  },
  {
    id: "ipv4-addr",     label: "IPv4 Address",  icon: "Wifi",
    color: "#00FF88",
    required: ["value"],
    optional: ["country_code", "city", "asn", "labels"],
  },
  {
    id: "domain-name",   label: "Domain",        icon: "Globe2",
    color: "#00DDAA",
    required: ["value"],
    optional: ["labels"],
  },
  {
    id: "url",           label: "URL",           icon: "LinkIcon",
    color: "#88DDFF",
    required: ["value"],
    optional: ["labels"],
  },
];

// ─── SRO Matrix ─────────────────────────────────────────────────────────────
// Maps source STIX type → target STIX type → array of valid relationship_types
export const SRO_MATRIX: Record<string, Record<string, string[]>> = {
  "indicator": {
    "malware":        ["indicates"],
    "attack-pattern": ["indicates"],
    "threat-actor":   ["indicates", "attributed-to"],
    "intrusion-set":  ["indicates", "attributed-to"],
    "campaign":       ["indicates"],
    "tool":           ["indicates"],
    "vulnerability":  ["indicates", "targets"],
    "infrastructure": ["indicates"],
    "*":              ["related-to"],
  },
  "malware": {
    "attack-pattern": ["uses"],
    "tool":           ["uses", "drops"],
    "malware":        ["uses", "drops", "variant-of"],
    "vulnerability":  ["exploits", "targets"],
    "identity":       ["targets"],
    "location":       ["targets", "originates-from"],
    "infrastructure": ["uses", "communicates-with", "hosted-on"],
    "*":              ["related-to"],
  },
  "threat-actor": {
    "attack-pattern": ["uses"],
    "malware":        ["uses"],
    "tool":           ["uses"],
    "identity":       ["targets", "attributed-to", "impersonates"],
    "location":       ["targets", "originates-from", "located-at"],
    "vulnerability":  ["targets", "exploits"],
    "infrastructure": ["uses", "owns"],
    "campaign":       ["attributed-to"],
    "*":              ["related-to"],
  },
  "intrusion-set": {
    "attack-pattern": ["uses"],
    "malware":        ["uses"],
    "tool":           ["uses"],
    "identity":       ["targets"],
    "location":       ["targets", "originates-from"],
    "vulnerability":  ["targets", "exploits"],
    "infrastructure": ["uses", "owns"],
    "campaign":       ["attributed-to"],
    "threat-actor":   ["attributed-to"],
    "*":              ["related-to"],
  },
  "campaign": {
    "attack-pattern": ["uses"],
    "malware":        ["uses"],
    "tool":           ["uses"],
    "identity":       ["targets"],
    "location":       ["targets", "originates-from"],
    "vulnerability":  ["targets", "exploits"],
    "infrastructure": ["uses"],
    "*":              ["related-to"],
  },
  "attack-pattern": {
    "identity":         ["targets"],
    "location":         ["targets"],
    "vulnerability":    ["targets"],
    "course-of-action": ["mitigated-by"],
    "*":                ["related-to"],
  },
  "tool": {
    "identity":       ["targets"],
    "location":       ["targets"],
    "vulnerability":  ["targets", "has"],
    "infrastructure": ["uses"],
    "*":              ["related-to"],
  },
  "vulnerability": {
    "software":       ["targets"],
    "identity":       ["targets"],
    "attack-pattern": ["related-to"],
    "*":              ["related-to"],
  },
  "course-of-action": {
    "attack-pattern": ["mitigates"],
    "malware":        ["mitigates"],
    "tool":           ["mitigates"],
    "vulnerability":  ["mitigates"],
    "*":              ["related-to"],
  },
  "infrastructure": {
    "location":       ["located-at"],
    "infrastructure": ["consists-of", "communicates-with"],
    "*":              ["related-to"],
  },
  "identity": {
    "location":       ["located-at"],
    "identity":       ["part-of", "related-to"],
    "*":              ["related-to"],
  },
  // IoC / observable types as source
  "ipv4-addr": {
    "malware":        ["indicates"],
    "indicator":      ["indicates"],
    "infrastructure": ["hosted-on", "communicates-with"],
    "location":       ["originates-from", "located-at"],
    "campaign":       ["part-of"],
    "*":              ["related-to", "indicates", "communicates-with"],
  },
  "ipv6-addr": {
    "malware":        ["indicates"],
    "infrastructure": ["hosted-on", "communicates-with"],
    "location":       ["originates-from"],
    "*":              ["related-to", "indicates"],
  },
  "domain-name": {
    "malware":        ["indicates"],
    "indicator":      ["indicates"],
    "infrastructure": ["hosted-on"],
    "location":       ["originates-from"],
    "*":              ["related-to", "indicates"],
  },
  "url": {
    "malware":        ["indicates"],
    "vulnerability":  ["exploits"],
    "*":              ["related-to", "indicates"],
  },
  "file": {
    "malware":        ["indicates", "drops"],
    "tool":           ["indicates"],
    "*":              ["related-to", "indicates"],
  },
  "x509-certificate": {
    "infrastructure": ["used-by"],
    "*":              ["related-to"],
  },
};

// All well-known STIX relationship types — used as full fallback list
export const ALL_RELATIONSHIP_TYPES = [
  "related-to",
  "indicates",
  "targets",
  "uses",
  "attributed-to",
  "exploits",
  "mitigates",
  "impersonates",
  "part-of",
  "communicates-with",
  "consists-of",
  "located-at",
  "originates-from",
  "drops",
  "downloads",
  "variant-of",
  "characterizes",
  "analysis-of",
  "static-analysis-of",
  "dynamic-analysis-of",
  "has",
  "hosted-on",
  "owns",
  "controls",
  "derived-from",
  "sighting-of",
  "observed-in",
  "delivers",
  "compromises",
  "authored-by",
] as const;

/** Returns valid relationship_types for a src→tgt pair.
 *  Falls back to ALL_RELATIONSHIP_TYPES when no specific entry exists. */
export function getRelationships(srcType: string, tgtType: string): string[] {
  const srcMap   = SRO_MATRIX[srcType];
  if (!srcMap) {
    // Unknown source type — return full vocab so user can pick anything
    return [...ALL_RELATIONSHIP_TYPES];
  }
  const specific = srcMap[tgtType];
  const wildcard = srcMap["*"];

  // Specific pair defined → use it (+ always include related-to)
  if (specific) {
    const result = [...specific];
    if (!result.includes("related-to")) result.push("related-to");
    return result;
  }

  // Wildcard defined but it's only ["related-to"] → also offer full vocab
  if (!wildcard || (wildcard.length === 1 && wildcard[0] === "related-to")) {
    return [...ALL_RELATIONSHIP_TYPES];
  }

  const result = [...wildcard];
  if (!result.includes("related-to")) result.push("related-to");
  return result;
}

// ─── STIX Enumerations (open vocab) ─────────────────────────────────────────
export const STIX_ENUMS: Record<string, string[]> = {
  indicator_types: [
    "anomalous-activity", "anonymization", "benign", "compromised",
    "malicious-activity", "attribution", "unknown",
  ],
  malware_types: [
    "adware", "backdoor", "bot", "bootkit", "ddos", "downloader", "dropper",
    "exploit-kit", "keylogger", "ransomware", "remote-access-trojan",
    "resource-exploitation", "rogue-security-software", "rootkit", "screen-capture",
    "spyware", "trojan", "unknown", "virus", "webshell", "wiper", "worm",
  ],
  threat_actor_types: [
    "activist", "competitor", "crime-syndicate", "criminal", "hacker",
    "insider-accidental", "insider-disgruntled", "nation-state", "sensationalist",
    "spy", "terrorist", "unknown",
  ],
  sophistication: [
    "none", "minimal", "intermediate", "advanced", "expert", "innovator",
    "strategic",
  ],
  resource_level: [
    "individual", "club", "contest", "team", "organization", "government",
  ],
  identity_class: [
    "individual", "group", "system", "organization", "class", "unknown",
  ],
  infrastructure_types: [
    "amplification", "anonymization", "botnet", "command-and-control",
    "exfiltration", "hosting-malware", "hosting-target-lists",
    "phishing", "reconnaissance", "staging", "unknown",
  ],
  tool_types: [
    "denial-of-service", "exploitation", "information-gathering",
    "network-capture", "credential-exploitation", "remote-access",
    "vulnerability-scanning", "unknown",
  ],
  report_types: [
    "threat-report", "attack-pattern", "campaign", "identity", "indicator",
    "intrusion-set", "malware", "observed-data", "threat-actor", "tool",
    "vulnerability",
  ],
  pattern_type: ["stix", "pcre", "sigma", "snort", "suricata", "yara"],
};

// ─── Indicator Observable Types ─────────────────────────────────────────────
export const INDICATOR_OBSERVABLE_TYPES = [
  { id: "ipv4-addr",            label: "IPv4 Address",    placeholder: "1.2.3.4" },
  { id: "ipv6-addr",            label: "IPv6 Address",    placeholder: "2001:db8::1" },
  { id: "domain-name",          label: "Domain",          placeholder: "evil.example.com" },
  { id: "url",                  label: "URL",             placeholder: "https://evil.example.com/path" },
  { id: "email-addr",           label: "Email",           placeholder: "attacker@example.com" },
  { id: "file:hashes.MD5",      label: "File MD5",        placeholder: "d41d8cd98f00b204e9800998ecf8427e" },
  { id: "file:hashes.SHA-1",    label: "File SHA-1",      placeholder: "da39a3ee5e6b4b0d3255bfef95601890afd80709" },
  { id: "file:hashes.SHA-256",  label: "File SHA-256",    placeholder: "e3b0c44298fc1c149afbf4c8996fb924..." },
  { id: "x509-certificate",     label: "Certificate",     placeholder: "SHA-1 fingerprint" },
  { id: "cryptocurrency-wallet", label: "Crypto Wallet",  placeholder: "1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf" },
] as const;

/** Builds a canonical STIX indicator pattern string */
export function buildPattern(obsType: string, value: string): string {
  if (obsType.startsWith("file:hashes.")) {
    const hashAlgo = obsType.replace("file:hashes.", "");
    return `[file:hashes.'${hashAlgo}' = '${value}']`;
  }
  if (obsType === "x509-certificate") {
    return `[x509-certificate:hashes.'SHA-1' = '${value}']`;
  }
  return `[${obsType}:value = '${value}']`;
}

/** Returns the STIX type entry by id */
export function getStixType(id: string): StixTypeEntry | undefined {
  return STIX_TYPES.find((t) => t.id === id);
}

// ─── Legacy types used by GraphExplorer / IntelligenceSidebar ───────────────
export type StixNodeType =
  | "malware" | "indicator" | "intrusion-set" | "campaign"
  | "tool" | "attack-pattern" | "infrastructure" | "identity";

export interface IntelOwlEnrichment {
  score: number;
  verdict: "malicious" | "suspicious" | "benign";
  tags: string[];
  providers: string[];
}

export interface StixNode {
  id: string;
  type: StixNodeType;
  name: string;
  confidence: number;
  created: string;
  modified: string;
  created_by_ref: string;
  labels: string[];
  first_seen?: string;
  last_seen?: string;
  intelowl?: IntelOwlEnrichment;
  raw: Record<string, unknown>;
}

export interface StixLink {
  source: string;
  target: string;
  relationship_type: string;
}

export interface StixGraphData {
  nodes: StixNode[];
  links: StixLink[];
}
