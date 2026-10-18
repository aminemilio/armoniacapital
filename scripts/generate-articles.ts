/**
 * Article generator for Armonia Capital.
 *
 *   npm run generate
 *
 * 1. Picks a category (rotating daily, or CATEGORY=...).
 * 2. Asks an LLM that can browse the web (Gemini + Google Search grounding, or Groq browser search)
 *    to research the last ~48 hours and write a note in the site's voice.
 * 3. Rejects the result unless it cites real web sources and passes quality checks (length,
 *    structure, banned clichés, advice language); retries once on rejection.
 * 4. Adds a free image from Pexels (or Pixabay) and appends the article to data/articles.json
 *    (or data/drafts.json when DRAFT_MODE=true).
 *
 * Needs Node 20+ (global fetch). No SDKs.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ARTICLES, CATEGORY_META, CORE_CATEGORIES, getAllArticles } from "../lib/articles";
import type { Article, CategorySlug } from "../lib/types";

interface Source {
  title: string;
  url: string;
}
interface LlmResult {
  text: string;
  sources: Source[];
}
interface Image {
  url: string;
  credit: string;
}

const ROOT = process.cwd();
const PUBLISH_PATH = path.join(ROOT, "data", "articles.json");
const DRAFT_PATH = path.join(ROOT, "data", "drafts.json");

const FOCUS: Record<string, string> = {
  markets: "cross-asset markets: equities, bonds, commodities, currencies, and where positioning looks stretched or balanced",
  macro: "central banks, interest rates, inflation, and the economic data that moves them",
  equities: "major stock indices, sectors, and earnings that shift market balance",
  "digital-assets": "crypto markets, ETF flows, derivatives positioning, and regulation",
  "islamic-finance": "sukuk, Sharia-compliant equities and funds, Islamic banking, and halal screening",
  learn: "evergreen explainers for beginners on markets, macro, crypto and Islamic finance",
};

/** Evergreen topics for the Learn section. The generator picks one that has not been covered yet. */
const LEARN_TOPICS: { topic: string; keyword: string }[] = [
  { topic: "What is inflation and how is it measured", keyword: "inflation" },
  { topic: "What is the yield curve and why an inverted curve gets attention", keyword: "yield curve" },
  { topic: "How exchange-traded funds (ETFs) work", keyword: "etf" },
  { topic: "What is market volatility and the VIX", keyword: "volatility" },
  { topic: "Stocks versus bonds: how they differ and why they often move differently", keyword: "stocks versus bonds" },
  { topic: "What is a recession and how is it defined", keyword: "recession" },
  { topic: "How Sharia screening of stocks works, ratio by ratio", keyword: "screening" },
  { topic: "What is murabaha and how Islamic home financing works", keyword: "murabaha" },
  { topic: "What is takaful and how it differs from conventional insurance", keyword: "takaful" },
  { topic: "Diversification and asset allocation for beginners", keyword: "diversification" },
  { topic: "What is gold's role in a portfolio and what moves its price", keyword: "gold" },
  { topic: "How to read an earnings report", keyword: "earnings report" },
  { topic: "What is a price-to-earnings ratio and its limits", keyword: "price-to-earnings" },
  { topic: "What are stablecoins and how do they keep their peg", keyword: "stablecoin" },
  { topic: "What is quantitative easing and quantitative tightening", keyword: "quantitative" },
  { topic: "What are credit spreads and what do they signal", keyword: "credit spread" },
  { topic: "How currency exchange rates are determined", keyword: "exchange rate" },
  { topic: "What is leverage and why it magnifies gains and losses", keyword: "leverage" },
  { topic: "What is mudarabah and musharakah partnership finance", keyword: "mudarabah" },
  { topic: "What is the Consumer Price Index (CPI) and why markets react to it", keyword: "consumer price index" },
  { topic: "What is a bear market versus a correction", keyword: "bear market" },
  { topic: "How zakat on investments is commonly calculated", keyword: "zakat" },
  { topic: "What is on-chain data in crypto and how analysts use it", keyword: "on-chain" },
  { topic: "What is liquidity and why markets seize up", keyword: "liquidity" },
];

