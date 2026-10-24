export type CategorySlug =
  | "markets"
  | "macro"
  | "equities"
  | "digital-assets"
  | "islamic-finance"
  | "investing"
  | "business"
  | "politics"
  | "stock"
  | "learn";

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
  count: number;
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: CategorySlug;
  date: string; // ISO yyyy-mm-dd
  publishedAt?: string; // full ISO timestamp (set by the generator)
  image: string;
  readTime: number; // minutes
  content: string; // plain text, "## " lines are section headings
  imageCredit?: string; // e.g. "Photo by X on Pexels"
  sources?: { title: string; url: string }[]; // set by the generator
  generated?: boolean;
  metaDescription?: string; // <meta name="description">, 130-155 chars
  keywords?: string[]; // primary keyword first
}

export interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  /** true when the value came from a live source, false for indicative mock data */
  live: boolean;
  currency?: string; // e.g. "USD", "EUR", "SAR" (stocks are quoted in local currency)
}

export interface DashboardData {
  overview: TickerItem[]; // S&P 500, NASDAQ
  indices: TickerItem[]; // DXY, Gold
  featured: TickerItem; // Bitcoin
  updatedAt: string; // ISO timestamp
}

export interface QuotesPayload {
  ticker: TickerItem[];
  dashboard: DashboardData;
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  topic: string;
  regions: string[]; // e.g. ["Africa", "MENA"] or ["Global"]
  country?: string;
  lang?: string; // source language when not English, e.g. "fr"
  translatedFrom?: string; // set when title/summary were machine-translated to English
  publishedAt: string; // ISO timestamp
  summary: string;
}

export interface NewsPayload {
  items: NewsItem[];
  updatedAt: string;
  sources: { ok: number; total: number };
  failed: string[];
  errors?: { name: string; error: string }[];
}
