import { NextResponse } from "next/server";
import data from "@/data/techniques.json";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(data);
}
