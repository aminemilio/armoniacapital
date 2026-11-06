import { NextResponse } from "next/server";
import { EMAIL_RE, emailEnv, resend } from "@/lib/email";

export const dynamic = "force-dynamic";

const hits = new Map<string, number[]>();
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function POST(req: Request) {
  let body: { name?: unknown; email?: unknown; message?: unknown; company?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    /* ignore */
  }
  if (typeof body.company === "string" && body.company.trim()) return NextResponse.json({ ok: true }); // honeypot

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 200) : "";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 5000) : "";
  if (!name || !EMAIL_RE.test(email) || message.length < 10) {
    return NextResponse.json({ ok: false, error: "Please fill in your name, a valid email and a message of at least 10 characters." }, { status: 400 });
  }

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 600_000);
  if (recent.length >= 3) return NextResponse.json({ ok: false, error: "Too many messages. Please try again later." }, { status: 429 });
  hits.set(ip, [...recent, now]);

  const env = emailEnv();
  const to = process.env.CONTACT_TO?.trim();
  if (!env.key || !to) {
    return NextResponse.json({ ok: false, error: "The contact form is not available yet. Please email us directly." }, { status: 503 });
  }
  try {
    const res = await resend("/emails", env.key, {
      body: {
        from: env.from,
        to: [to],
        reply_to: email,
        subject: `[Armonia Capital contact] ${name}`,
        html: `<p><strong>From:</strong> ${esc(name)} &lt;${esc(email)}&gt;</p><p style="white-space:pre-wrap">${esc(message)}</p>`,
        text: `From: ${name} <${email}>\n\n${message}`,
      },
    });
    if (!res.ok) {
      console.error("Contact email failed", res.status, JSON.stringify(res.json));
      return NextResponse.json({ ok: false, error: "We could not send your message. Please email us directly." }, { status: 502 });
    }
  } catch (err) {
    console.error("Contact email error", err);
    return NextResponse.json({ ok: false, error: "We could not send your message. Please email us directly." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
