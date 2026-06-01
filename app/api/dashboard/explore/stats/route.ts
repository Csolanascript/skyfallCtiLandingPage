import { NextResponse } from "next/server";
import data from "@/data/explore_stats.json";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(data);
}
