"use client";

import { useEffect, useState } from "react";
import { getMockPayload } from "./market-data";
import type { QuotesPayload } from "./types";

export type QuotesStatus = "loading" | "live" | "fallback";

function isPayload(value: unknown): value is QuotesPayload {
  const v = value as QuotesPayload | null;
  return Boolean(v && Array.isArray(v.ticker) && v.ticker.length > 0 && v.dashboard?.featured);
}

/**
 * Polls /api/quotes every minute. Starts from mock data so the UI is never empty,
 * and falls back to the last good (or mock) data if a request fails.
 */
export function useQuotes(intervalMs = 60_000): { data: QuotesPayload; status: QuotesStatus } {
  const [data, setData] = useState<QuotesPayload>(() => getMockPayload());
  const [status, setStatus] = useState<QuotesStatus>("loading");

  useEffect(() => {
    let active = true;

    async function load() {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch("/api/quotes", { cache: "no-store", signal: controller.signal });
        if (!res.ok) throw new Error(`quotes ${res.status}`);
        const json: unknown = await res.json();
        if (!isPayload(json)) throw new Error("bad payload");
        if (active) {
          setData(json);
          setStatus("live");
        }
      } catch {
        if (active) setStatus("fallback");
      } finally {
        clearTimeout(timer);
      }
    }

    load();
    const id = setInterval(load, intervalMs);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return { data, status };
}
