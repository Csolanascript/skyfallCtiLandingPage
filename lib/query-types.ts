export interface QueryGraphNode {
  id: string;
  labels: string[];
  properties: Record<string, unknown>;
}

export interface QueryGraphRelationship {
  id: string;
  source: string;
  target: string;
  relationship_type: string;
  properties: Record<string, unknown>;
}

export interface QueryGraphPayload {
  nodes: QueryGraphNode[];
  relationships: QueryGraphRelationship[];
}

export interface QueryGraphOverview {
  nodes: number;
  relationships: number;
  labels: Array<{ label: string; count: number }>;
  relationship_types: Array<{ type: string; count: number }>;
}

export interface RunQueryResponse {
  status: "ok";
  keys: string[];
  row_count: number;
  limit: number;
  records: Record<string, unknown>[];
  graph: QueryGraphPayload;
  graph_overview: QueryGraphOverview;
}

export interface ExpandNodeResponse {
  status: "ok";
  node_id: string;
  row_count: number;
  limit: number;
  graph: QueryGraphPayload;
  graph_overview: QueryGraphOverview;
}

export interface GraphCatalogResponse {
  status: "ok";
  nodes: number;
  relationships: number;
  node_labels: Array<{ label: string; count: number }>;
  relationship_types: Array<{ type: string; count: number }>;
  property_keys: string[];
}
