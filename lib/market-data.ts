import { getFeatured, type FeaturedSpotlight } from "./featured";
import type { DashboardData, QuotesPayload, TickerItem } from "./types";

/**
 * Indicative values used when no paid equities/FX/commodities API is configured,
 * and as the fallback whenever a live fetch fails. They are NOT real-time quotes.
 */
const MOCK: TickerItem[] = [
  { symbol: "SPX", name: "S&P 500", price: 5950.12, changePct: 0.34, live: false },
  { symbol: "IXIC", name: "NASDAQ Composite", price: 19480.55, changePct: 0.52, live: false },
  { symbol: "XAU", name: "Gold (spot)", price: 2915.4, changePct: -0.18, live: false },
  { symbol: "DXY", name: "US Dollar Index", price: 106.82, changePct: 0.11, live: false },
  { symbol: "BTC", name: "Bitcoin", price: 96250.0, changePct: 1.24, live: false },
  { symbol: "ETH", name: "Ethereum", price: 3380.25, changePct: 0.87, live: false },
  { symbol: "SOL", name: "Solana", price: 182.4, changePct: -0.63, live: false },
  { symbol: "XRP", name: "XRP", price: 2.41, changePct: 0.29, live: false },
  { symbol: "NVDA", name: "NVIDIA", price: 138.2, changePct: 1.05, live: false },
  { symbol: "TSLA", name: "Tesla", price: 412.6, changePct: -0.74, live: false },
];

const ORDER = ["SPX", "IXIC", "XAU", "DXY", "BTC", "ETH", "SOL", "XRP", "NVDA", "TSLA"];

const COINS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "ripple", symbol: "XRP", name: "XRP" },
];

export function getMockTicker(): TickerItem[] {
  return MOCK.map((item) => ({ ...item }));
}

/** Keyless fallback quote from Kraken (price vs today's open). Used when CoinGecko refuses the request. */
async function krakenQuote(symbol: string): Promise<{ price: number; changePct: number } | null> {
  const base = symbol.toUpperCase() === "BTC" ? "XBT" : symbol.toUpperCase();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${encodeURIComponent(base)}USD`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { error?: string[]; result?: Record<string, { c?: string[]; o?: string }> };
    const row = json.result ? Object.values(json.result)[0] : undefined;
    const price = Number(row?.c?.[0]);
    const open = Number(row?.o);
    if (!Number.isFinite(price) || price <= 0) return null;
    return { price, changePct: Number.isFinite(open) && open > 0 ? ((price - open) / open) * 100 : 0 };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Live crypto prices from the free public CoinGecko API. Returns [] on any failure. */
async function fetchCoinGecko(): Promise<TickerItem[]> {
  const ids = COINS.map((c) => c.id).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "application/json",
        ...(process.env.COINGECKO_API_KEY ? { "x-cg-demo-api-key": process.env.COINGECKO_API_KEY } : {}),
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`);
    const json = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
    const out: TickerItem[] = [];
    for (const coin of COINS) {
      const quote = json[coin.id];
      if (quote && typeof quote.usd === "number") {
        out.push({
          symbol: coin.symbol,
          name: coin.name,
          price: quote.usd,
          changePct: typeof quote.usd_24h_change === "number" ? quote.usd_24h_change : 0,
          live: true,
        });
      }
    }
    return out;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** Crypto prices: CoinGecko first, then Kraken for any coin CoinGecko did not return. */
export async function fetchCrypto(): Promise<TickerItem[]> {
  const out = await fetchCoinGecko();
  const have = new Set(out.map((i) => i.symbol));
  const missing = COINS.filter((c) => !have.has(c.symbol));
  if (missing.length === 0) return out;
  const filled = await Promise.all(
    missing.map(async (c): Promise<TickerItem | null> => {
      const q = await krakenQuote(c.symbol);
      return q ? { symbol: c.symbol, name: c.name, price: q.price, changePct: q.changePct, live: true, currency: "USD" } : null;
    }),
  );
  return [...out, ...filled.filter((x): x is TickerItem => x !== null)];
}

/* Free, keyless equities/index/FX/commodity quotes via Yahoo Finance's chart endpoint.
 * This endpoint is unofficial: it can rate-limit or change without notice, which is why
 * every symbol falls back to its mock value independently. */
const YAHOO = [
  { symbol: "SPX", name: "S&P 500", ticker: "^GSPC" },
  { symbol: "IXIC", name: "NASDAQ Composite", ticker: "^IXIC" },
  { symbol: "XAU", name: "Gold (futures)", ticker: "GC=F" },
  { symbol: "DXY", name: "US Dollar Index", ticker: "DX-Y.NYB" },
  { symbol: "NVDA", name: "NVIDIA", ticker: "NVDA" },
  { symbol: "TSLA", name: "Tesla", ticker: "TSLA" },
];

