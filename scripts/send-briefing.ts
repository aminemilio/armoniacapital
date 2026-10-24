/**
 * Sends today's briefing (data/briefing.json) to the subscribers through Resend.
 *
 *   npm run send-briefing                         send to everyone in the segment (used by the workflow)
 *   npm run send-briefing -- --test you@mail.com  send ONE test email to yourself instead
 *
 * Env: RESEND_API_KEY, RESEND_SEGMENT_ID, EMAIL_FROM, SITE_URL (read from .env.local when present).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { emailEnv, resend } from "../lib/email";

const ROOT = process.cwd();
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function loadEnvFile(): Promise<void> {
  try {
    const raw = await readFile(path.join(ROOT, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!m || line.trim().startsWith("#")) continue;
      const value = m[2].replace(/^["']|["']$/g, "");
      if (value && process.env[m[1]] === undefined) process.env[m[1]] = value;
    }
  } catch {
    /* no .env.local */
  }
}

interface BriefingFile {
  date: string | null;
  subject?: string;
  preview?: string;
  slug?: string | null;
  html?: string;
  text?: string;
}

/** The email links to today's article, so wait until the site has redeployed with it (max 12 minutes). */
async function waitForArticle(url: string): Promise<boolean> {
  const deadline = Date.now() + 12 * 60_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (res.ok) return true;
    } catch {
      /* not up yet */
    }
    console.log("Waiting for the site to publish today's article…");
    await sleep(20_000);
  }
  return false;
}

async function main(): Promise<void> {
  await loadEnvFile();
  const env = emailEnv();
  const testIdx = process.argv.indexOf("--test");
  const testTo = testIdx >= 0 ? process.argv[testIdx + 1] : undefined;

  if (process.env.SEND_BRIEFING === "false") {
    console.log("SEND_BRIEFING=false: not sending.");
    return;
  }
  if (!env.key) {
    console.log("RESEND_API_KEY is not set: not sending.");
    return;
  }

  let file: BriefingFile = { date: null };
  try {
    file = JSON.parse(await readFile(path.join(ROOT, "data", "briefing.json"), "utf8")) as BriefingFile;
  } catch {
    /* no briefing yet */
  }

  /* ---------- test mode: one email to yourself ---------- */
  if (testTo) {
    const hasBriefing = Boolean(file.date && file.html);
    const html = hasBriefing
      ? (file.html as string).replace(/\{\{\{RESEND_UNSUBSCRIBE_URL\}\}\}/g, `${env.site}/subscribed?status=test`)
      : `<p>This is a delivery test from Armonia Capital. If you can read it, your sending domain works.</p>`;
    const text = hasBriefing
      ? (file.text as string).replace(/\{\{\{RESEND_UNSUBSCRIBE_URL\}\}\}/g, `${env.site}/subscribed?status=test`)
      : "This is a delivery test from Armonia Capital. If you can read it, your sending domain works.";
    const res = await resend("/emails", env.key, {
      body: { from: env.from, to: [testTo], subject: `[TEST] ${hasBriefing ? file.subject : "Delivery test"}`, html, text },
    });
    console.log(res.ok ? `Test email accepted by Resend (id ${res.json?.id}). Check the inbox and spam of ${testTo}.` : `Resend refused the test email: ${res.status} ${JSON.stringify(res.json)}`);
    if (!res.ok) {
      console.log('Common causes: the domain is not verified in Resend, or EMAIL_FROM uses a domain other than the verified one.');
      process.exitCode = 1;
    }
    return;
  }

  /* ---------- real send ---------- */
  const today = new Date().toISOString().slice(0, 10);
  if (!file.date || !file.html) {
    console.log("No briefing available: not sending.");
    return;
  }
  if (file.date !== today && process.env.BRIEFING_FORCE !== "true") {
    console.log(`The briefing is from ${file.date}, not today: not sending.`);
    return;
  }
  if (!env.segment) {
    console.log("RESEND_SEGMENT_ID is not set: not sending.");
    return;
  }

  const name = `briefing-${file.date}`;
  try {
    const existing = await resend("/broadcasts", env.key);
    const list: { name?: string; status?: string }[] = Array.isArray(existing.json?.data) ? existing.json.data : [];
    if (list.some((b) => b.name === name && b.status !== "draft")) {
      console.log(`A broadcast named ${name} was already sent: skipping.`);
      return;
    }
  } catch (err) {
    console.warn(`Could not check earlier broadcasts (${(err as Error).message}); continuing.`);
  }

  if (file.slug) {
    const live = await waitForArticle(`${env.site}/articles/${file.slug}`);
    if (!live) console.warn("The article is still not live; sending anyway (the link will work once the site finishes deploying).");
  }

  const res = await resend("/broadcasts", env.key, {
    body: {
      segment_id: env.segment,
      from: env.from,
      subject: file.subject,
      preview_text: file.preview,
      name,
      html: file.html,
      text: file.text,
      send: true,
    },
  });
  if (!res.ok) {
    console.error(`Resend refused the broadcast: ${res.status} ${JSON.stringify(res.json)}`);
    process.exitCode = 1;
    return;
  }
  console.log(`✓ Briefing sent to the "${env.segment}" segment (broadcast ${res.json?.id}).`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
