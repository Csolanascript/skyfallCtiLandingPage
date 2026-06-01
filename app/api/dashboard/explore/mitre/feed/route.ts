import { NextResponse } from "next/server";
import snapshot from "@/data/mitre_feed.json";

export function GET() {
  return NextResponse.json(snapshot);
}