async function fetchYahooOne(entry: (typeof YAHOO)[number]): Promise<TickerItem | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(entry.ticker)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json", "user-agent": "Mozilla/5.0 (compatible; ArmoniaCapital/1.0)" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      chart?: {
        result?: { meta?: { regularMarketPrice?: number; previousClose?: number; chartPreviousClose?: number; currency?: string } }[];
      };
    };
    const meta = json.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    const prev = meta?.previousClose ?? meta?.chartPreviousClose;
    if (typeof price !== "number") return null;
    const changePct = typeof prev === "number" && prev !== 0 ? ((price - prev) / prev) * 100 : 0;
    return { symbol: entry.symbol, name: entry.name, price, changePct, live: true, currency: meta?.currency };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchEquities(): Promise<TickerItem[]> {
  const results = await Promise.all(YAHOO.map(fetchYahooOne));
  return results.filter((r): r is TickerItem => r !== null);
}

function mergeTicker(crypto: TickerItem[]): TickerItem[] {
  const bySymbol = new Map<string, TickerItem>(getMockTicker().map((i) => [i.symbol, i]));
  for (const item of crypto) bySymbol.set(item.symbol, item);
  return ORDER.map((s) => bySymbol.get(s)).filter((i): i is TickerItem => Boolean(i));
}

/** Live quote for the day's featured asset (CoinGecko for coins, Yahoo for stocks). Null on failure. */
async function fetchFeaturedQuote(spec: FeaturedSpotlight): Promise<TickerItem | null> {
  if (spec.type === "crypto" && spec.coingeckoId) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(spec.coingeckoId)}&vs_currencies=usd&include_24hr_change=true`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          accept: "application/json",
          ...(process.env.COINGECKO_API_KEY ? { "x-cg-demo-api-key": process.env.COINGECKO_API_KEY } : {}),
        },
        next: { revalidate: 60 },
      });
      if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
      const json = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
      const q = json[spec.coingeckoId];
      if (!q || typeof q.usd !== "number") throw new Error("no CoinGecko price");
      return { symbol: spec.symbol, name: spec.name, price: q.usd, changePct: q.usd_24h_change ?? 0, live: true, currency: "USD" };
    } catch {
      const k = await krakenQuote(spec.symbol);
      return k ? { symbol: spec.symbol, name: spec.name, price: k.price, changePct: k.changePct, live: true, currency: "USD" } : null;
    } finally {
      clearTimeout(timer);
    }
  }
  if (spec.type === "stock" && spec.yahoo) {
    return fetchYahooOne({ symbol: spec.symbol, name: spec.name, ticker: spec.yahoo });
  }
  return null;
}

function buildDashboard(ticker: TickerItem[], featured?: TickerItem): DashboardData {
  const pick = (symbol: string): TickerItem =>
    ticker.find((i) => i.symbol === symbol) ?? MOCK.find((i) => i.symbol === symbol)!;
  return {
    overview: [pick("SPX"), pick("IXIC")],
    indices: [pick("DXY"), pick("XAU")],
    featured: featured ?? pick("BTC"),
    updatedAt: new Date().toISOString(),
  };
}

export function getMockPayload(): QuotesPayload {
  const ticker = getMockTicker();
  const spot = getFeatured();
  // With a daily spotlight the price is unknown until the live call answers (price 0 = "unavailable").
  const featured: TickerItem | undefined = spot
    ? { symbol: spot.symbol, name: spot.name, price: 0, changePct: 0, live: false }
    : undefined;
  return { ticker, dashboard: buildDashboard(ticker, featured) };
}

/** Builds the full /api/quotes payload: live crypto + indicative mocks. Never throws. */
export async function fetchDashboard(): Promise<QuotesPayload> {
  const spot = getFeatured();
  const [crypto, equities, spotQuote] = await Promise.all([
    fetchCrypto(),
    fetchEquities(),
    spot ? fetchFeaturedQuote(spot) : Promise.resolve(null),
  ]);
  const ticker = mergeTicker([...crypto, ...equities]);
  const featured: TickerItem | undefined = spot
    ? spotQuote ?? { symbol: spot.symbol, name: spot.name, price: 0, changePct: 0, live: false }
    : undefined;
  return { ticker, dashboard: buildDashboard(ticker, featured) };
}

/* ---------- Sentiment ---------- */

export type SentimentLabel = "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed";

export function sentimentLabel(score: number): SentimentLabel {
  if (score <= 28) return "Extreme Fear";
  if (score <= 44) return "Fear";
  if (score <= 56) return "Neutral";
  if (score <= 72) return "Greed";
  return "Extreme Greed";
}

/** Maps a set of % changes to a 15–85 sentiment score. */
export function sentimentFromChanges(changes: number[]): { score: number; label: SentimentLabel } {
  const valid = changes.filter((c) => Number.isFinite(c));
  const mean = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
  const score = Math.round(Math.min(85, Math.max(15, 50 + mean * 12)));
  return { score, label: sentimentLabel(score) };
}

/** FNV-1a 32-bit hash — deterministic across server and client. */
export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Score 15–85 from hash(YYYY-MM-DD + region): changes daily, stable within a day. */
export function dailyScore(isoDate: string, code: string): number {
  return 15 + (hashString(`${isoDate}:${code}`) % 71);
}
