import { XMLParser } from "fast-xml-parser";
import type { NewsItem } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  processEntities: true,
  htmlEntities: true,
});

const asArray = (v: unknown): any[] => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);

function text(v: unknown): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "object" && "#text" in (v as object)) return text((v as any)["#text"]);
  return "";
}

function safeChar(code: number): string {
  try {
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
  } catch {
    return "";
  }
}

/** Removes markup and decodes common entities. Output is plain text only. */
export function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => safeChar(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeChar(parseInt(h, 16)))
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…";
}

function linkOf(item: any): string {
  for (const l of asArray(item.link)) {
    if (typeof l === "string" && l.trim()) return l.trim();
    if (l && typeof l === "object") {
      const href = l["@_href"];
      const rel = l["@_rel"];
      if (typeof href === "string" && (!rel || rel === "alternate")) return href.trim();
      const t = text(l);
      if (t) return t.trim();
    }
  }
  const guid = text(item.guid).trim();
  return /^https?:\/\//.test(guid) ? guid : "";
}

function dateOf(item: any): string | null {
  const raw = text(item.pubDate) || text(item.published) || text(item.updated) || text(item["dc:date"]);
  if (!raw) return null;
  const d = new Date(raw.trim());
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Parses RSS 2.0, Atom and RSS 1.0 (RDF) into normalised news items. Never throws on bad items. */
export function parseFeed(xml: string, feed: { name: string; topic: string; regions?: string[]; country?: string; lang?: string }): NewsItem[] {
  const doc = parser.parse(xml) as any;
  const raw = asArray(doc?.rss?.channel?.item ?? doc?.feed?.entry ?? doc?.["rdf:RDF"]?.item);
  const out: NewsItem[] = [];
  for (const item of raw) {
    try {
      const title = stripHtml(text(item.title));
      const url = linkOf(item);
      const publishedAt = dateOf(item);
      if (!title || !/^https?:\/\//i.test(url) || !publishedAt) continue;
      let summary = stripHtml(text(item.description) || text(item.summary) || text(item["content:encoded"]) || text(item.content));
      if (summary.toLowerCase() === title.toLowerCase()) summary = "";
      out.push({ id: url, title: truncate(title, 200), url, source: feed.name, topic: feed.topic, regions: feed.regions ?? ["Global"], country: feed.country, lang: feed.lang, publishedAt, summary: truncate(summary, 240) });
    } catch {
      /* skip malformed item */
    }
  }
  return out;
}
