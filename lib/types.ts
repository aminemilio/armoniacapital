export type CategorySlug =
  | "markets"
  | "macro"
  | "equities"
  | "digital-assets"
  | "islamic-finance"
  | "investing"
  | "business"
  | "politics"
  | "stock";

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
  image: string;
  readTime: number; // minutes
  content: string; // plain text, "## " lines are section headings
  imageCredit?: string; // e.g. "Photo by X on Pexels"
  sources?: { title: string; url: string }[]; // set by the generator
  generated?: boolean;
}

export interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  /** true when the value came from a live source, false for indicative mock data */
  live: boolean;
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
