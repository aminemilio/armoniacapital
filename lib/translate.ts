import type { NewsItem } from "./types";

/**
 * Machine-translates non-English headlines to English (the site is English-only).
 * Uses Groq (GROQ_API_KEY as a Cloudflare runtime secret). Results are cached for 24 h per server instance.
 * Items that cannot be translated are dropped rather than shown in another language.
 */
const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_BATCH = 30;
const cache = new Map<string, { title: string; summary: string; at: number }>();

async function translateBatch(items: NewsItem[], key: string): Promise<void> {
  const model = process.env.GROQ_TRANSLATE_MODEL?.trim() || "openai/gpt-oss-20b";
  const payload = items.map((it, i) => ({ i, t: it.title, s: it.summary }));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_completion_tokens: 4000,
        ...(model.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
        messages: [
          {
            role: "user",
            content:
              "Translate these news headlines (t) and summaries (s) into clear, neutral English. Keep names, numbers and acronyms exact. " +
              "Reply with ONLY a JSON array of objects {\"i\":number,\"t\":string,\"s\":string}, same indices, nothing else.\n" +
              JSON.stringify(payload),
          },
        ],
      }),
    });
    if (!res.ok) return;
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content ?? "";
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start < 0 || end <= start) return;
    const out = JSON.parse(text.slice(start, end + 1)) as { i?: number; t?: string; s?: string }[];
    for (const row of out) {
      if (typeof row.i !== "number" || typeof row.t !== "string" || !row.t.trim()) continue;
      const src = items[row.i];
      if (!src) continue;
      cache.set(src.id, { title: row.t.trim().slice(0, 220), summary: (row.s ?? "").trim().slice(0, 260), at: Date.now() });
    }
  } catch {
    /* translation is best effort */
  } finally {
    clearTimeout(timer);
  }
}

export async function translateToEnglish(items: NewsItem[]): Promise<NewsItem[]> {
  const foreign = items.filter((i) => i.lang && i.lang !== "en");
  if (foreign.length === 0) return items;

  const key = process.env.GROQ_API_KEY?.trim();
  const fresh = (id: string) => {
    const c = cache.get(id);
    return Boolean(c && Date.now() - c.at < TTL_MS);
  };
  const todo = foreign.filter((i) => !fresh(i.id)).slice(0, MAX_BATCH);
  if (key && todo.length > 0) await translateBatch(todo, key);

  return items.flatMap((i) => {
    if (!i.lang || i.lang === "en") return [i];
    const c = cache.get(i.id);
    return c ? [{ ...i, title: c.title, summary: c.summary, translatedFrom: i.lang }] : [];
  });
}
