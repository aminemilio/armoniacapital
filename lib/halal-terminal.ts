/**
 * Halal Terminal (halalterminal.com) provides Sharia-compliance screening for individual stocks: pass/fail across
 * several methodologies, financial ratios, and a purification rate. Free tier: about 50 calls a month, so it is
 * used sparingly, only to ground the Islamic Finance desk's research when the notes already name a specific stock.
 * Set HALALTERMINAL_API_KEY to enable it; without a key this is skipped entirely.
 */
export interface HalalScreen {
  symbol: string;
  compliant: boolean | null;
  methodology?: string;
  purificationRate?: number;
  notes?: string;
}

/** Screens one stock. Returns null when no key is set, the symbol is unknown, or the request fails. */
export async function screenStock(symbol: string): Promise<HalalScreen | null> {
  const key = process.env.HALALTERMINAL_API_KEY?.trim();
  if (!key || !symbol) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`https://api.halalterminal.com/api/screen/${encodeURIComponent(symbol)}`, {
      method: "POST",
      signal: controller.signal,
      headers: { "X-API-Key": key, accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      compliant?: boolean;
      is_compliant?: boolean;
      methodology?: string;
      purification_rate?: number;
      notes?: string;
    };
    const compliant = json.compliant ?? json.is_compliant ?? null;
    if (compliant === null) return null;
    return { symbol, compliant, methodology: json.methodology, purificationRate: json.purification_rate, notes: json.notes };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
