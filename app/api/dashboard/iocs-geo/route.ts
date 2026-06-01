import { NextResponse } from "next/server";
import data from "@/data/iocs_geo.json";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(data);
}
