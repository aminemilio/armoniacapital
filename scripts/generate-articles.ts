/**
 * Article generator for Armonia Capital.
 *
 *   npm run generate
 *
 * 1. Picks a category (rotating daily, or CATEGORY=...).
 * 2. Groq pipeline (LLM_PROVIDER=groq): RADAR (clusters worldwide headlines into trending stories and
 *    regional sub-niche angles) -> RESEARCH (web search, two passes: facts, then regional angles) ->
 *    WRITE (from the verified notes only) -> REVISE (up to 2x if a quality check fails).
 *    Gemini keeps the older single-call path.
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
import { renderBriefing, type BriefingData } from "../lib/briefing-template";
import { fetchDashboard } from "../lib/market-data";
import { getNews } from "../lib/news";
import type { Article, CategorySlug, NewsItem } from "../lib/types";

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
const TRENDS_PATH = path.join(ROOT, "data", "trends.json");
const FEATURED_PATH = path.join(ROOT, "data", "featured.json");
const UNIVERSE_PATH = path.join(ROOT, "data", "universe.json");
const SOURCES_PATH = path.join(ROOT, "data", "sources.json");
const BRIEFING_PATH = path.join(ROOT, "data", "briefing.json");

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
  const now = new Date();
  if (now.getUTCDay() === 6) return "learn"; // Saturday: one educational guide
  const day = Math.floor(now.getTime() / 86_400_000);
  return CORE_CATEGORIES[(day + offset) % CORE_CATEGORIES.length];
}

/** Which market session today's article should look ahead to (weekdays only). */
function sessionLabel(): string | undefined {
  const forced = env("SESSION");
  if (forced) return forced;
  const d = new Date().getUTCDay();
  return d >= 1 && d <= 5 ? "European and US" : undefined;
}

async function http<T>(url: string, init: RequestInit, label: string): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new Error(`${label} failed: ${res.status} ${body}`);
  }
  return (await res.json()) as T;
}

