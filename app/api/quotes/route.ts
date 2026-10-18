import { NextResponse } from "next/server";
import { fetchDashboard, getMockPayload } from "@/lib/market-data";

// Must run on every request: without this Next.js pre-renders the route once at build time.
export const dynamic = "force-dynamic";

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
