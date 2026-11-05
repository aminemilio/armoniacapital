/**
 * Econdb (econdb.com) is a free, keyless API for official macroeconomic series (GDP, CPI, unemployment, and more),
 * sourced from central banks and statistics offices. Used to ground the US/EU/China desk research in real,
 * dated figures instead of relying only on web search text.
 *
 * Econdb's exact ticker codes vary by indicator and country and are not guessable reliably, so every series in
 * data/econdb-series.json starts disabled. Run `npm run check-econdb` after looking up the tickers you want on
 * econdb.com (search a series there, the ticker is in its URL and on the page) and set "enabled": true on the
 * ones that return data.
 */
export interface EcondbSeries {
  ticker: string;
  label: string;
  enabled?: boolean;
}

export interface EcondbPoint {
  label: string;
  ticker: string;
  date: string;
  value: number;
  unit?: string;
}

async function fetchOne(series: EcondbSeries): Promise<EcondbPoint | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`https://www.econdb.com/api/series/?ticker=${encodeURIComponent(series.ticker)}&format=json`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      results?: { ticker?: string; unit?: string; data?: { values?: number[]; dates?: string[] } }[];
    };
    const row = json.results?.find((r) => r.ticker === series.ticker) ?? json.results?.[0];
    const dates = row?.data?.dates ?? [];
    const values = row?.data?.values ?? [];
    if (dates.length === 0 || values.length === 0) return null;
    const i = dates.length - 1;
    const value = values[i];
    if (!Number.isFinite(value)) return null;
    return { label: series.label, ticker: series.ticker, date: dates[i], value, unit: row?.unit };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Reads data/econdb-series.json and fetches every series marked "enabled": true. Best effort: skips failures. */
export async function fetchEcondbSnapshot(seriesList: EcondbSeries[]): Promise<EcondbPoint[]> {
  const active = seriesList.filter((s) => s.enabled);
  if (active.length === 0) return [];
  const results = await Promise.all(active.map(fetchOne));
  return results.filter((r): r is EcondbPoint => r !== null);
}
