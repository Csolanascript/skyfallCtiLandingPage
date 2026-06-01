// STIX 2.1 types, static ATT&CK/CWE catalog, and bundle builder for the Forge demo.
// No database or API calls — all data is embedded here.

export interface StixTypeEntry {
  id: string;
  label: string;
  icon: string;
  color: string;
  required: string[];
  optional: string[];
}

export interface CanvasEntity {
  uid: string;
  type: string;
  label: string;
  name?: string;
  data: Record<string, unknown>;
  x: number;
  y: number;
}

export interface CanvasRelationship {
  uid: string;
  sourceUid: string;
  targetUid: string;
  relationshipType: string;
  description?: string;
  confidence?: number;
}

// ─── STIX Type Catalogue ─────────────────────────────────────────────────────
export const STIX_TYPES: StixTypeEntry[] = [
  {
    id: "indicator", label: "Indicator", icon: "Target", color: "#E85419",
    required: ["pattern", "pattern_type", "valid_from"],
    optional: ["name", "description", "indicator_types", "valid_until", "confidence", "labels"],
  },
  {
    id: "malware", label: "Malware", icon: "Bug", color: "#FF0033",
    required: ["name", "is_family"],
    optional: ["description", "malware_types", "aliases", "labels", "confidence"],
  },
  {
    id: "threat-actor", label: "Threat Actor", icon: "UserCog", color: "#FF4444",
    required: ["name"],
    optional: ["description", "threat_actor_types", "aliases", "sophistication", "resource_level", "primary_motivation", "goals", "labels", "confidence"],
  },
  {
    id: "intrusion-set", label: "Intrusion Set", icon: "Shield", color: "#CC0022",
    required: ["name"],
    optional: ["description", "aliases", "first_seen", "last_seen", "goals", "resource_level", "primary_motivation", "labels", "confidence"],
  },
  {
    id: "campaign", label: "Campaign", icon: "Flag", color: "#FF6600",
    required: ["name"],
    optional: ["description", "aliases", "first_seen", "last_seen", "objective", "labels", "confidence"],
  },
  {
    id: "vulnerability", label: "Vulnerability", icon: "AlertTriangle", color: "#FFAA00",
    required: ["name"],
    optional: ["description", "labels", "confidence", "x_cvss_score", "x_epss_score", "x_vendor", "x_product"],
  },
  {
    id: "attack-pattern", label: "Technique", icon: "Layers", color: "#9933FF",
    required: ["name"],
    optional: ["description", "x_mitre_id", "labels"],
  },
  {
    id: "tool", label: "Tool", icon: "Wrench", color: "#3366FF",
    required: ["name"],
    optional: ["description", "tool_types", "aliases", "tool_version", "labels", "confidence"],
  },
  {
    id: "infrastructure", label: "Infrastructure", icon: "Server", color: "#0099FF",
    required: ["name", "infrastructure_types"],
    optional: ["description", "aliases", "first_seen", "last_seen", "labels", "confidence"],
  },
  {
    id: "location", label: "Location", icon: "MapPin", color: "#00CC66",
    required: ["name"],
    optional: ["description", "country", "country_code", "city", "latitude", "longitude", "region", "labels"],
  },
  {
    id: "identity", label: "Identity", icon: "Users", color: "#00AAAA",
    required: ["name", "identity_class"],
    optional: ["description", "sectors", "contact_information", "labels", "confidence"],
  },
  {
    id: "report", label: "Report", icon: "FileText", color: "#888888",
    required: ["name", "published"],
    optional: ["description", "report_types", "labels", "confidence"],
  },
  {
    id: "sighting", label: "Sighting", icon: "Eye", color: "#FFCC00",
    required: ["sighting_of_ref"],
    optional: ["description", "first_seen", "last_seen", "count", "confidence"],
  },
  {
    id: "software", label: "Software", icon: "Code", color: "#66AAFF",
    required: ["name"],
    optional: ["description", "vendor", "version", "cpe", "labels"],
  },
  {
    id: "ipv4-addr", label: "IPv4 Address", icon: "Wifi", color: "#00FF88",
    required: ["value"],
    optional: ["labels"],
  },
  {
    id: "domain-name", label: "Domain", icon: "Globe2", color: "#00DDAA",
    required: ["value"],
    optional: ["labels"],
  },
  {
    id: "url", label: "URL", icon: "LinkIcon", color: "#88DDFF",
    required: ["value"],
    optional: ["labels"],
  },
];

