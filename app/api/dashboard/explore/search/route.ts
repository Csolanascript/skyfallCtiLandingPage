import { NextResponse, NextRequest } from "next/server";
import snapshot from "@/data/explore_feed.json";

export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const feed = (snapshot as { feed: unknown[] }).feed ?? [];
  const results = q
    ? feed.filter((item) => JSON.stringify(item).toLowerCase().includes(q.toLowerCase())).slice(0, 20)
    : feed.slice(0, 20);
  return NextResponse.json({ results, query: q, count: results.length });
}
