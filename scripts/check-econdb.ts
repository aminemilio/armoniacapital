/**
 * Tests every series in data/econdb-series.json and prints what Econdb actually returns.
 *
 *   npm run check-econdb
 *
 * Econdb ticker codes are not standardised in a guessable way, so every series ships disabled. To find a
 * ticker: search the indicator and country on econdb.com, open the series, and read the ticker from its URL
 * or page. Then set "enabled": true in data/econdb-series.json for the ones that come back OK here.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { EcondbSeries } from "../lib/econdb";

async function check(s: EcondbSeries): Promise<string> {
  try {
    const res = await fetch(`https://www.econdb.com/api/series/?ticker=${encodeURIComponent(s.ticker)}&format=json`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return `FAIL  HTTP ${res.status}`;
    const json = (await res.json()) as { results?: { ticker?: string; data?: { values?: number[]; dates?: string[] } }[] };
    const row = json.results?.find((r) => r.ticker === s.ticker) ?? json.results?.[0];
    const n = row?.data?.values?.length ?? 0;
    if (n === 0) return "FAIL  no data points returned (wrong ticker?)";
    const date = row?.data?.dates?.[n - 1];
    const value = row?.data?.values?.[n - 1];
    return `OK    latest ${date}: ${value}`;
  } catch (err) {
    return `FAIL  ${(err as Error).message}`;
  }
}

async function main(): Promise<void> {
  const list = JSON.parse(await readFile(path.join(process.cwd(), "data", "econdb-series.json"), "utf8")) as EcondbSeries[];
  console.log(`Checking ${list.length} series…\n`);
  for (const s of list) {
    console.log(`${(await check(s)).padEnd(42)} ${s.ticker.padEnd(16)} ${s.label}${s.enabled ? "" : "  (disabled)"}`);
  }
  console.log('\nSet "enabled": true in data/econdb-series.json for the lines that say OK.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