function cleanSources(raw: Source[], limit = 6): Source[] {
  const seen = new Set<string>();
  const out: Source[] = [];
  for (const s of raw) {
    if (!s.url || !/^https?:\/\//.test(s.url) || seen.has(s.url)) continue;
    seen.add(s.url);
    out.push({ title: (s.title || new URL(s.url).hostname).slice(0, 120), url: s.url });
    if (out.length >= limit) break;
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
  const session = sessionLabel();
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

const MIN_WORDS = 750;

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
  if (words < MIN_WORDS) throw new Error(`Article too short (${words} words, need ${MIN_WORDS}+)`);
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


async function prioritySources(): Promise<string> {
  try {
    const raw = JSON.parse(await readFile(SOURCES_PATH, "utf8")) as { priority?: { site: string; region?: string; country?: string; note?: string }[] };
    const list = (raw.priority ?? []).map((x) => `- ${x.site}${x.country ? ` (${x.country})` : x.region ? ` (${x.region})` : ""}${x.note ? `: ${x.note}` : ""}`);
    return list.length ? list.join("\n") : "(none configured)";
  } catch {
    return "(none configured)";
  }
}

async function loadSavedRadar(): Promise<Radar | null> {
  try {
    const r = JSON.parse(await readFile(TRENDS_PATH, "utf8")) as Radar;
    return r && Array.isArray(r.trends) && r.trends.length > 0 ? r : null;
  } catch {
    return null;
  }
}

/* ----- featured asset of the day ----- */

interface UniverseItem {
  symbol: string;
  name: string;
  type: "stock" | "crypto";
  coingeckoId?: string;
  yahoo?: string;
  sector?: string;
}
interface FeaturedFile {
  current: Record<string, unknown> | null;
  history: { date: string; symbol: string }[];
}

const FEATURED_BANNED = /\b(buy|sell|undervalued|overvalued|price target|guaranteed|will (rise|soar|surge|moon|double)|best investment|must[- ]own)\b/i;

function hashPick(seed: string, n: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % n;
}

async function runFeatured(radar: Radar | null): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  let file: FeaturedFile = { current: null, history: [] };
  try {
    file = JSON.parse(await readFile(FEATURED_PATH, "utf8")) as FeaturedFile;
  } catch {
    /* first run */
  }
  if (!Array.isArray(file.history)) file.history = [];
  if ((file.current as { date?: string } | null)?.date === today && env("FEATURED_FORCE") !== "true") {
    console.log("Featured asset already chosen today.");
    return;
  }

  const universe = JSON.parse(await readFile(UNIVERSE_PATH, "utf8")) as UniverseItem[];
  const recent = new Set(file.history.slice(0, 14).map((h) => h.symbol));
  const candidates = universe.filter((u) => !recent.has(u.symbol));
  const pool = candidates.length > 0 ? candidates : universe;

  // 1) pick from the curated universe (small model, no web)
  let chosen = pool[hashPick(today, pool.length)];
  try {
    const prompt = `You are the markets editor at Armonia Capital. Choose ONE asset to feature today, from this list only. Prefer an asset whose real-world business or network utility connects to today's trending stories, and vary stocks, coins and regions from day to day.

TRENDING NOW
${trendsText(radar)}

CANDIDATES (symbol | name | type | what it does)
${pool.map((u) => `${u.symbol} | ${u.name} | ${u.type} | ${u.sector ?? ""}`).join("\n")}

Output ONLY one line: SYMBOL: <symbol> | WHY: <one sentence>`;
    const out = await groqChat({ model: LIGHT_MODEL(), prompt, maxTokens: 400 });
    const sym = out.text.match(/SYMBOL:\s*([^\s|]+)/i)?.[1]?.trim();
    const hit = pool.find((u) => u.symbol.toLowerCase() === (sym ?? "").toLowerCase());
    if (hit) chosen = hit;
    else console.warn(`Featured: model chose "${sym}" which is not in the list; using the rotation pick ${chosen.symbol}`);
  } catch (err) {
    console.warn(`Featured selection failed (${(err as Error).message}); using rotation pick ${chosen.symbol}`);
  }
  console.log(`Featured asset: ${chosen.name} (${chosen.symbol})`);

  // 2) research its real-world utility (web search, main model)
  const prompt = `You are the research desk of Armonia Capital. Today is ${today}.
ASSET: ${chosen.name} (${chosen.symbol}), ${chosen.type}, ${chosen.sector ?? ""}.

TRENDING NOW
${trendsText(radar)}

Build a short factual profile of this asset's REAL-WORLD UTILITY. Search the web. Prefer primary sources (company filings and investor reports, official documentation, regulators, usage or on-chain dashboards), then reputable outlets.

Output EXACTLY this and nothing else:
UTILITY: <two sentences: what it does and who actually uses it>
EVIDENCE:
- <concrete usage, revenue or adoption figure with its date> — <source name>
- <another>
- <another>
WHY NOW: <one sentence connecting it to news from the last 30 days>
RISKS:
- <specific risk>
- <specific risk>

Rules: facts only from your sources; neutral tone; at most 170 words; no price predictions, no price targets, and no words such as buy, sell, undervalued.`;
  const out = await groqChat({ model: MAIN_MODEL(), prompt, browse: true, maxTokens: 2500 });

  const text = out.text.replace(/\*\*/g, "");
  const utility = text.match(/UTILITY:\s*([\s\S]*?)\n\s*EVIDENCE:/i)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
  const evidenceBlock = text.match(/EVIDENCE:\s*([\s\S]*?)\n\s*WHY NOW:/i)?.[1] ?? "";
  const whyNow = text.match(/WHY NOW:\s*([\s\S]*?)\n\s*RISKS:/i)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
  const risksBlock = text.match(/RISKS:\s*([\s\S]*)$/i)?.[1] ?? "";
  const bullets = (block: string) =>
    block
      .split("\n")
      .map((l) => l.trim().replace(/^[-*•]\s*/, ""))
      .filter((l) => l.length > 10)
      .map((l) => l.replace(/\[\d+\]|【[^】]*】/g, "").trim())
      .slice(0, 4);
  const evidence = bullets(evidenceBlock);
  const risks = bullets(risksBlock);

  const all = `${utility} ${whyNow} ${evidence.join(" ")} ${risks.join(" ")}`;
  if (utility.length < 40 || !whyNow || evidence.length < 2 || risks.length < 1) throw new Error("Featured profile was incomplete");
  if (out.sources.length < 2) throw new Error(`Featured profile had only ${out.sources.length} web sources`);
  if (FEATURED_BANNED.test(all)) throw new Error("Featured profile contained recommendation-style wording");

  const current = {
    date: today,
    symbol: chosen.symbol,
    name: chosen.name,
    type: chosen.type,
    coingeckoId: chosen.coingeckoId,
    yahoo: chosen.yahoo,
    sector: chosen.sector,
    utility,
    evidence,
    whyNow,
    risks,
    sources: out.sources.slice(0, 5),
  };
  const history = [{ date: today, symbol: chosen.symbol }, ...file.history.filter((h) => h.date !== today)].slice(0, 40);
  await writeFile(FEATURED_PATH, JSON.stringify({ current, history }, null, 2) + "\n", "utf8");
  console.log(`✓ Featured asset of the day: ${chosen.name}`);
}


/* ----- the daily email briefing ----- */

const REGION_LABELS = ["Europe", "Africa", "Asia", "MENA"] as const;

function section(text: string, start: string, ends: string[]): string {
  const re = new RegExp(`^\\s*${start}\\s*:?`, "im");
  const m = re.exec(text);
  if (!m) return "";
  const from = m.index + m[0].length;
  let to = text.length;
  for (const e of ends) {
    const em = new RegExp(`^\\s*${e}\\s*:?`, "im").exec(text.slice(from));
    if (em) to = Math.min(to, from + em.index);
  }
  return text.slice(from, to).trim();
}

function unsupportedFigures(text: string, context: string): string[] {
  const bad = new Set<string>();
  for (const raw of text.match(/[$€£]?\d[\d,]*(?:\.\d+)?%?/g) ?? []) {
    const core = raw.replace(/[%,$€£]/g, "");
    if (core.length < 2 && !raw.endsWith("%")) continue;
    if (/^(19|20)\d{2}$/.test(core)) continue;
    const variants = [raw, core, core.replace(/\.0+$/, ""), core.replace(/(\.\d*?)0+$/, "$1")];
    if (!variants.some((v) => v && context.includes(v))) bad.add(raw);
  }
  return [...bad].slice(0, 10);
}

function dropSentencesWith(text: string, tokens: string[]): string {
  if (tokens.length === 0) return text;
  const kept = text.split(/(?<=[.!?])\s+/).filter((sent) => !tokens.some((t) => sent.includes(t)));
  return (kept.length ? kept : [text]).join(" ");
}

function parseBriefing(text: string, allowed: Set<string>) {
  const t = text.replace(/```\w*\n?/g, "").replace(/\*\*/g, "");
  const subject = t.match(/^\s*SUBJECT:\s*(.+)$/im)?.[1]?.trim() ?? "";
  const preview = t.match(/^\s*PREVIEW:\s*(.+)$/im)?.[1]?.trim() ?? "";
  const balance = section(t, "BALANCE", ["STORIES", "REGIONS", "WATCH"]).replace(/\s+/g, " ");
  const cleanUrl = (u?: string) => {
    const url = (u ?? "").replace(/[<>\s]/g, "").replace(/[.,;)]+$/, "");
    return /^https?:\/\//.test(url) && allowed.has(url) ? url : undefined;
  };
  const lines = (block: string) => block.split("\n").map((l) => l.trim().replace(/^[-*•]\s*/, "")).filter((l) => l.length > 15);

  const stories = lines(section(t, "STORIES", ["REGIONS", "WATCH"])).map((l) => {
    const [headline, analysis, url] = l.split("|").map((x) => x.trim());
    return { headline: headline ?? "", analysis: analysis ?? "", url: cleanUrl(url) };
  }).filter((x) => x.headline && x.analysis.length > 40);

  const regions = lines(section(t, "REGIONS", ["WATCH"])).map((l) => {
    const [region, text2, url] = l.split("|").map((x) => x.trim());
    return { region: region ?? "", text: text2 ?? "", url: cleanUrl(url) };
  }).filter((x) => x.region && x.text.length > 30);

  const watch = lines(section(t, "WATCH", [])).slice(0, 4);
  return { subject, preview, balance, stories: stories.slice(0, 5), regions: regions.slice(0, 4), watch };
}

async function runBriefing(radar: Radar | null, article: Article | null): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  if (lastNews.length === 0) {
    try {
      lastNews = (await getNews(true, { translate: false })).items.filter((i) => !i.lang || i.lang === "en");
    } catch {
      /* continue without */
    }
  }

  // Regional headlines (up to 6 per region) with their links: the only links the model may use.
  const headlines: NewsItem[] = [];
  for (const r of [...REGION_LABELS, "Global"]) {
    headlines.push(...lastNews.filter((i) => i.regions.includes(r)).slice(0, 6));
  }
  const unique = [...new Map(headlines.map((h) => [h.url, h])).values()];
  if (unique.length < 8 && !radar) {
    console.warn("Briefing skipped: not enough headlines");
    return;
  }

  let snapshot: BriefingData["snapshot"] = [];
  try {
    const q = await fetchDashboard();
    snapshot = q.ticker
      .filter((t) => ["SPX", "IXIC", "XAU", "DXY", "BTC", "ETH"].includes(t.symbol) && t.live)
      .map((t) => ({ symbol: t.symbol, name: t.name, price: t.price, changePct: t.changePct, currency: t.currency }));
  } catch {
    /* snapshot is optional */
  }

  let featured: BriefingData["featured"];
  try {
    const f = JSON.parse(await readFile(FEATURED_PATH, "utf8")) as { current?: { date: string; name: string; symbol: string; type: string; utility: string; whyNow: string; risks: string[] } | null };
    if (f.current?.date === today) featured = { name: f.current.name, symbol: f.current.symbol, type: f.current.type, utility: f.current.utility, whyNow: f.current.whyNow, risks: f.current.risks };
  } catch {
    /* none today */
  }

  const notesUrls = [...lastNotes.matchAll(/https?:\/\/[^\s)<>"']+/g)].map((m) => m[0].replace(/[.,;]+$/, ""));
  const allowed = new Set<string>([...unique.map((h) => h.url), ...notesUrls, ...(article?.sources ?? []).map((x) => x.url)]);
  const snapshotText = snapshot.map((x) => `${x.name} (${x.symbol}): ${x.price} (${x.changePct >= 0 ? "+" : ""}${x.changePct.toFixed(2)}% today)`).join("\n") || "(unavailable)";
  const headlineText = unique.map((h) => `${h.regions[0]}${h.country ? "/" + h.country : ""} | ${h.source} | ${h.title} | ${h.url}`).join("\n");
  const notesText = lastNotes.split(/\s+/).slice(0, 1300).join(" ");
  const context = `${snapshotText}\n${trendsText(radar)}\n${notesText}\n${headlineText}\n${article ? article.title + " " + article.excerpt : ""}`;

  const material = `MARKET SNAPSHOT (computed by code)
${snapshotText}

TRENDING STORIES (radar of worldwide headlines)
${trendsText(radar)}

SUB-NICHE ANGLES
${anglesText(radar)}

TODAY'S LONG ANALYSIS (we link it ourselves; do not repeat its content)
${article ? `${article.title}: ${article.excerpt}` : "(none today)"}

RESEARCH NOTES
${notesText || "(none today)"}

HEADLINES (region/country | source | title | url)
${headlineText}`;

  const base = `You are the editor of "The Morning Balance", Armonia Capital's daily email briefing for investors and analysts in Europe, Africa, Asia and the Middle East. Today is ${today}. Write like an experienced financial journalist: precise, specific, plain English, no emojis, no hype.

Use ONLY the material below. Every link must be copied exactly from the material. Every figure you state (prices, percentages, amounts, dates) must appear in the material; if unsure, leave the figure out. Paraphrase; never copy sentences. No investment advice, no recommendations, no predictions stated as certain. Never use: "in today's fast-paced", "delve", "navigate the landscape", "it's important to note", "game-changer", "ever-evolving", "tapestry", "at the end of the day". Avoid em dashes.

${material}

Output EXACTLY this format and nothing else:
SUBJECT: <specific subject line, 40 to 70 characters, no clickbait>
PREVIEW: <inbox preview text, up to 110 characters>
BALANCE: <3 to 4 sentences: where markets stand today, what looks stretched or balanced, and the single most important driver>
STORIES:
- <headline> | <two sentences: what happened and why it matters for markets> | <url from the material>
(exactly 5 lines, the five most important stories across regions)
REGIONS:
- Europe | <two sentences> | <url from the material>
- Africa | <two sentences, naming the country> | <url>
- Asia | <two sentences> | <url>
- MENA | <two sentences, Gulf, Maghreb or Islamic finance where relevant> | <url>
WATCH:
- <what to watch today, with a time or trigger if the material gives one>
(exactly 3 lines)`;

  let out = await groqChat({ model: MAIN_MODEL(), prompt: base, maxTokens: 3500 });
  let parsed = parseBriefing(out.text, allowed);
  const fail = () => {
    if (parsed.subject.length < 20 || parsed.subject.length > 90) return "the subject line length is off";
    if (parsed.balance.length < 150) return "the BALANCE paragraph is too short";
    if (parsed.stories.length < 4) return "fewer than 4 valid stories";
    if (parsed.stories.filter((x) => x.url).length < 3) return "too few stories with links copied from the material";
    if (parsed.regions.length < 3) return "fewer than 3 regions";
    if (parsed.watch.length < 2) return "fewer than 2 watch items";
    return "";
  };
  const textOf = () => [parsed.balance, ...parsed.stories.map((x) => `${x.headline} ${x.analysis}`), ...parsed.regions.map((x) => x.text), ...parsed.watch].join(" ");

  let problem = fail();
  let figures = problem ? [] : unsupportedFigures(textOf(), context);
  if (problem || figures.length) {
    const why = problem || `these figures are not in the material: ${figures.join(", ")}`;
    console.warn(`Briefing draft rejected: ${why}. Revising once…`);
    out = await groqChat({
      model: MAIN_MODEL(),
      prompt: `${base}\n\nYOUR PREVIOUS DRAFT FAILED A CHECK: ${why}. Rewrite the whole briefing in the same format and fix it. Remove or replace any figure that is not in the material.\n\nPREVIOUS DRAFT:\n${out.text}`,
      maxTokens: 3500,
    });
    parsed = parseBriefing(out.text, allowed);
    problem = fail();
    if (problem) throw new Error(`Briefing still invalid after revision: ${problem}`);
    figures = unsupportedFigures(textOf(), context);
  }
  if (figures.length) {
    console.warn(`Dropping sentences with unsupported figures: ${figures.join(", ")}`);
    parsed.balance = dropSentencesWith(parsed.balance, figures);
    parsed.stories = parsed.stories.map((x) => ({ ...x, analysis: dropSentencesWith(x.analysis, figures) }));
    parsed.regions = parsed.regions.map((x) => ({ ...x, text: dropSentencesWith(x.text, figures) }));
  }

  const data: BriefingData = {
    date: today,
    subject: parsed.subject,
    preview: parsed.preview.slice(0, 140),
    balance: parsed.balance,
    stories: parsed.stories,
    regions: parsed.regions,
    watch: parsed.watch,
    snapshot,
    article: article ? { title: article.title, excerpt: article.excerpt, slug: article.slug } : undefined,
    featured,
  };
  const site = (env("SITE_URL") ?? "https://armoniacapital.com").replace(/\/$/, "");
  const { html, text } = renderBriefing(data, site);
  await writeFile(BRIEFING_PATH, JSON.stringify({ date: today, subject: data.subject, preview: data.preview, slug: article?.slug ?? null, html, text, generatedAt: new Date().toISOString() }, null, 2) + "\n", "utf8");
  console.log(`✓ Briefing ready: "${data.subject}" (${data.stories.length} stories, ${data.regions.length} regions, ${snapshot.length} prices)`);
}

/* ---------------- main ---------------- */

async function generateOneSimple(offset: number, store: Article[]): Promise<Article> {
  const category = pickCategory(offset);
  const allTitles = [...store, ...getAllArticles()].map((a) => a.title);
  const recent = allTitles.slice(0, 15);
  const provider = env("LLM_PROVIDER") ?? "gemini";
  console.log(`Generating a ${category} article with ${provider}…`);

  let parsed: ReturnType<typeof parseArticle> | undefined;
  let sources: Source[] = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    const prompt = buildPrompt(category, recent, allTitles);
    const result = await callGemini(prompt);
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

/* ---------------- Groq pipeline: radar -> research -> write -> revise ---------------- */

const MAIN_MODEL = () => env("GROQ_MODEL") ?? "openai/gpt-oss-120b";
const LIGHT_MODEL = () => env("GROQ_LIGHT_MODEL") ?? "openai/gpt-oss-20b";
const COOLDOWN_MS = () => Number(env("GROQ_COOLDOWN_MS") ?? 62_000);
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface GroqCall {
  model: string;
  prompt: string;
  browse?: boolean;
  maxTokens?: number;
}
interface GroqOut {
  text: string;
  sources: Source[];
  tokens: number;
}
type GroqResp = {
  choices?: {
    finish_reason?: string;
    message?: Record<string, unknown> & { content?: string; executed_tools?: unknown };
  }[];
  usage?: { total_tokens?: number };
};

const usage = new Map<string, { at: number; tokens: number }>();
let lastNotes = ""; // research notes of the day, reused by the briefing
let lastNews: NewsItem[] = []; // English headlines from our feeds, reused by the briefing

/** Free-tier Groq limits tokens per minute per model, so heavy calls on the same model are spaced out. */
async function cooldown(model: string): Promise<void> {
  const u = usage.get(model);
  if (!u || u.tokens < 3000) return;
  const wait = COOLDOWN_MS() - (Date.now() - u.at);
  if (wait > 0) {
    console.log(`Waiting ${Math.ceil(wait / 1000)}s for Groq's per-minute token window (${model})…`);
    await sleep(wait);
  }
}

function retryDelayMs(header: string | null, body: string): number {
  const h = header ? Number(header) : NaN;
  if (Number.isFinite(h) && h > 0) return h * 1000;
  const m = body.match(/try again in\s+(?:(\d+)m)?\s*([\d.]+)(ms|s)/i);
  if (m) {
    const mins = m[1] ? Number(m[1]) : 0;
    const val = Number(m[2]);
    return m[3].toLowerCase() === "ms" ? val : (mins * 60 + val) * 1000;
  }
  return 20_000;
}

async function groqChat(c: GroqCall): Promise<GroqOut> {
  const key = env("GROQ_API_KEY");
  if (!key) throw new Error("GROQ_API_KEY is not set");
  const gptOss = c.model.startsWith("openai/gpt-oss");

  for (let attempt = 1; attempt <= 5; attempt++) {
    await cooldown(c.model);
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}`, "Groq-Model-Version": "latest" },
      body: JSON.stringify({
        model: c.model,
        temperature: 0.4,
        max_completion_tokens: c.maxTokens ?? 6000,
        messages: [{ role: "user", content: c.prompt }],
        ...(gptOss
          ? { reasoning_effort: "low", ...(c.browse ? { tools: [{ type: "browser_search" }], tool_choice: "required" } : {}) }
          : {}),
      }),
    });

    if (res.status === 429) {
      const body = await res.text();
      if (/per day|TPD|RPD/i.test(body)) throw new Error(`Groq daily limit reached for ${c.model}: ${body.slice(0, 200)}`);
      const wait = Math.min(retryDelayMs(res.headers.get("retry-after"), body) + 1500, 90_000);
      console.warn(`Groq rate limit on ${c.model} (attempt ${attempt}/5). Waiting ${Math.ceil(wait / 1000)}s…`);
      await sleep(wait);
      continue;
    }
    if (res.status >= 500) {
      console.warn(`Groq ${res.status} on ${c.model} (attempt ${attempt}/5). Retrying…`);
      await sleep(4000 * attempt);
      continue;
    }
    if (!res.ok) throw new Error(`Groq (${c.model}) failed: ${res.status} ${(await res.text()).slice(0, 300)}`);

    const json = (await res.json()) as GroqResp;
    const msg = json.choices?.[0]?.message;
    const tokens = json.usage?.total_tokens ?? 0;
    usage.set(c.model, { at: Date.now(), tokens });
    const sources = cleanSources(collectSources([msg?.executed_tools, msg?.annotations]), 8);
    console.log(`Groq ${c.model}: ${tokens} tokens, ${sources.length} sources, finish=${json.choices?.[0]?.finish_reason}`);
    return { text: msg?.content ?? "", sources, tokens };
  }
  throw new Error(`Groq (${c.model}) is still rate limited after several retries`);
}

/* ----- stage 1: radar ----- */

interface Trend {
  name: string;
  regions: string[];
  keywords: string[];
  why: string;
}
interface Angle {
  place: string;
  idea: string;
}
interface Radar {
  generatedAt: string;
  trends: Trend[];
  angles: Angle[];
}

/** Worldwide English-language headlines from GDELT (free, keyless). Best effort. */
async function gdeltHeadlines(): Promise<string[]> {
  const q = `(economy OR inflation OR "central bank" OR "interest rates" OR stocks OR oil OR gold OR currency OR sukuk OR bitcoin) sourcelang:english`;
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}&mode=artlist&maxrecords=60&format=json&timespan=24h&sort=hybridrel`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return [];
    const json = JSON.parse(await res.text()) as { articles?: { title?: string; domain?: string; sourcecountry?: string }[] };
    return (json.articles ?? [])
      .filter((a) => a.title)
      .slice(0, 50)
      .map((a) => `[${a.domain ?? "web"}${a.sourcecountry ? "|" + a.sourcecountry : ""}] ${a.title}`);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function runRadar(): Promise<Radar | null> {
  let feedLines: string[] = [];
  try {
    const news = await getNews(true, { translate: false });
    lastNews = news.items.filter((i) => !i.lang || i.lang === "en");
    feedLines = news.items
      .filter((i) => !i.lang || i.lang === "en")
      .slice(0, 90)
      .map((i) => `[${i.source}|${i.regions.join("/")}] ${i.title}`);
  } catch (err) {
    console.warn(`Radar: our feeds failed (${(err as Error).message})`);
  }
  const worldwide = await gdeltHeadlines();
  const lines = [...feedLines, ...worldwide];
  console.log(`Radar: ${feedLines.length} feed headlines + ${worldwide.length} worldwide headlines`);
  if (lines.length < 10) {
    console.warn("Radar skipped: too few headlines");
    return null;
  }

  const prompt = `You are the markets desk editor at Armonia Capital. Below are headlines from the last 24-48 hours: central banks, regional business media (Europe, Africa, Asia, MENA), crypto and Islamic finance sources, plus a worldwide news index.

HEADLINES
${lines.join("\n")}

TASK
1. Cluster headlines that are about the same story.
2. Pick the 8 stories that are trending most. Rank higher when more independent outlets cover it, when the market impact is bigger, and when more regions are touched.
3. For Europe, Africa (name the country: Algeria, Egypt, Nigeria, South Africa, Morocco, Tunisia), Asia, MENA/Gulf and Islamic finance, suggest 1 or 2 sub-niche angles an analyst could cover, grounded in the headlines above.

Output ONLY these lines, nothing else:
TREND: <story name> | REGIONS: <region>; <region> | KEYWORDS: <kw>; <kw>; <kw> | WHY: <one sentence>
ANGLE: <country or region> | <sub-niche idea in one sentence>`;

  const out = await groqChat({ model: LIGHT_MODEL(), prompt, maxTokens: 2500 });
  const trends: Trend[] = [];
  const angles: Angle[] = [];
  for (const raw of out.text.replace(/\*\*/g, "").split("\n")) {
    const line = raw.trim().replace(/^[-*\d.)\s]+(?=(TREND|ANGLE):)/i, "");
    if (/^TREND:/i.test(line)) {
      const parts = line.replace(/^TREND:\s*/i, "").split("|").map((x) => x.trim());
      const field = (label: string) => parts.find((x) => x.toUpperCase().startsWith(label))?.replace(new RegExp(`^${label}:?\\s*`, "i"), "") ?? "";
      if (parts[0]) {
        trends.push({
          name: parts[0],
          regions: field("REGIONS").split(";").map((x) => x.trim()).filter(Boolean),
          keywords: field("KEYWORDS").split(";").map((x) => x.trim()).filter(Boolean),
          why: field("WHY"),
        });
      }
    } else if (/^ANGLE:/i.test(line)) {
      const [place, ...rest] = line.replace(/^ANGLE:\s*/i, "").split("|").map((x) => x.trim());
      if (place && rest.join(" ").trim()) angles.push({ place, idea: rest.join(" ").trim() });
    }
  }
  if (trends.length === 0) {
    console.warn("Radar returned no parsable trends");
    return null;
  }
  console.log(`Radar: ${trends.length} trends, ${angles.length} angles. Top: ${trends[0].name}`);
  return { generatedAt: new Date().toISOString(), trends: trends.slice(0, 8), angles: angles.slice(0, 12) };
}

/* ----- stage 2: research (web search) ----- */

const trendsText = (r: Radar | null) =>
  r ? r.trends.map((t, i) => `${i + 1}. ${t.name} [${t.regions.join(", ")}] (${t.why})`).join("\n") : "(radar unavailable: find the most important stories yourself)";
const anglesText = (r: Radar | null) => (r && r.angles.length ? r.angles.map((a) => `- ${a.place}: ${a.idea}`).join("\n") : "(none)");

function researchPrompt1(category: CategorySlug, radar: Radar | null, recent: string[], learnTopic?: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const head = `You are the research desk of Armonia Capital, a financial market intelligence site. Today is ${today}.`;
  const tail = `Search the web thoroughly before answering. Prefer primary sources (central banks, statistics offices, regulators, exchanges, company filings), then at least three independent reputable outlets. Collect exact figures with dates, who said what, and any disagreement between sources.

Output plain-text RESEARCH NOTES, at most 650 words, exactly in this structure:
STORY: <one line>
WHY IT MATTERS: <2 sentences>
FACTS:
- <fact with figure or date> — <source name> — <URL>
(10 to 14 lines)
CONTEXT: <3 to 4 sentences of background>
DIFFERENT VIEWS: <2 to 3 lines>
WHAT TO WATCH: <3 lines>
Do not write the article.`;
  if (learnTopic) {
    return `${head}
TOPIC FOR AN EVERGREEN BEGINNER GUIDE: ${learnTopic}
Verify definitions, mechanics, a simple numeric example, common misconceptions, and what regulators or standard-setters say. Treat "STORY" as the topic itself.

${tail}`;
  }
  return `${head}
CATEGORY: ${CATEGORY_META[category].name}: ${FOCUS[category]}

TRENDING NOW (from our radar of worldwide headlines):
${trendsText(radar)}

Choose the ONE story from the list that best fits the category. If none fits, choose the most important story in the category from your own searching. Avoid repeating these recent pieces: ${recent.join(" | ") || "none"}.

${tail}`;
}

function researchPrompt2(story: string, radar: Radar | null, priority: string): string {
  return `You are the research desk of Armonia Capital, a financial market intelligence site.

STORY UNDER COVERAGE: ${story || "(see the category's top story)"}

Sub-niche ideas spotted by our radar:
${anglesText(radar)}

Priority local sources to check FIRST when relevant (search them by name or site):
${priority}

Find regional and sub-niche angles on this story. Search for how it plays out in Europe, Africa (Algeria, Egypt, Nigeria, South Africa, Morocco, Tunisia), Asia, the Gulf and MENA, and in Islamic finance (sukuk, halal equities, Islamic banks). Use local sources: national central banks, statistics offices, ministries, regulators and local business media.

Output plain-text NOTES, at most 500 words:
REGIONAL ANGLES:
- <region or country> — <specific development with figure or date> — <source name> — <URL>
(6 to 9 lines)
SUB-NICHE IDEAS: 3 short lines for follow-up coverage.
Do not write the article.`;
}

/* ----- stage 3: write + revise ----- */

const WRITE_RULES = `FACT RULES
- Use ONLY the verified research notes. Do not add facts, figures, names or quotes that are not in the notes. If sources disagree, say so.
- Attribute figures in the prose (for example "according to Reuters"). No investment advice, recommendations, price targets, or predictions stated as certain. Describe scenarios and what would change the picture.
- Paraphrase everything. Never copy sentences from sources.

VOICE RULES
- Start with the news itself (or, for a guide, a plain sentence saying what the concept is and why it matters). No warm-up introduction.
- Natural editorial voice: vary sentence length, concrete detail, active voice. Paragraphs of 2 to 4 sentences.
- Never use these phrases: "in today's fast-paced", "delve", "navigate the landscape", "it's important to note", "it is worth noting", "game-changer", "in conclusion", "ever-evolving", "tapestry", "unlock", "testament to", "at the end of the day". Avoid em dashes and rhetorical-question openers.
- Plain prose only: no bullet lists, no bold, no tables, no citation markers like [1].
- Where the notes include regional angles, weave 2 or 3 of them in so readers in Africa, MENA, Asia and Europe see why the story matters to them. Mention the Islamic finance angle only if the notes support it.

SEO RULES
- Choose one primary keyword phrase (2 to 4 words) a reader would search for. Put it in the title, in the first 100 words, and in one section heading. Use related terms naturally.
- Title: 50 to 65 characters, specific, no clickbait.
- 5 or 6 sections with descriptive headings that say what the section answers. The last section looks ahead (what to watch next, or what to read next).
- 950 to 1150 words in total. This length is required.
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

function writePrompt(category: CategorySlug, notes: string, recent: string[], learnTopic?: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const session = sessionLabel();
  const kind = learnTopic
    ? `an evergreen educational guide for intelligent beginners on: ${learnTopic}`
    : `one news-analysis article for the ${CATEGORY_META[category].name} section`;
  return `You are a staff writer at Armonia Capital, a financial market intelligence site. Write like an experienced financial journalist, not like an AI assistant. The site's lens is equilibrium: where price sits relative to balance, who is positioned on each side, and what could pull it back.

Write ${kind}. Today is ${today}.${session && !learnTopic ? ` It is published ahead of the ${session} market open, so make it useful for someone about to follow that session.` : ""}
Do not repeat these recent pieces: ${recent.join(" | ") || "none"}.

<notes>
${notes}
</notes>

${WRITE_RULES}`;
}

function revisionPrompt(draft: string, notes: string, problem: string, learnTopic?: string): string {
  return `You are the editor at Armonia Capital. Your draft failed a quality check: ${problem}.
Rewrite the COMPLETE article so it passes, using only facts from the research notes. Keep what was good, fix the problem, and keep the same output format.${learnTopic ? ` It is an evergreen beginner guide on: ${learnTopic}.` : ""}

<notes>
${notes}
</notes>

<draft>
${draft}
</draft>

${WRITE_RULES}`;
}

async function generateOneGroq(offset: number, store: Article[], radar: Radar | null): Promise<Article> {
  const category = pickCategory(offset);
  const allTitles = [...store, ...getAllArticles()].map((a) => a.title);
  const recent = allTitles.slice(0, 15);
  const learnTopic = category === "learn" ? pickLearnTopic(allTitles) : undefined;
  console.log(`Researching a ${category} article${learnTopic ? ` on "${learnTopic}"` : ""}…`);

  const r1 = await groqChat({ model: MAIN_MODEL(), prompt: researchPrompt1(category, radar, recent, learnTopic), browse: true, maxTokens: 3500 });
  let notes = r1.text.trim();
  let sources = r1.sources;

  const passes = Number(env("RESEARCH_PASSES") ?? 2);
  if (!learnTopic && passes >= 2) {
    const story = (notes.match(/^STORY:\s*(.+)$/im)?.[1] ?? "").trim();
    try {
      const r2 = await groqChat({ model: MAIN_MODEL(), prompt: researchPrompt2(story, radar, await prioritySources()), browse: true, maxTokens: 3000 });
      notes += "\n\n" + r2.text.trim();
      sources = cleanSources([...sources, ...r2.sources], 8);
    } catch (err) {
      console.warn(`Second research pass failed, continuing with the first: ${(err as Error).message}`);
    }
  }
  lastNotes = notes;
  if (notes.split(/\s+/).length < 150) throw new Error("Research notes are too thin to write from");
  if (sources.length < 3) throw new Error(`Research found only ${sources.length} web sources (need 3+): refusing an ungrounded article`);

  let draft = await groqChat({ model: MAIN_MODEL(), prompt: writePrompt(category, notes, recent, learnTopic), maxTokens: 6000 });
  let parsed: ReturnType<typeof parseArticle> | undefined;
  for (let rev = 0; rev <= 2; rev++) {
    try {
      const candidate = parseArticle(draft.text);
      checkQuality(candidate, sources);
      parsed = candidate;
      break;
    } catch (err) {
      const problem = (err as Error).message;
      console.warn(`Draft ${rev + 1} rejected: ${problem}`);
      if (rev === 2) {
        console.warn(`Last draft (first 400 chars):\n${draft.text.slice(0, 400)}`);
        throw err;
      }
      draft = await groqChat({ model: MAIN_MODEL(), prompt: revisionPrompt(draft.text, notes, problem, learnTopic), maxTokens: 6000 });
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

/* ---------------- main ---------------- */

async function main(): Promise<void> {
  await loadEnvFile();
  const draft = env("DRAFT_MODE") === "true";
  const target = draft ? DRAFT_PATH : PUBLISH_PATH;
  const store = await readList(target);
  const count = Math.max(1, Math.min(5, Number(env("ARTICLES_PER_RUN") ?? 1)));
  const provider = env("LLM_PROVIDER") ?? "gemini";
  let added = 0;
  let todayArticle: Article | null = null;

  let radar: Radar | null = null;
  const learnDay = pickCategory(0) === "learn";
  if (provider === "groq" && !learnDay) {
    try {
      radar = await runRadar();
      if (radar) await writeFile(TRENDS_PATH, JSON.stringify(radar, null, 2) + "\n", "utf8");
    } catch (err) {
      console.warn(`Radar failed, continuing without it: ${(err as Error).message}`);
    }
  }

  for (let i = 0; i < count; i++) {
    try {
      const article = provider === "groq" ? await generateOneGroq(i, store, radar) : await generateOneSimple(i, store);
      store.unshift(article);
      todayArticle = article;
      added++;
      console.log(`✓ ${article.title}`);
    } catch (err) {
      console.error(`✗ Article ${i + 1} skipped: ${(err as Error).message}`);
    }
  }

  if (provider === "groq" && env("FEATURED") !== "false") {
    try {
      await runFeatured(radar ?? (await loadSavedRadar()));
    } catch (err) {
      console.warn(`Featured asset skipped, keeping the previous one: ${(err as Error).message}`);
    }
  }

  if (provider === "groq" && env("BRIEFING") !== "false") {
    try {
      await runBriefing(radar ?? (await loadSavedRadar()), todayArticle);
    } catch (err) {
      console.warn(`Briefing not produced: ${(err as Error).message}`);
    }
  }

  if (added === 0) {
    console.error("No articles generated.");
    process.exitCode = 1;
    return;
  }
  await writeFile(target, JSON.stringify(store, null, 2) + "\n", "utf8");
  console.log(`Wrote ${added} article(s) to ${path.relative(ROOT, target)}${draft ? " (draft)" : ""}`);
  if (draft) console.warn("DRAFT_MODE is on: drafts are NOT published on the site. Set DRAFT_MODE=false to publish automatically.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