export function getStixType(id: string): StixTypeEntry | undefined {
  return STIX_TYPES.find((t) => t.id === id);
}

// ─── SRO Matrix ─────────────────────────────────────────────────────────────
const SRO_MATRIX: Record<string, Record<string, string[]>> = {
  "indicator": {
    "malware": ["indicates"],
    "attack-pattern": ["indicates"],
    "threat-actor": ["indicates", "attributed-to"],
    "intrusion-set": ["indicates", "attributed-to"],
    "campaign": ["indicates"],
    "tool": ["indicates"],
    "vulnerability": ["indicates", "targets"],
    "infrastructure": ["indicates"],
    "*": ["related-to"],
  },
  "malware": {
    "attack-pattern": ["uses"],
    "tool": ["uses", "drops"],
    "malware": ["uses", "drops", "variant-of"],
    "vulnerability": ["exploits", "targets"],
    "identity": ["targets"],
    "location": ["targets", "originates-from"],
    "infrastructure": ["uses", "communicates-with", "hosted-on"],
    "*": ["related-to"],
  },
  "threat-actor": {
    "attack-pattern": ["uses"],
    "malware": ["uses"],
    "tool": ["uses"],
    "identity": ["targets", "attributed-to", "impersonates"],
    "location": ["targets", "originates-from", "located-at"],
    "vulnerability": ["targets", "exploits"],
    "infrastructure": ["uses", "owns"],
    "campaign": ["attributed-to"],
    "*": ["related-to"],
  },
  "intrusion-set": {
    "attack-pattern": ["uses"],
    "malware": ["uses"],
    "tool": ["uses"],
    "identity": ["targets"],
    "location": ["targets", "originates-from"],
    "vulnerability": ["targets", "exploits"],
    "infrastructure": ["uses", "owns"],
    "campaign": ["attributed-to"],
    "threat-actor": ["attributed-to"],
    "*": ["related-to"],
  },
  "campaign": {
    "attack-pattern": ["uses"],
    "malware": ["uses"],
    "tool": ["uses"],
    "identity": ["targets"],
    "location": ["targets", "originates-from"],
    "vulnerability": ["targets", "exploits"],
    "infrastructure": ["uses"],
    "intrusion-set": ["attributed-to"],
    "threat-actor": ["attributed-to"],
    "*": ["related-to"],
  },
  "vulnerability": {
    "software": ["targets"],
    "infrastructure": ["targets"],
    "*": ["related-to"],
  },
  "tool": {
    "attack-pattern": ["uses"],
    "infrastructure": ["uses", "hosted-on"],
    "vulnerability": ["has"],
    "*": ["related-to"],
  },
  "infrastructure": {
    "location": ["located-at"],
    "domain-name": ["consists-of"],
    "ipv4-addr": ["consists-of"],
    "url": ["consists-of"],
    "*": ["related-to"],
  },
  "identity": {
    "location": ["located-at"],
    "*": ["related-to"],
  },
  "sighting": {
    "indicator": ["sighting-of"],
    "*": ["related-to"],
  },
  "report": {
    "*": ["related-to"],
  },
};

export function getRelationships(srcType: string, tgtType: string): string[] {
  const srcMap = SRO_MATRIX[srcType];
  if (!srcMap) return ["related-to"];
  return srcMap[tgtType] ?? srcMap["*"] ?? ["related-to"];
}

// ─── STIX Enums ──────────────────────────────────────────────────────────────
export const STIX_ENUMS: Record<string, string[]> = {
  indicator_types: [
    "anomalous-activity", "anonymization", "benign", "compromised",
    "malicious-activity", "attribution", "unknown",
  ],
  malware_types: [
    "adware", "backdoor", "bot", "bootkit", "ddos", "downloader", "dropper",
    "exploit-kit", "keylogger", "ransomware", "remote-access-trojan",
    "rootkit", "screen-capture", "spyware", "trojan", "unknown",
    "webshell", "wiper", "worm",
  ],
  threat_actor_types: [
    "activist", "competitor", "crime-syndicate", "criminal", "hacker",
    "insider-accidental", "insider-disgruntled", "nation-state",
    "sensationalist", "spy", "terrorist", "unknown",
  ],
  sophistication: ["none", "minimal", "intermediate", "advanced", "expert", "innovator", "strategic"],
  resource_level: ["individual", "club", "contest", "team", "organization", "government"],
  identity_class: ["individual", "group", "system", "organization", "class", "unknown"],
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
    "intrusion-set", "malware", "observed-data", "threat-actor", "tool", "vulnerability",
  ],
  pattern_type: ["stix", "pcre", "sigma", "snort", "suricata", "yara"],
};

