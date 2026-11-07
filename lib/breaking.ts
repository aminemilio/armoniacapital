import type { NewsItem } from "./types";

export interface BreakingItem {
  headline: string;
  url: string;
  sources: string[];
  ageMinutes: number;
}

const STOP = new Set([
  "the", "a", "an", "of", "and", "or", "in", "on", "to", "for", "is", "are", "with", "as", "by", "at",
  "its", "it's", "after", "over", "amid", "says", "said", "new", "news",
]);

function keywords(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const w of a) if (b.has(w)) n++;
  return n;
}

/**
 * Finds stories covered by 2+ independent sources within the last `maxAgeHours`, which is a reasonable proxy
 * for "breaking" without a dedicated breaking-news API. Pure function: easy to test without the network.
 */
export function findBreaking(items: NewsItem[], now: number, maxAgeHours = 6, minSources = 2): BreakingItem[] {
  const recent = items.filter((i) => (now - new Date(i.publishedAt).getTime()) / 3_600_000 <= maxAgeHours);
  const kw = recent.map((i) => ({ item: i, words: keywords(i.title) }));
  const used = new Set<number>();
  const clusters: { items: typeof kw; score: number }[] = [];

  for (let i = 0; i < kw.length; i++) {
    if (used.has(i) || kw[i].words.size === 0) continue;
    const group = [kw[i]];
    used.add(i);
    for (let j = i + 1; j < kw.length; j++) {
      if (used.has(j)) continue;
      if (overlap(kw[i].words, kw[j].words) >= 3 && kw[i].item.source !== kw[j].item.source) {
        group.push(kw[j]);
        used.add(j);
      }
    }
    const sources = new Set(group.map((g) => g.item.source));
    if (sources.size >= minSources) {
      const newest = group.reduce((a, b) => (a.item.publishedAt > b.item.publishedAt ? a : b));
      const ageMin = (now - new Date(newest.item.publishedAt).getTime()) / 60_000;
      // Favour more sources, then freshness.
      clusters.push({ items: group, score: sources.size * 1000 - ageMin });
    }
  }

  return clusters
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((c) => {
      const newest = c.items.reduce((a, b) => (a.item.publishedAt > b.item.publishedAt ? a : b));
      return {
        headline: newest.item.title,
        url: newest.item.url,
        sources: [...new Set(c.items.map((g) => g.item.source))],
        ageMinutes: Math.round((now - new Date(newest.item.publishedAt).getTime()) / 60_000),
      };
    });
}
