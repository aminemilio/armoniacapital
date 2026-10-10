import { NextResponse } from "next/server";
import { fetchDashboard, getMockPayload } from "@/lib/market-data";

export const runtime = "edge";
export const revalidate = 60;

export async function GET() {
  try {
    const payload = await fetchDashboard();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch {
    // Never fail the UI: serve indicative mock data.
    return NextResponse.json(getMockPayload(), {
      headers: { "Cache-Control": "public, s-maxage=15" },
    });
  }
}
