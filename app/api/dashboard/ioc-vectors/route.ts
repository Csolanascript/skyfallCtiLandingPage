import { NextResponse } from "next/server";
import data from "@/data/ioc_vectors.json";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(data);
}
