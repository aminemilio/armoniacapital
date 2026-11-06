import universe from "../data/universe.json";
import { fetchYahooOne } from "./market-data";

export interface QuoteHit {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  currency?: string;
  kind?: string; // e.g. "EQUITY", "ETF", "CRYPTOCURRENCY", "INDEX"
}

interface UniverseItem {
  symbol: string;
  name: string;
  type: "stock" | "crypto";
  yahoo?: string;
}

const cache = new Map<string, { at: number; hits: QuoteHit[] }>();
const TTL = 5 * 60_000;
const UA = "Mozilla/5.0 (compatible; ArmoniaCapital/1.0)";

/** Looks up live quotes for a ticker or a company/coin name. Best effort: returns [] when providers are unreachable. */
export async function lookupQuotes(raw: string): Promise<QuoteHit[]> {
  const q = raw.trim();
  if (!/^[\p{L}\p{N} .&^=\-]{1,40}$/u.test(q)) return [];
  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.hits;

  const wanted = new Map<string, { name: string; kind?: string }>();

  // 1) looks like a ticker
  if (/^[A-Za-z0-9.^=\-]{1,12}$/.test(q)) wanted.set(q.toUpperCase(), { name: q.toUpperCase() });

  // 2) assets we already follow (our curated universe)
  for (const u of universe as UniverseItem[]) {
    const matches = u.symbol.toLowerCase() === key || u.name.toLowerCase().includes(key);
    if (!matches || key.length < 2) continue;
    const ticker = u.type === "crypto" ? `${u.symbol}-USD` : (u.yahoo ?? u.symbol);
    wanted.set(ticker, { name: u.name, kind: u.type === "crypto" ? "CRYPTOCURRENCY" : "EQUITY" });
  }

  // 3) Yahoo's symbol search, to resolve names such as "nvidia" or "saudi aramco"
  if (key.length >= 2) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=5&newsCount=0`, {
        signal: controller.signal,
        headers: { "user-agent": UA, accept: "application/json" },
      });
      if (res.ok) {
        const json = (await res.json()) as { quotes?: { symbol?: string; shortname?: string; longname?: string; quoteType?: string }[] };
        for (const x of json.quotes ?? []) {
          if (!x.symbol || !["EQUITY", "ETF", "CRYPTOCURRENCY", "INDEX", "CURRENCY", "MUTUALFUND"].includes(x.quoteType ?? "")) continue;
          if (!wanted.has(x.symbol)) wanted.set(x.symbol, { name: x.longname ?? x.shortname ?? x.symbol, kind: x.quoteType });
        }
      }
    } catch {
      /* unofficial endpoint: ignore failures */
    } finally {
      clearTimeout(timer);
    }
  }

  const entries = [...wanted].slice(0, 6);
  const quotes = await Promise.all(entries.map(([ticker, meta]) => fetchYahooOne({ symbol: ticker, name: meta.name, ticker })));
  const hits: QuoteHit[] = [];
  quotes.forEach((t, i) => {
    if (t && t.price > 0) hits.push({ symbol: entries[i][0], name: entries[i][1].name, price: t.price, changePct: t.changePct, currency: t.currency, kind: entries[i][1].kind });
  });
  cache.set(key, { at: Date.now(), hits });
  if (cache.size > 200) cache.delete(cache.keys().next().value as string);
  return hits;
}
