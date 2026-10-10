import type { MetadataRoute } from "next";
import { ARTICLES, CATEGORY_META } from "@/lib/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL ?? "https://armoniacapital.com";
  const pages = ["", "/about", "/disclaimer", "/privacy", "/terms"].map((p) => ({ url: `${base}${p}` }));
  const categories = Object.keys(CATEGORY_META).map((s) => ({ url: `${base}/category/${s}` }));
  const articles = ARTICLES.map((a) => ({ url: `${base}/articles/${a.slug}`, lastModified: a.date }));
  return [...pages, ...categories, ...articles];
}