/* ---------------- helpers ---------------- */

/** Loads .env.local (if present) so `npm run generate` works locally without extra tooling. */
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
    /* no .env.local: rely on real environment variables (e.g. GitHub Actions) */
  }
}

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

async function readList(file: string): Promise<Article[]> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as Article[];
  } catch {
    return [];
  }
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

function pickCategory(offset: number): CategorySlug {
  const forced = env("CATEGORY");
  if (forced && forced in CATEGORY_META) return forced as CategorySlug;
  const day = Math.floor(Date.now() / 86_400_000);
  const slot = new Date().getUTCHours() >= 10 ? 1 : 0; // 0 = European run, 1 = US run
  return CORE_CATEGORIES[(day * 2 + slot + offset) % CORE_CATEGORIES.length];
}

async function http<T>(url: string, init: RequestInit, label: string): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new Error(`${label} failed: ${res.status} ${body}`);
  }
  return (await res.json()) as T;
}

function cleanSources(raw: Source[]): Source[] {
  const seen = new Set<string>();
  const out: Source[] = [];
  for (const s of raw) {
    if (!s.url || !/^https?:\/\//.test(s.url) || seen.has(s.url)) continue;
    seen.add(s.url);
    out.push({ title: (s.title || new URL(s.url).hostname).slice(0, 120), url: s.url });
    if (out.length >= 6) break;
  }
  return out;
}

/** Gemini returns redirect links for grounded sources; resolve them to the real page. */
async function resolveRedirect(url: string): Promise<string> {
  if (!url.includes("vertexaisearch.cloud.google.com")) return url;
  try {
    const res = await fetch(url, { redirect: "manual" });
    return res.headers.get("location") ?? url;
  } catch {
    return url;
  }
}

function pickLearnTopic(existingTitles: string[]): string {
  const haystack = existingTitles.join(" | ").toLowerCase();
  const fresh = LEARN_TOPICS.filter((t) => !haystack.includes(t.keyword));
  const pool = fresh.length > 0 ? fresh : LEARN_TOPICS;
  return pool[Math.floor(Math.random() * Math.min(pool.length, 4))].topic;
}

/* ---------------- prompt ---------------- */

function buildLearnPrompt(topic: string, recentTitles: string[]): string {
  return `You are a staff writer at Armonia Capital, a financial market intelligence site. Write an evergreen educational guide for intelligent beginners, in the voice of an experienced financial journalist, not an AI assistant. Islamic finance is covered neutrally and without preaching.

TOPIC: ${topic}

Use web search to verify definitions, mechanics and any figures from reputable sources (central banks, regulators, standard-setting bodies, major publications).

FACT RULES
- Use only facts you can support from search results. Attribute specific figures in the prose. If you are unsure of a number, leave it out.
- Educational only: no investment advice, recommendations or predictions. Where Islamic scholars differ, say so and suggest consulting a qualified scholar.
- Paraphrase everything. Never copy sentences from sources. Do not invent quotes or data.
- Do not repeat these existing pieces: ${recentTitles.join(" | ") || "none"}.

VOICE RULES
- Start with a concrete, plain sentence that tells the reader what the concept is and why they should care. No warm-up.
- Explain with one simple worked example in prose. Vary sentence length, prefer active voice, paragraphs of 2 to 4 sentences.
- Never use these phrases: "in today's fast-paced", "delve", "navigate the landscape", "it's important to note", "it is worth noting", "game-changer", "in conclusion", "ever-evolving", "tapestry", "unlock", "testament to", "at the end of the day". Avoid em dashes and rhetorical-question openers.
- Plain prose only: no bullet lists, no bold, no tables, no citation markers like [1].

SEO RULES
- Choose one primary keyword phrase (2 to 4 words) a beginner would search for. Put it in the title, in the first 100 words, and in one section heading.
- Title: 50 to 65 characters, specific, no clickbait (for example "What Is X? ..." or "X Explained: ...").
- 5 or 6 sections with descriptive headings that answer a question: what it is, how it works, a simple example, why it matters for markets or savers, common misconceptions, and what to read next.
- 900 to 1200 words in total.
- META_DESCRIPTION: 130 to 155 characters, includes the primary keyword, states what the reader will learn.

Output EXACTLY this format and nothing else:

TITLE: <title>
META_DESCRIPTION: <130 to 155 characters>
EXCERPT: <one or two sentences, max 200 characters>
KEYWORDS: <primary keyword, then 3 to 5 secondary keywords, comma separated>
IMAGE_QUERY: <2 to 4 words describing a generic stock photo, no people names or logos>
===
## <Section heading>
<paragraph>

## <Section heading>
<paragraph>`;
}

function buildPrompt(category: CategorySlug, recentTitles: string[], allTitles: string[] = recentTitles): string {
  if (category === "learn") return buildLearnPrompt(pickLearnTopic(allTitles), recentTitles);
  const today = new Date().toISOString().slice(0, 10);
  const session = env("SESSION");
  return `You are a staff writer at Armonia Capital, a financial market intelligence site. Write like an experienced financial journalist, not like an AI assistant. The site's lens is equilibrium: where price sits relative to balance, who is positioned on each side, and what could pull it back. Islamic finance is covered as a core vertical, in neutral, non-preachy language.

Today is ${today}.${session ? ` The article goes out ahead of the ${session} market open, so make it useful for someone about to follow that session.` : ""} Use web search to find the most important developments from the last 48 hours in: ${FOCUS[category]}. Pick ONE angle and write one article about it.

FACT RULES
- Use only facts you found in search results. Attribute figures and claims in the prose (for example "according to Reuters"). If you are unsure of a number, leave it out.
- No investment advice, recommendations, price targets, or predictions stated as certain. Describe scenarios and what would change the picture.
- Paraphrase everything. Never copy sentences from sources. Do not invent quotes, people, or data.
- Do not repeat these recent topics: ${recentTitles.join(" | ") || "none"}.

VOICE RULES
- Start with the news itself in the first sentence: what happened, where, and why it matters. No warm-up introduction.
- Natural editorial voice: vary sentence length, use concrete detail from the sources, prefer active voice. Paragraphs of 2 to 4 sentences.
- Never use these phrases: "in today's fast-paced", "delve", "navigate the landscape", "it's important to note", "it is worth noting", "game-changer", "in conclusion", "ever-evolving", "tapestry", "unlock", "testament to", "at the end of the day". Avoid em dashes and rhetorical-question openers.
- Plain prose only: no bullet lists, no bold, no tables, no citation markers like [1].

SEO RULES
- Choose one primary keyword phrase (2 to 4 words) that a reader would actually search for on this topic. Put it in the title, in the first 100 words, and in one section heading. Use related terms naturally. Never stuff keywords.
- Title: 50 to 65 characters, specific, no clickbait.
- 5 or 6 sections with descriptive headings that say what the section answers (not generic ones like "Overview"). The last section looks ahead at what to watch next.
- 900 to 1200 words in total.
- META_DESCRIPTION: 130 to 155 characters, includes the primary keyword, states the takeaway.

Output EXACTLY this format and nothing else:

TITLE: <title>
META_DESCRIPTION: <130 to 155 characters>
EXCERPT: <one or two sentences, max 200 characters>
KEYWORDS: <primary keyword, then 3 to 5 secondary keywords, comma separated>
IMAGE_QUERY: <2 to 4 words describing a generic stock photo, no people names or logos>
===
## <Section heading>
<paragraph>

## <Section heading>
<paragraph>`;
}

/* ---------------- LLM providers ---------------- */

async function callGemini(prompt: string): Promise<LlmResult> {
  const key = env("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const model = env("GEMINI_MODEL") ?? "gemini-flash-latest";
  type Resp = {
    candidates?: {
      content?: { parts?: { text?: string }[] };
      groundingMetadata?: { groundingChunks?: { web?: { uri?: string; title?: string } }[] };
    }[];
  };
  const json = await http<Resp>(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.4 },
      }),
    },
    `Gemini (${model})`,
  );
  const cand = json.candidates?.[0];
  const text = (cand?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  const chunks = cand?.groundingMetadata?.groundingChunks ?? [];
  const raw = await Promise.all(
    chunks.map(async (c) => ({ title: c.web?.title ?? "", url: await resolveRedirect(c.web?.uri ?? "") })),
  );
  return { text, sources: cleanSources(raw) };
}

