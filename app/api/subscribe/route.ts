import { NextResponse } from "next/server";
import { EMAIL_RE, emailEnv, sendConfirmation } from "@/lib/email";

export const dynamic = "force-dynamic";

/** Open https://your-site/api/subscribe in a browser to see which settings the server can read (no secret values are shown). */
export async function GET() {
  const env = emailEnv();
  return NextResponse.json({
    RESEND_API_KEY: Boolean(env.key),
    SUBSCRIBE_SECRET: Boolean(env.secret),
    RESEND_SEGMENT_ID: Boolean(env.segment),
    EMAIL_FROM: env.from,
    SITE_URL: env.site,
    ready: Boolean(env.key && env.secret),
  });
}

// Very small per-instance rate limit (5 requests per minute per IP). Resend and the honeypot do the rest.
const hits = new Map<string, number[]>();

export async function POST(req: Request) {
  let body: { email?: unknown; company?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    /* ignore */
  }

  if (typeof body.company === "string" && body.company.trim()) return NextResponse.json({ ok: true }); // honeypot

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 200 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= 5) return NextResponse.json({ ok: false, error: "Too many attempts. Try again in a minute." }, { status: 429 });
  hits.set(ip, [...recent, now]);

  const env = emailEnv();
  if (!env.key || !env.secret) {
    console.error("Subscribe: RESEND_API_KEY or SUBSCRIBE_SECRET is not set");
    return NextResponse.json({ ok: false, error: "Subscriptions are not available yet. Please try again later." }, { status: 503 });
  }

  try {
    const sent = await sendConfirmation(email, env);
    if (!sent.ok) {
      console.error("Resend confirmation failed", sent.status, JSON.stringify(sent.json));
      return NextResponse.json({ ok: false, error: "We could not send the confirmation email. Please try again later." }, { status: 502 });
    }
  } catch (err) {
    console.error("Resend confirmation error", err);
    return NextResponse.json({ ok: false, error: "We could not send the confirmation email. Please try again later." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
