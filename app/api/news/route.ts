import { NextResponse } from "next/server";
import { getNews } from "@/lib/news";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getNews();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json({
      items: [],
      updatedAt: new Date().toISOString(),
      sources: { ok: 0, total: 0 },
      failed: [],
    });
  }
}