/** Walks any JSON value and collects every {url, title} pair it finds (shape-agnostic). */
function collectSources(node: unknown, out: Source[] = []): Source[] {
  if (Array.isArray(node)) {
    node.forEach((n) => collectSources(n, out));
  } else if (node && typeof node === "object") {
    const o = node as Record<string, unknown>;
    if (typeof o.url === "string") out.push({ title: typeof o.title === "string" ? o.title : "", url: o.url });
    Object.values(o).forEach((v) => collectSources(v, out));
  }
  return out;
}

async function callGroq(prompt: string): Promise<LlmResult> {
  const key = env("GROQ_API_KEY");
  if (!key) throw new Error("GROQ_API_KEY is not set");
  type Resp = { choices?: { finish_reason?: string; message?: Record<string, unknown> & { content?: string; executed_tools?: unknown } }[] };
  // Web access on Groq: "groq/compound*" systems, or openai/gpt-oss-* with the built-in browser_search tool.
  const candidates = [...new Set([env("GROQ_MODEL"), "openai/gpt-oss-120b", "openai/gpt-oss-20b"])].filter(
    (m): m is string => Boolean(m),
  );
  for (const model of candidates) {
    const isGptOss = model.startsWith("openai/gpt-oss");
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}`, "Groq-Model-Version": "latest" },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_completion_tokens: 12000,
        messages: [{ role: "user", content: prompt }],
        ...(isGptOss ? { tools: [{ type: "browser_search" }], tool_choice: "required", reasoning_effort: "low" } : {}),
      }),
    });
    if (res.status === 404) {
      console.warn(`Groq model ${model} not available for this key, trying the next one…`);
      continue;
    }
    if (!res.ok) throw new Error(`Groq (${model}) failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
    const json = (await res.json()) as Resp;
    const msg = json.choices?.[0]?.message;
    const sources = cleanSources(collectSources([msg?.executed_tools, msg?.annotations]));
    if (sources.length === 0) {
      console.warn(`No sources found. executed_tools was: ${JSON.stringify(msg?.executed_tools ?? null).slice(0, 600)}`);
    }
    console.log(`Used Groq model ${model} (${sources.length} sources, finish_reason=${json.choices?.[0]?.finish_reason})`);
    return { text: msg?.content ?? "", sources };
  }
  let available = "unknown";
  try {
    const list = await http<{ data?: { id: string }[] }>(
      "https://api.groq.com/openai/v1/models",
      { headers: { authorization: `Bearer ${key}` } },
      "Groq model list",
    );
    available = (list.data ?? []).map((m) => m.id).join(", ");
  } catch (err) {
    available = `could not list models (${(err as Error).message})`;
  }
  throw new Error(`No web-search model is available for this Groq key. Models available: ${available}`);
}

