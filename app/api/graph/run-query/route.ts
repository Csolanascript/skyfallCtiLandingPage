import { NextResponse, NextRequest } from "next/server";

// Static graph response for NodeHoverPreview and IOCGraphModal
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const params = body.params ?? {};
  const value = params.value ?? params.name ?? "unknown";

  const centralId = "node-0";
  const nodes = [
    { id: centralId, labels: ["Indicator"], properties: { value, pattern: `[ipv4-addr:value = '${value}']`, type: "indicator" } },
    { id: "node-1", labels: ["IP"], properties: { value, ip_value: value } },
    { id: "node-2", labels: ["Location"], properties: { name: "US", country: "US" } },
    { id: "node-3", labels: ["Malware"], properties: { name: "Unknown Loader" } },
    { id: "node-4", labels: ["Campaign"], properties: { name: "Automated Brute Force" } },
    { id: "node-5", labels: ["IntrusionSet"], properties: { name: "Unknown Actor" } },
  ];

  const relationships = [
    { id: "r-0", source: centralId, target: "node-1", relationship_type: "INDICATES", properties: {} },
    { id: "r-1", source: centralId, target: "node-2", relationship_type: "LOCATED_AT", properties: {} },
    { id: "r-2", source: "node-3", target: centralId, relationship_type: "USES", properties: {} },
    { id: "r-3", source: "node-4", target: centralId, relationship_type: "USES", properties: {} },
    { id: "r-4", source: "node-5", target: "node-4", relationship_type: "ATTRIBUTED_TO", properties: {} },
  ];

  return NextResponse.json({
    status: "ok",
    keys: ["n"],
    row_count: nodes.length,
    limit: body.limit ?? 25,
    records: nodes.map((n) => ({ n })),
    graph: { nodes, relationships },
    graph_overview: {
      nodes: nodes.length,
      relationships: relationships.length,
      labels: nodes.map((n) => ({ label: n.labels[0], count: 1 })),
      relationship_types: relationships.map((r) => ({ type: r.relationship_type, count: 1 })),
    },
  });
}
