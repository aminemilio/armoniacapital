import featuredJson from "../data/featured.json";

export interface FeaturedSpotlight {
  date: string; // YYYY-MM-DD
  symbol: string;
  name: string;
  type: "stock" | "crypto";
  coingeckoId?: string;
  yahoo?: string;
  sector?: string;
  utility: string;
  evidence: string[];
  whyNow: string;
  risks: string[];
  sources: { title: string; url: string }[];
}

/** The asset spotlight picked by the daily generator (data/featured.json), or null before the first run. */
export function getFeatured(): FeaturedSpotlight | null {
  return (featuredJson as { current: FeaturedSpotlight | null }).current ?? null;
}
