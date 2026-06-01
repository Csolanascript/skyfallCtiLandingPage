import { NextResponse } from "next/server";
import data from "@/data/node_status.json";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(data);
}
