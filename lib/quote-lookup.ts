import universe from "../data/universe.json";
import { fetchYahooOne } from "./market-data";

export interface QuoteHit {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  currency?: string;
  kind?: string; // e.g. "EQUITY", "ETF", "CRYPTOCURRENCY", "INDEX"
  exchange?: string;
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
const MAX_RESULTS = 14;

function envKey(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

/**
 * Twelve Data (twelvedata.com, free key, ~800 requests/day) covers many more exchanges worldwide than
 * Yahoo's unofficial search, including most of Europe, the Gulf, and Asia. Used when TWELVEDATA_API_KEY
 * is set; the search silently falls back to Yahoo + our own universe when it is not.
 */
async function twelveDataSearch(q: string, key: string): Promise<{ symbol: string; name: string; exchange?: string; kind?: string }[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(q)}&outputsize=8&apikey=${key}`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: { symbol?: string; instrument_name?: string; exchange?: string; instrument_type?: string; country?: string }[] };
    return (json.data ?? [])
      .filter((d) => d.symbol && d.instrument_name)
      .map((d) => ({
        symbol: d.exchange && !["NASDAQ", "NYSE"].includes(d.exchange) ? `${d.symbol}:${d.exchange}` : (d.symbol as string),
        name: `${d.instrument_name}${d.country && d.country !== "United States" ? ` (${d.country})` : ""}`,
        exchange: d.exchange,
        kind: d.instrument_type,
      }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function twelveDataQuote(symbol: string, key: string): Promise<{ price: number; changePct: number; currency?: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${key}`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { close?: string; percent_change?: string; currency?: string; status?: string };
    const price = Number(json.close);
    if (json.status === "error" || !Number.isFinite(price) || price <= 0) return null;
    return { price, changePct: Number(json.percent_change) || 0, currency: json.currency };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Looks up live quotes for a ticker or a company/coin name. Best effort: returns [] when providers are unreachable. */
export async function lookupQuotes(raw: string): Promise<QuoteHit[]> {
  const q = raw.trim();
  if (!/^[\p{L}\p{N} .&^=:\-]{1,40}$/u.test(q)) return [];
  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.hits;

  const tdKey = envKey("TWELVEDATA_API_KEY");
  const hits: QuoteHit[] = [];
  const seen = new Set<string>();

  // 1) Twelve Data: broadest coverage (most exchanges worldwide), when a key is configured.
  if (tdKey && key.length >= 2) {
    const results = await twelveDataSearch(q, tdKey);
    const quotes = await Promise.all(results.map((r) => twelveDataQuote(r.symbol, tdKey)));
    results.forEach((r, i) => {
      const quote = quotes[i];
      if (!quote || seen.has(r.symbol)) return;
      seen.add(r.symbol);
      hits.push({ symbol: r.symbol, name: r.name, exchange: r.exchange, kind: r.kind, ...quote });
    });
  }

  // 2) Our curated universe + Yahoo's own search, merged in (covers crypto, and backs up Twelve Data).
  const wantedYahoo = new Map<string, { name: string; kind?: string }>();
  if (/^[A-Za-z0-9.^=\-]{1,12}$/.test(q) && !seen.has(q.toUpperCase())) wantedYahoo.set(q.toUpperCase(), { name: q.toUpperCase() });
  for (const u of universe as UniverseItem[]) {
    const matches = u.symbol.toLowerCase() === key || u.name.toLowerCase().includes(key);
    if (!matches || key.length < 2) continue;
    const ticker = u.type === "crypto" ? `${u.symbol}-USD` : (u.yahoo ?? u.symbol);
    if (!seen.has(ticker)) wantedYahoo.set(ticker, { name: u.name, kind: u.type === "crypto" ? "CRYPTOCURRENCY" : "EQUITY" });
  }
  if (key.length >= 2 && hits.length < MAX_RESULTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`, {
        signal: controller.signal,
        headers: { "user-agent": UA, accept: "application/json" },
      });
      if (res.ok) {
        const json = (await res.json()) as { quotes?: { symbol?: string; shortname?: string; longname?: string; quoteType?: string; exchange?: string }[] };
        for (const x of json.quotes ?? []) {
          if (!x.symbol || seen.has(x.symbol) || !["EQUITY", "ETF", "CRYPTOCURRENCY", "INDEX", "CURRENCY", "MUTUALFUND"].includes(x.quoteType ?? "")) continue;
          if (!wantedYahoo.has(x.symbol)) wantedYahoo.set(x.symbol, { name: x.longname ?? x.shortname ?? x.symbol, kind: x.quoteType });
        }
      }
    } catch {
      /* unofficial endpoint: ignore failures */
    } finally {
      clearTimeout(timer);
    }
  }

  const entries = [...wantedYahoo].slice(0, Math.max(0, MAX_RESULTS - hits.length));
  const quotes = await Promise.all(entries.map(([ticker, meta]) => fetchYahooOne({ symbol: ticker, name: meta.name, ticker })));
  quotes.forEach((t, i) => {
    if (t && t.price > 0 && !seen.has(entries[i][0])) {
      seen.add(entries[i][0]);
      hits.push({ symbol: entries[i][0], name: entries[i][1].name, price: t.price, changePct: t.changePct, currency: t.currency, kind: entries[i][1].kind });
    }
  });

  const result = hits.slice(0, MAX_RESULTS);
  cache.set(key, { at: Date.now(), hits: result });
  if (cache.size > 200) cache.delete(cache.keys().next().value as string);
  return result;
}
