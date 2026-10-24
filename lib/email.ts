/**
 * Email helpers (server only): Resend REST calls, confirmation tokens, and double opt-in.
 * Environment (Cloudflare runtime secrets/variables, and GitHub for the sender script):
 *   RESEND_API_KEY, RESEND_SEGMENT_ID, EMAIL_FROM, SUBSCRIBE_SECRET, SITE_URL
 */
const API = "https://api.resend.com";

export interface EmailEnv {
  key?: string;
  segment?: string;
  from: string;
  secret?: string;
  site: string;
}

export function emailEnv(): EmailEnv {
  const get = (n: string) => process.env[n]?.trim() || undefined;
  return {
    key: get("RESEND_API_KEY"),
    segment: get("RESEND_SEGMENT_ID"),
    from: get("EMAIL_FROM") ?? "Armonia Capital <briefing@armoniacapital.com>",
    secret: get("SUBSCRIBE_SECRET"),
    site: (get("SITE_URL") ?? "https://armoniacapital.com").replace(/\/$/, ""),
  };
}

export interface ResendResult {
  ok: boolean;
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any;
}

export async function resend(path: string, key: string, init: { method?: string; body?: unknown } = {}): Promise<ResendResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(`${API}${path}`, {
      method: init.method ?? (init.body ? "POST" : "GET"),
      signal: controller.signal,
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json", accept: "application/json" },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      /* empty body */
    }
    return { ok: res.ok, status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- confirmation tokens (stateless HMAC) ---------- */

const enc = new TextEncoder();

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
  let bin = "";
  sig.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signConfirmation(email: string, expiresAt: number, secret: string): Promise<string> {
  return hmac(secret, `confirm:${email.toLowerCase()}:${expiresAt}`);
}

export async function verifyConfirmation(email: string, expiresAt: number, token: string, secret: string): Promise<boolean> {
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  return safeEqual(await signConfirmation(email, expiresAt, secret), token);
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ---------- double opt-in ---------- */

export async function sendConfirmation(email: string, env: EmailEnv): Promise<ResendResult> {
  const expires = Date.now() + 3 * 24 * 60 * 60 * 1000;
  const token = await signConfirmation(email, expires, env.secret as string);
  const link = `${env.site}/api/confirm?e=${encodeURIComponent(email)}&x=${expires}&t=${token}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1b1f26">
<h2 style="font-family:Georgia,serif;margin:0 0 12px">Confirm your subscription</h2>
<p>You asked to receive <strong>The Morning Balance</strong>, Armonia Capital's daily market briefing.</p>
<p><a href="${link}" style="display:inline-block;background:#AD8536;color:#0E1116;padding:12px 22px;text-decoration:none;font-weight:bold">Confirm my email</a></p>
<p style="font-size:13px;color:#555">If you did not request this, ignore this message and nothing will happen. The link expires in 3 days.</p></div>`;
  const text = `Confirm your subscription to The Morning Balance (Armonia Capital):\n${link}\n\nIf you did not request this, ignore this email.`;
  return resend("/emails", env.key as string, {
    body: { from: env.from, to: [email], subject: "Confirm your subscription to The Morning Balance", html, text },
  });
}

/** Creates the contact (or re-subscribes it) and adds it to the briefing segment. */
export async function addSubscriber(email: string, env: EmailEnv): Promise<boolean> {
  const key = env.key as string;
  const created = await resend("/contacts", key, { body: { email, unsubscribed: false } });
  if (!created.ok) {
    // Already exists (or similar): make sure it is subscribed again.
    const patched = await resend(`/contacts/${encodeURIComponent(email)}`, key, { method: "PATCH", body: { unsubscribed: false } });
    if (!patched.ok) {
      console.error("Resend contact create/patch failed", created.status, JSON.stringify(created.json), patched.status);
      return false;
    }
  }
  if (env.segment) {
    const added = await resend(`/contacts/${encodeURIComponent(email)}/segments/${env.segment}`, key, { method: "POST", body: {} });
    // 409/422 usually means "already in the segment".
    if (!added.ok && added.status !== 409 && added.status !== 422) {
      console.error("Resend add-to-segment failed", added.status, JSON.stringify(added.json));
      return false;
    }
  }
  return true;
}
