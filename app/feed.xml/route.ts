import { getAllArticles, getCategoryName } from "@/lib/articles";

export const dynamic = "force-static";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export function GET() {
  const site = process.env.SITE_URL ?? "https://armoniacapital.com";
  const articles = getAllArticles().slice(0, 30);
  const items = articles
    .map((a) => {
      const url = `${site}/articles/${a.slug}`;
      const date = new Date(a.publishedAt ?? `${a.date}T06:00:00Z`).toUTCString();
      return `<item><title>${esc(a.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${date}</pubDate><category>${esc(getCategoryName(a.category))}</category><description>${esc(a.metaDescription ?? a.excerpt)}</description></item>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Armonia Capital</title><link>${site}</link><description>Market intelligence through an equilibrium lens, with Islamic finance coverage. Not investment advice.</description><language>en</language><atom:link href="${site}/feed.xml" rel="self" type="application/rss+xml"/><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}</channel></rss>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=900" },
  });
}