// ─── Indicator observable types ──────────────────────────────────────────────
export const OBSERVABLE_TYPES = [
  { id: "ipv4-addr", label: "IPv4 Address", placeholder: "1.2.3.4" },
  { id: "ipv6-addr", label: "IPv6 Address", placeholder: "2001:db8::1" },
  { id: "domain-name", label: "Domain", placeholder: "evil.example.com" },
  { id: "url", label: "URL", placeholder: "https://evil.example.com/path" },
  { id: "email-addr", label: "Email", placeholder: "attacker@example.com" },
  { id: "file:hashes.MD5", label: "File MD5", placeholder: "d41d8cd98f00b204e9800998ecf8427e" },
  { id: "file:hashes.SHA-256", label: "File SHA-256", placeholder: "e3b0c44298fc1c149afbf4c8996fb924..." },
  { id: "cryptocurrency-wallet", label: "Crypto Wallet", placeholder: "1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf" },
] as const;

export function buildPattern(obsType: string, value: string): string {
  if (obsType.startsWith("file:hashes.")) {
    const algo = obsType.replace("file:hashes.", "");
    return `[file:hashes.'${algo}' = '${value}']`;
  }
  return `[${obsType}:value = '${value}']`;
}

// ─── Static ATT&CK Catalog ───────────────────────────────────────────────────
export interface TechniqueEntry {
  external_id: string;
  name: string;
  description: string;
}

