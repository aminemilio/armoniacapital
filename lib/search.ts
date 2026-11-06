import { ARTICLES, CATEGORY_META } from "./articles";
import { DESK_META, isDeskKey } from "./desks";
import { GLOSSARY, type GlossaryTerm } from "./glossary";
import { getFeaturedArchive, getFeatured, type FeaturedSpotlight } from "./featured";
import type { Article } from "./types";

const STOP = new Set(["the", "a", "an", "of", "and", "or", "in", "on", "to", "for", "is", "are", "what", "how", "why"]);

export function terms(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^\p{L}\p{N}.&-]+/u)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

function scoreArticle(a: Article, words: string[]): number {
  const title = a.title.toLowerCase();
  const excerpt = a.excerpt.toLowerCase();
  const keywords = (a.keywords ?? []).join(" ").toLowerCase();
  const meta = `${CATEGORY_META[a.category]?.name ?? ""} ${a.desk && isDeskKey(a.desk) ? DESK_META[a.desk].name : ""}`.toLowerCase();
  const body = a.content.toLowerCase();
  let score = 0;
  for (const w of words) {
    const inTitle = title.includes(w);
    const inKw = keywords.includes(w);
    const inEx = excerpt.includes(w);
    const inMeta = meta.includes(w);
    const inBody = body.includes(w);
    if (!(inTitle || inKw || inEx || inMeta || inBody)) return 0; // every word must match somewhere
    score += (inTitle ? 6 : 0) + (inKw ? 4 : 0) + (inEx ? 3 : 0) + (inMeta ? 2 : 0) + (inBody ? 1 : 0);
  }
  return score;
}

export interface SiteResults {
  articles: Article[];
  terms: GlossaryTerm[];
  profiles: FeaturedSpotlight[];
}

/** Searches our own content: articles, glossary terms and featured-asset profiles. */
export function searchSite(q: string): SiteResults {
  const words = terms(q);
  if (words.length === 0) return { articles: [], terms: [], profiles: [] };

  const articles = ARTICLES.map((a) => ({ a, s: scoreArticle(a, words) }))
    .filter((x) => x.s > 0)
    .sort((x, y) => y.s - x.s || (y.a.publishedAt ?? y.a.date).localeCompare(x.a.publishedAt ?? x.a.date))
    .slice(0, 12)
    .map((x) => x.a);

  const glossary = GLOSSARY.filter((t) => words.every((w) => `${t.term} ${t.definition}`.toLowerCase().includes(w))).slice(0, 6);

  const current = getFeatured();
  const all = [...(current ? [current] : []), ...getFeaturedArchive().filter((f) => f.date !== current?.date)];
  const profiles = all
    .filter((f) => words.every((w) => `${f.name} ${f.symbol} ${f.sector ?? ""} ${f.utility}`.toLowerCase().includes(w)))
    .slice(0, 3);

  return { articles, terms: glossary, profiles };
}