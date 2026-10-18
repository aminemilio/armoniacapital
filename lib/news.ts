import feedsJson from "../data/feeds.json";
import { parseFeed } from "./rss";
import type { NewsItem, NewsPayload } from "./types";

export interface FeedSource {
  name: string;
  url: string;
  topic: string;
  regions?: string[];
  country?: string;
  enabled?: boolean;
  verified?: boolean; // informational: URL confirmed to exist when the list was written
}

const TTL_MS = 5 * 60 * 1000;
const PER_SOURCE = 12;
const MAX_ITEMS = 260;
const UA = "Mozilla/5.0 (compatible; ArmoniaCapitalBot/1.0; +https://armoniacapital.com)";

let cache: { at: number; data: NewsPayload } | null = null;

export const FEEDS = feedsJson as FeedSource[];

async function loadOne(feed: FeedSource): Promise<NewsItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        "user-agent": UA,
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = (await res.text()).slice(0, 2_000_000);
    const items = parseFeed(xml, feed);
    if (items.length === 0) throw new Error("no items parsed");
    return items;
  } finally {
    clearTimeout(timer);
  }
}

function dedupeKey(i: NewsItem): string {
  return i.url.replace(/[?#].*$/, "").replace(/\/$/, "").toLowerCase();
}

/** Aggregated headlines from data/feeds.json. Failing feeds are skipped; cached 5 minutes per instance. */
export async function getNews(force = false): Promise<NewsPayload> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.data;

  const active = FEEDS.filter((f) => f.enabled !== false);
  const settled = await Promise.allSettled(active.map(loadOne));
  const failed: string[] = [];
  const errors: { name: string; error: string }[] = [];
  const now = Date.now();
  let all: NewsItem[] = [];

  settled.forEach((r, idx) => {
    if (r.status === "fulfilled") {
      const items = r.value
        .map((i) => (new Date(i.publishedAt).getTime() > now + 10 * 60_000 ? { ...i, publishedAt: new Date(now).toISOString() } : i))
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
        .slice(0, PER_SOURCE);
      all = all.concat(items);
    } else {
      failed.push(active[idx].name);
      errors.push({ name: active[idx].name, error: String((r.reason as Error)?.message ?? r.reason).slice(0, 120) });
    }
  });

  const seen = new Set<string>();
  const items = all
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .filter((i) => {
      const k = dedupeKey(i);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, MAX_ITEMS);

  const data: NewsPayload = {
    items,
    updatedAt: new Date().toISOString(),
    sources: { ok: active.length - failed.length, total: active.length },
    failed,
    errors,
  };

  // Keep serving the last good result if everything failed this time.
  if (items.length === 0 && cache && cache.data.items.length > 0) return cache.data;
  cache = { at: Date.now(), data };
  return data;
}