export const ATTACK_CATALOG: TechniqueEntry[] = [
  { external_id: "T1059",     name: "Command and Scripting Interpreter",          description: "Adversaries may abuse command and script interpreters to execute commands, scripts, or binaries." },
  { external_id: "T1059.001", name: "PowerShell",                                  description: "Adversaries may abuse PowerShell commands and scripts for execution." },
  { external_id: "T1059.002", name: "AppleScript",                                 description: "Adversaries may abuse AppleScript for execution." },
  { external_id: "T1059.003", name: "Windows Command Shell",                       description: "Adversaries may abuse the Windows command shell for execution." },
  { external_id: "T1059.004", name: "Unix Shell",                                  description: "Adversaries may abuse Unix shell commands and scripts for execution." },
  { external_id: "T1059.006", name: "Python",                                      description: "Adversaries may abuse Python commands and scripts for execution." },
  { external_id: "T1059.007", name: "JavaScript",                                  description: "Adversaries may abuse various implementations of JavaScript for execution." },
  { external_id: "T1078",     name: "Valid Accounts",                              description: "Adversaries may obtain and abuse credentials of existing accounts." },
  { external_id: "T1078.001", name: "Default Accounts",                            description: "Adversaries may obtain and abuse credentials of a default account." },
  { external_id: "T1078.002", name: "Domain Accounts",                             description: "Adversaries may obtain and abuse credentials of a domain account." },
  { external_id: "T1078.003", name: "Local Accounts",                              description: "Adversaries may obtain and abuse credentials of a local account." },
  { external_id: "T1566",     name: "Phishing",                                    description: "Adversaries may send phishing messages to gain access to victim systems." },
  { external_id: "T1566.001", name: "Spearphishing Attachment",                    description: "Adversaries may send spearphishing emails with a malicious attachment." },
  { external_id: "T1566.002", name: "Spearphishing Link",                          description: "Adversaries may send spearphishing emails with a malicious link." },
  { external_id: "T1566.003", name: "Spearphishing via Service",                   description: "Adversaries may send spearphishing messages via third-party services." },
  { external_id: "T1486",     name: "Data Encrypted for Impact",                   description: "Adversaries may encrypt data on target systems or on large numbers of systems in a network to interrupt availability." },
  { external_id: "T1071",     name: "Application Layer Protocol",                  description: "Adversaries may communicate using OSI application layer protocols to avoid detection." },
  { external_id: "T1071.001", name: "Web Protocols",                               description: "Adversaries may communicate using application layer protocols associated with web traffic (HTTP/S)." },
  { external_id: "T1071.004", name: "DNS",                                         description: "Adversaries may communicate using the Domain Name System (DNS) application layer protocol." },
  { external_id: "T1190",     name: "Exploit Public-Facing Application",           description: "Adversaries may attempt to take advantage of a weakness in an Internet-facing host or system." },
  { external_id: "T1133",     name: "External Remote Services",                    description: "Adversaries may leverage external-facing remote services to initially access and persist within a network." },
  { external_id: "T1110",     name: "Brute Force",                                 description: "Adversaries may use brute force techniques to gain access to accounts." },
  { external_id: "T1110.001", name: "Password Guessing",                           description: "Adversaries may systematically guess passwords to gain access." },
  { external_id: "T1110.003", name: "Password Spraying",                           description: "Adversaries may use a single or small list of commonly used passwords against many different accounts." },
  { external_id: "T1021",     name: "Remote Services",                             description: "Adversaries may use valid accounts to log into a service specifically designed to accept remote connections." },
  { external_id: "T1021.001", name: "Remote Desktop Protocol",                     description: "Adversaries may use Valid Accounts to log into a computer using the Remote Desktop Protocol." },
  { external_id: "T1021.002", name: "SMB/Windows Admin Shares",                   description: "Adversaries may use Valid Accounts to interact with a remote network share using Server Message Block (SMB)." },
  { external_id: "T1055",     name: "Process Injection",                           description: "Adversaries may inject code into processes in order to evade process-based defenses." },
  { external_id: "T1055.001", name: "Dynamic-link Library Injection",              description: "Adversaries may inject malicious code into processes via dynamic-link libraries (DLLs)." },
  { external_id: "T1055.012", name: "Process Hollowing",                           description: "Adversaries may inject malicious code into suspended and hollowed processes." },
  { external_id: "T1082",     name: "System Information Discovery",                description: "An adversary may attempt to get detailed information about the operating system and hardware." },
  { external_id: "T1083",     name: "File and Directory Discovery",                description: "Adversaries may enumerate files and directories or may search in specific locations of a host." },
  { external_id: "T1040",     name: "Network Sniffing",                            description: "Adversaries may sniff network traffic to capture information about an environment." },
  { external_id: "T1041",     name: "Exfiltration Over C2 Channel",               description: "Adversaries may steal data by exfiltrating it over an existing command and control channel." },
  { external_id: "T1048",     name: "Exfiltration Over Alternative Protocol",      description: "Adversaries may steal data by exfiltrating it over a different protocol than that used for command and control." },
  { external_id: "T1048.003", name: "Exfiltration Over Unencrypted Protocol",      description: "Adversaries may steal data by exfiltrating it over an unencrypted network protocol." },
  { external_id: "T1560",     name: "Archive Collected Data",                      description: "An adversary may compress and/or encrypt data that is collected prior to exfiltration." },
  { external_id: "T1560.001", name: "Archive via Utility",                         description: "Adversaries may use utilities such as 7-Zip, WinRAR, and WinZip to package and compress data before exfiltration." },
  { external_id: "T1547",     name: "Boot or Logon Autostart Execution",           description: "Adversaries may configure system settings to automatically execute a program during system boot or logon." },
  { external_id: "T1547.001", name: "Registry Run Keys / Startup Folder",          description: "Adversaries may achieve persistence by adding a program to a startup folder or referencing it with a Registry run key." },
  { external_id: "T1053",     name: "Scheduled Task/Job",                          description: "Adversaries may abuse task scheduling functionality to facilitate initial or recurring execution of malicious code." },
  { external_id: "T1053.005", name: "Scheduled Task",                              description: "Adversaries may abuse the Windows Task Scheduler to perform task scheduling for initial or recurring execution of malicious code." },
  { external_id: "T1203",     name: "Exploitation for Client Execution",           description: "Adversaries may exploit software vulnerabilities in client applications to execute code." },
  { external_id: "T1204",     name: "User Execution",                              description: "An adversary may rely upon specific actions by a user in order to gain execution." },
  { external_id: "T1204.001", name: "Malicious Link",                              description: "An adversary may rely upon a user clicking a malicious link in order to gain execution." },
  { external_id: "T1204.002", name: "Malicious File",                              description: "An adversary may rely upon a user opening a malicious file in order to gain execution." },
  { external_id: "T1218",     name: "System Binary Proxy Execution",               description: "Adversaries may bypass process and/or signature-based defenses by proxying execution of malicious content." },
  { external_id: "T1218.011", name: "Rundll32",                                    description: "Adversaries may abuse rundll32.exe to proxy execution of malicious code." },
  { external_id: "T1136",     name: "Create Account",                              description: "Adversaries may create an account to maintain access to victim systems." },
  { external_id: "T1136.001", name: "Local Account",                               description: "Adversaries may create a local account to maintain access to victim systems." },
  { external_id: "T1136.002", name: "Domain Account",                              description: "Adversaries may create a domain account to maintain access to victim systems." },
  { external_id: "T1098",     name: "Account Manipulation",                        description: "Adversaries may manipulate accounts to maintain access to victim systems." },
  { external_id: "T1489",     name: "Service Stop",                                description: "Adversaries may stop or disable services on a system to render those services unavailable." },
  { external_id: "T1490",     name: "Inhibit System Recovery",                     description: "Adversaries may delete or remove built-in data and turn off services designed to aid in the recovery of a corrupted system." },
  { external_id: "T1485",     name: "Data Destruction",                            description: "Adversaries may destroy data and files on specific systems or in large numbers on a network." },
  { external_id: "T1003",     name: "OS Credential Dumping",                       description: "Adversaries may attempt to dump credentials to obtain account login and credential material." },
  { external_id: "T1003.001", name: "LSASS Memory",                                description: "Adversaries may attempt to access credential material stored in the process memory of the Local Security Authority Subsystem Service (LSASS)." },
  { external_id: "T1003.003", name: "NTDS",                                        description: "Adversaries may attempt to access or create a copy of the Active Directory domain database." },
  { external_id: "T1046",     name: "Network Service Discovery",                   description: "Adversaries may attempt to get a listing of services running on remote hosts." },
  { external_id: "T1018",     name: "Remote System Discovery",                     description: "Adversaries may attempt to get a listing of other systems by IP address, hostname, or other logical identifier." },
  { external_id: "T1057",     name: "Process Discovery",                           description: "Adversaries may attempt to get information about running processes on a system." },
  { external_id: "T1069",     name: "Permission Groups Discovery",                 description: "Adversaries may attempt to find group and permission settings." },
  { external_id: "T1518",     name: "Software Discovery",                          description: "Adversaries may attempt to get a listing of software and software versions that are installed on a system." },
  { external_id: "T1518.001", name: "Security Software Discovery",                 description: "Adversaries may attempt to get a listing of security software, configurations, defensive tools, and sensors." },
  { external_id: "T1036",     name: "Masquerading",                                description: "Adversaries may attempt to manipulate features of their artifacts to make them appear legitimate." },
  { external_id: "T1027",     name: "Obfuscated Files or Information",             description: "Adversaries may attempt to make an executable or file difficult to discover or analyze by encrypting, encoding, or otherwise obfuscating its contents." },
  { external_id: "T1027.002", name: "Software Packing",                            description: "Adversaries may perform software packing to conceal their code." },
  { external_id: "T1112",     name: "Modify Registry",                             description: "Adversaries may interact with the Windows Registry to hide configuration information within Registry keys." },
  { external_id: "T1562",     name: "Impair Defenses",                             description: "Adversaries may maliciously modify components of a victim environment in order to hinder or disable defensive mechanisms." },
  { external_id: "T1562.001", name: "Disable or Modify Tools",                     description: "Adversaries may modify and/or disable security tools to avoid possible detection of their malware/tools and activities." },
  { external_id: "T1562.002", name: "Disable Windows Event Logging",               description: "Adversaries may disable Windows event logging to limit the data that is logged." },
  { external_id: "T1543",     name: "Create or Modify System Process",             description: "Adversaries may create or modify system-level processes to repeatedly execute malicious payloads." },
  { external_id: "T1543.003", name: "Windows Service",                             description: "Adversaries may create or modify Windows services to repeatedly execute malicious payloads." },
  { external_id: "T1574",     name: "Hijack Execution Flow",                       description: "Adversaries may execute their own malicious payloads by hijacking the way operating systems run programs." },
  { external_id: "T1574.001", name: "DLL Search Order Hijacking",                  description: "Adversaries may execute their own malicious payloads by hijacking the search order used to load DLLs." },
  { external_id: "T1195",     name: "Supply Chain Compromise",                     description: "Adversaries may manipulate products or product delivery mechanisms prior to receipt by a final consumer." },
  { external_id: "T1195.002", name: "Compromise Software Supply Chain",            description: "Adversaries may manipulate application software prior to receipt by a final consumer." },
  { external_id: "T1529",     name: "System Shutdown/Reboot",                      description: "Adversaries may shutdown/reboot systems to interrupt access to, or aid in the destruction of, those systems." },
  { external_id: "T1531",     name: "Account Access Removal",                      description: "Adversaries may interrupt availability of system and network resources by inhibiting access to accounts utilized by legitimate users." },
  { external_id: "T1070",     name: "Indicator Removal",                           description: "Adversaries may delete or modify artifacts generated within systems to remove evidence of their presence." },
  { external_id: "T1070.001", name: "Clear Windows Event Logs",                    description: "Adversaries may clear Windows Event Logs to hide the activity of an intrusion." },
  { external_id: "T1070.004", name: "File Deletion",                               description: "Adversaries may delete files left behind by the actions of their intrusion activity." },
  { external_id: "T1105",     name: "Ingress Tool Transfer",                       description: "Adversaries may transfer tools or other files from an external system into a compromised environment." },
  { external_id: "T1114",     name: "Email Collection",                            description: "Adversaries may target user email to collect sensitive information." },
  { external_id: "T1113",     name: "Screen Capture",                              description: "Adversaries may attempt to take screen captures of the desktop to gather information over the course of an operation." },
  { external_id: "T1115",     name: "Clipboard Data",                              description: "Adversaries may collect data stored in the clipboard from users copying information within or between applications." },
  { external_id: "T1561",     name: "Disk Wipe",                                   description: "Adversaries may wipe or corrupt raw disk data on specific systems or in large numbers in a network to interrupt availability." },
];

