import type { MetadataRoute } from "next";
import { ARTICLES, CATEGORY_META } from "@/lib/articles";
import { REGIONS } from "@/lib/regions";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL ?? "https://armoniacapital.com";
  const pages = ["", "/about", "/news", "/learn", "/learn/glossary", "/disclaimer", "/privacy", "/terms"].map((p) => ({ url: `${base}${p}` }));
  const regions = REGIONS.map((r) => ({ url: `${base}/news/${r.slug}` }));
  const categories = Object.keys(CATEGORY_META).map((s) => ({ url: `${base}/category/${s}` }));
  const articles = ARTICLES.map((a) => ({ url: `${base}/articles/${a.slug}`, lastModified: a.publishedAt ?? a.date }));
  return [...pages, ...regions, ...categories, ...articles];
}
