import { NextResponse } from "next/server";
import data from "@/data/intrusion_set.json";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(data);
}
