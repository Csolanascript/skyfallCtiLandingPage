import { NextResponse } from "next/server";
import data from "@/data/ips_domains.json";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(data);
}