// ─── Static CWE Catalog ──────────────────────────────────────────────────────
export const CWE_CATALOG: TechniqueEntry[] = [
  { external_id: "CWE-79",  name: "Cross-Site Scripting (XSS)",                    description: "The software does not neutralize or incorrectly neutralizes user-controllable input before it is placed in output." },
  { external_id: "CWE-89",  name: "SQL Injection",                                 description: "The software constructs all or part of an SQL command using externally-influenced input from an upstream component." },
  { external_id: "CWE-94",  name: "Code Injection",                                description: "The software constructs all or part of a code segment using externally-influenced input from an upstream component." },
  { external_id: "CWE-22",  name: "Path Traversal",                                description: "The software uses external input to construct a pathname but does not neutralize sequences that can resolve to a location outside the intended directory." },
  { external_id: "CWE-78",  name: "OS Command Injection",                          description: "The software constructs all or part of an OS command using externally-influenced input from an upstream component." },
  { external_id: "CWE-287", name: "Improper Authentication",                       description: "When an actor claims to have a given identity, the software does not prove or insufficiently proves that the claim is correct." },
  { external_id: "CWE-306", name: "Missing Authentication for Critical Function",  description: "The software does not perform any authentication for functionality that requires a provable user identity." },
  { external_id: "CWE-862", name: "Missing Authorization",                         description: "The software does not perform an authorization check when an actor attempts to access a resource or perform an action." },
  { external_id: "CWE-476", name: "NULL Pointer Dereference",                      description: "A NULL pointer dereference occurs when the application dereferences a pointer that it expects to be valid but is NULL." },
  { external_id: "CWE-119", name: "Buffer Overflow",                               description: "The software performs operations on a memory buffer, but it reads from or writes to a memory location outside of the intended boundary." },
  { external_id: "CWE-125", name: "Out-of-bounds Read",                            description: "The software reads data past the end, or before the beginning, of the intended buffer." },
  { external_id: "CWE-787", name: "Out-of-bounds Write",                           description: "The software writes data past the end, or before the beginning, of the intended buffer." },
  { external_id: "CWE-416", name: "Use After Free",                                description: "The software references memory after it has been freed, which may cause it to crash, use unexpected values, or execute code." },
  { external_id: "CWE-415", name: "Double Free",                                   description: "The software calls free() twice on the same memory address, potentially leading to modification of unexpected memory locations." },
  { external_id: "CWE-190", name: "Integer Overflow",                              description: "The software performs a calculation that can produce an integer overflow or wraparound." },
  { external_id: "CWE-20",  name: "Improper Input Validation",                     description: "The software receives input or data, but it does not validate or incorrectly validates that the input has the properties required to safely process the data." },
  { external_id: "CWE-502", name: "Deserialization of Untrusted Data",             description: "The application deserializes untrusted data without sufficiently verifying that the resulting data will be valid." },
  { external_id: "CWE-611", name: "XML External Entity Reference (XXE)",           description: "The software processes an XML document that can contain XML entities with URIs that resolve to documents outside of the intended sphere of control." },
  { external_id: "CWE-400", name: "Uncontrolled Resource Consumption",             description: "The software does not properly restrict the amount of memory consumed in response to a request." },
  { external_id: "CWE-434", name: "Unrestricted File Upload",                      description: "The software allows the attacker to upload or transfer files of dangerous types that can be automatically processed within the product's environment." },
  { external_id: "CWE-798", name: "Use of Hard-coded Credentials",                 description: "The software contains hard-coded credentials, such as a password or cryptographic key, which it uses for its own inbound authentication." },
  { external_id: "CWE-327", name: "Use of Broken Cryptographic Algorithm",         description: "The use of a broken or risky cryptographic algorithm is an unnecessary risk that may result in the exposure of sensitive information." },
  { external_id: "CWE-601", name: "Open Redirect",                                 description: "A web application accepts a user-controlled input that specifies a link to an external site and uses that link in a Redirect." },
  { external_id: "CWE-352", name: "Cross-Site Request Forgery (CSRF)",             description: "The web application does not, or can not, sufficiently verify whether a well-formed, valid, consistent request was intentionally provided by the user." },
  { external_id: "CWE-918", name: "Server-Side Request Forgery (SSRF)",            description: "The web server receives a URL or similar request from an upstream component and retrieves the contents of this URL." },
  { external_id: "CWE-732", name: "Incorrect Permission Assignment",               description: "The software specifies permissions for a security-critical resource in a way that allows that resource to be read or modified by unintended actors." },
  { external_id: "CWE-295", name: "Improper Certificate Validation",               description: "The software does not validate, or incorrectly validates, a certificate." },
  { external_id: "CWE-338", name: "Weak Pseudo-Random Number Generator",           description: "The software uses a pseudo-random number generator (PRNG) with insufficient randomness." },
  { external_id: "CWE-77",  name: "Command Injection",                             description: "The software constructs all or part of a command using externally-influenced input from an upstream component." },
  { external_id: "CWE-703", name: "Improper Exception Handling",                   description: "The software does not properly anticipate or handle exceptional/unusual conditions that rarely occur during normal operation of the software." },
];

