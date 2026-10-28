import featuredJson from "../data/featured.json";
import archiveJson from "../data/featured-archive.json";

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
  profile?: string; // two short paragraphs separated by a blank line
  sources: { title: string; url: string }[];
}

/** The asset spotlight picked by the daily generator (data/featured.json), or null before the first run. */
export function getFeatured(): FeaturedSpotlight | null {
  return (featuredJson as { current: FeaturedSpotlight | null }).current ?? null;
}

/** Every earlier spotlight, newest first (data/featured-archive.json). */
export function getFeaturedArchive(): FeaturedSpotlight[] {
  return archiveJson as unknown as FeaturedSpotlight[];
}
