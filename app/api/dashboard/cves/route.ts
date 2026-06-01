import { NextResponse } from "next/server";
import data from "@/data/cves.json";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(data);
}