// ─── Bundle builder ──────────────────────────────────────────────────────────
export function buildBundle(
  entities: CanvasEntity[],
  relationships: CanvasRelationship[],
): Record<string, unknown> {
  const now = new Date().toISOString();
  const objects: Record<string, unknown>[] = [];

  const stixIdMap: Record<string, string> = {};
  for (const e of entities) {
    const sid = `${e.type}--${crypto.randomUUID()}`;
    stixIdMap[e.uid] = sid;
    objects.push({
      type: e.type,
      id: sid,
      spec_version: "2.1",
      created: now,
      modified: now,
      ...e.data,
    });
  }

  for (const r of relationships) {
    const srcId = stixIdMap[r.sourceUid];
    const tgtId = stixIdMap[r.targetUid];
    if (!srcId || !tgtId) continue;
    objects.push({
      type: "relationship",
      id: `relationship--${crypto.randomUUID()}`,
      spec_version: "2.1",
      created: now,
      modified: now,
      relationship_type: r.relationshipType,
      source_ref: srcId,
      target_ref: tgtId,
      ...(r.description ? { description: r.description } : {}),
      ...(r.confidence  ? { confidence: r.confidence }   : {}),
    });
  }

  return {
    type: "bundle",
    id: `bundle--${crypto.randomUUID()}`,
    spec_version: "2.1",
    objects,
  };
}

export function downloadBundle(
  entities: CanvasEntity[],
  relationships: CanvasRelationship[],
): void {
  const bundle = buildBundle(entities, relationships);
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `stix-bundle-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