/* ---------------- parsing + checks ---------------- */

function parseArticle(text: string) {
  const t = text
    .replace(/```\w*\n?/g, "")
    .replace(/\*\*/g, "")
    .replace(/\r/g, "");
  const pick = (label: string) => t.match(new RegExp(`^[ \\t#>*_-]*${label}[ \\t]*:[ \\t]*(.+)$`, "mi"));
  const title = pick("TITLE");
  const excerpt = pick("EXCERPT");
  const meta = pick("META_DESCRIPTION");
  const keywords = pick("KEYWORDS");
  const imageQuery = pick("IMAGE_QUERY");
  if (!title || !excerpt) throw new Error("Model output is missing the TITLE or EXCERPT line");

  // Body = everything after the last header line and any === or --- separator.
  const headerEnd = Math.max(
    ...[title, excerpt, meta, keywords, imageQuery].map((m) => (m ? (m.index ?? 0) + m[0].length : 0)),
  );
  const body = t
    .slice(headerEnd)
    .replace(/\[\d+(?:\s*,\s*\d+)*\]/g, "")
    .replace(/【[^】]*】/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^[=-]{3,}$/.test(l))
    .map((l) => (/^#{1,6}\s/.test(l) ? `## ${l.replace(/^#{1,6}\s+/, "")}` : l.replace(/^[-*•]\s+/, "")))
    .join("\n\n");
  if (!body) throw new Error("Model output has no article body");

  const cut = (v: string, n: number) => (v.length <= n ? v : v.slice(0, n - 1).replace(/\s+\S*$/, "") + "…");
  const excerptText = excerpt[1].trim();
  return {
    title: title[1].trim(),
    excerpt: cut(excerptText, 220),
    metaDescription: cut((meta?.[1] ?? excerptText).trim(), 158),
    keywords: (keywords?.[1] ?? "")
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 6),
    imageQuery: (imageQuery?.[1] ?? title[1]).trim().split(/\s+/).slice(0, 4).join(" "),
    content: body,
  };
}

const BANNED = [
  "in today's fast-paced",
  "delve",
  "navigate the landscape",
  "navigating the landscape",
  "it's important to note",
  "it is important to note",
  "it is worth noting",
  "game-changer",
  "game changer",
  "in conclusion",
  "ever-evolving",
  "tapestry",
  "testament to",
  "at the end of the day",
];

function checkQuality(a: ReturnType<typeof parseArticle>, sources: Source[]): void {
  const words = a.content.split(/\s+/).length;
  const headings = (a.content.match(/^## /gm) ?? []).length;
  const lower = `${a.title} ${a.content}`.toLowerCase();
  if (sources.length < 2) throw new Error(`Only ${sources.length} web source(s) found: refusing ungrounded article`);
  if (words < 700) throw new Error(`Article too short (${words} words, need 700+)`);
  if (headings < 4) throw new Error(`Too few sections (${headings}, need 4+)`);
  if (a.title.length < 25 || a.title.length > 80) throw new Error(`Title length ${a.title.length} is outside 25-80`);
  if (a.keywords.length === 0) throw new Error("No keywords returned");
  const banned = BANNED.find((p) => lower.includes(p));
  if (banned) throw new Error(`Contains a banned cliché: "${banned}"`);
  if (/\b(you should (buy|sell)|guaranteed|price target)\b/i.test(a.content)) {
    throw new Error("Article contains advice-like language");
  }
}

/* ---------------- images ---------------- */

async function pexelsImage(query: string, used: Set<string>): Promise<Image | null> {
  const key = env("PEXELS_API_KEY");
  if (!key) return null;
  type Resp = { photos?: { photographer: string; src: { large2x?: string; large: string } }[] };
  const json = await http<Resp>(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
    { headers: { Authorization: key } },
    "Pexels",
  );
  const p = (json.photos ?? []).find((x) => !used.has(x.src.large2x ?? x.src.large));
  return p ? { url: p.src.large2x ?? p.src.large, credit: `Photo by ${p.photographer} on Pexels` } : null;
}

async function pixabayImage(query: string, used: Set<string>): Promise<Image | null> {
  const key = env("PIXABAY_API_KEY");
  if (!key) return null;
  type Resp = { hits?: { largeImageURL: string; user: string }[] };
  const json = await http<Resp>(
    `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=20`,
    {},
    "Pixabay",
  );
  const h = (json.hits ?? []).find((x) => !used.has(x.largeImageURL));
  return h ? { url: h.largeImageURL, credit: `Image by ${h.user} on Pixabay` } : null;
}

async function findImage(query: string, used: Set<string>): Promise<Image | null> {
  for (const fn of [pexelsImage, pixabayImage]) {
    try {
      const img = await fn(query, used);
      if (img) return img;
    } catch (err) {
      console.warn(`Image lookup failed: ${(err as Error).message}`);
    }
  }
  return null;
}

/* ---------------- main ---------------- */

async function generateOne(offset: number, store: Article[]): Promise<Article> {
  const category = pickCategory(offset);
  const allTitles = [...store, ...getAllArticles()].map((a) => a.title);
  const recent = allTitles.slice(0, 15);
  const provider = env("LLM_PROVIDER") ?? "gemini";
  console.log(`Generating a ${category} article with ${provider}…`);

  let parsed: ReturnType<typeof parseArticle> | undefined;
  let sources: Source[] = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    const prompt = buildPrompt(category, recent, allTitles);
    const result = provider === "groq" ? await callGroq(prompt) : await callGemini(prompt);
    try {
      const candidate = parseArticle(result.text);
      checkQuality(candidate, result.sources);
      parsed = candidate;
      sources = result.sources;
      break;
    } catch (err) {
      console.warn(`Attempt ${attempt} rejected: ${(err as Error).message}`);
      console.warn(`Raw model output (first 400 chars):\n${result.text.slice(0, 400)}`);
      if (attempt === 2) throw err;
      console.warn("Retrying once…");
    }
  }
  if (!parsed) throw new Error("No acceptable article produced");

  const known = new Set([...ARTICLES, ...store].map((a) => a.slug));
  let slug = slugify(parsed.title);
  if (!slug) throw new Error("Could not build a slug");
  if (known.has(slug)) slug = `${slug}-${new Date().toISOString().slice(0, 10)}`;
  if (known.has(slug)) throw new Error(`Duplicate slug: ${slug}`);

  const usedImages = new Set([...ARTICLES, ...store].map((a) => a.image));
  const image = await findImage(parsed.imageQuery, usedImages);
  if (!image) throw new Error("No image found (set PEXELS_API_KEY or PIXABAY_API_KEY)");

  return {
    slug,
    title: parsed.title,
    excerpt: parsed.excerpt,
    metaDescription: parsed.metaDescription,
    keywords: parsed.keywords,
    category,
    date: new Date().toISOString().slice(0, 10),
    publishedAt: new Date().toISOString(),
    image: image.url,
    imageCredit: image.credit,
    readTime: Math.max(2, Math.ceil(parsed.content.split(/\s+/).length / 200)),
    content: parsed.content,
    sources,
    generated: true,
  };
}

async function main(): Promise<void> {
  await loadEnvFile();
  const draft = env("DRAFT_MODE") === "true";
  const target = draft ? DRAFT_PATH : PUBLISH_PATH;
  const store = await readList(target);
  const count = Math.max(1, Math.min(5, Number(env("ARTICLES_PER_RUN") ?? 1)));
  let added = 0;

  for (let i = 0; i < count; i++) {
    try {
      const article = await generateOne(i, store);
      store.unshift(article);
      added++;
      console.log(`✓ ${article.title}`);
    } catch (err) {
      console.error(`✗ Article ${i + 1} skipped: ${(err as Error).message}`);
    }
  }

  if (added === 0) {
    console.error("No articles generated.");
    process.exitCode = 1;
    return;
  }
  await writeFile(target, JSON.stringify(store, null, 2) + "\n", "utf8");
  if (draft) console.warn("DRAFT_MODE is on: drafts are NOT published on the site. Set DRAFT_MODE=false to publish automatically.");
  console.log(`Wrote ${added} article(s) to ${path.relative(ROOT, target)}${draft ? " (draft)" : ""}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
