/**
 * Tests every feed in data/feeds.json from YOUR machine and prints a report.
 *
 *   npm run check-feeds           (enabled feeds only)
 *   npm run check-feeds -- --all  (include disabled feeds)
 *
 * Use it after adding feeds: set "enabled": false (or delete) any line that says FAIL.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseFeed } from "../lib/rss";

interface Feed {
  name: string;
  url: string;
  topic: string;
  regions?: string[];
  country?: string;
  enabled?: boolean;
  verified?: boolean;
}

const UA = "Mozilla/5.0 (compatible; ArmoniaCapitalBot/1.0; +https://armoniacapital.com)";

function ago(iso: string): string {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
  return h < 48 ? `${Math.max(h, 0)}h ago` : `${Math.round(h / 24)}d ago`;
}

async function check(feed: Feed): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: { "user-agent": UA, accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" },
    });
    if (!res.ok) return `FAIL  HTTP ${res.status}`;
    const items = parseFeed((await res.text()).slice(0, 2_000_000), feed);
    if (items.length === 0) return "FAIL  no items parsed (not a feed, or blocked)";
    const newest = items.map((i) => i.publishedAt).sort().pop() as string;
    return `OK    ${items.length} items, newest ${ago(newest)}`;
  } catch (err) {
    return `FAIL  ${(err as Error).name === "AbortError" ? "timeout" : (err as Error).message}`;
  } finally {
    clearTimeout(timer);
  }
}

async function main(): Promise<void> {
  const all = process.argv.includes("--all");
  const feeds = JSON.parse(await readFile(path.join(process.cwd(), "data", "feeds.json"), "utf8")) as Feed[];
  const list = feeds.filter((f) => all || f.enabled !== false);
  console.log(`Checking ${list.length} feeds…\n`);
  const results = await Promise.all(list.map(async (f) => ({ f, r: await check(f) })));
  let failed = 0;
  for (const { f, r } of results) {
    if (r.startsWith("FAIL")) failed++;
    console.log(`${r.padEnd(46)} ${f.name}${f.enabled === false ? " (disabled)" : ""}  [${(f.regions ?? []).join("/")}${f.country ? " · " + f.country : ""}]`);
  }
  console.log(`\n${list.length - failed} OK, ${failed} failed. Set "enabled": false on failing feeds in data/feeds.json.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
