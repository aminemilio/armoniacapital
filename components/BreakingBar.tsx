"use client";

import { useEffect, useMemo, useState } from "react";
import { findBreaking, type BreakingItem } from "@/lib/breaking";
import type { NewsPayload } from "@/lib/types";

const ROTATE_MS = 8000;
const REFRESH_MS = 5 * 60_000;

function ageLabel(min: number): string {
  if (min < 60) return `${Math.max(1, Math.round(min))}m ago`;
  return `${Math.round(min / 60)}h ago`;
}

/** Rotating strip of stories covered by 2+ independent sources in the last few hours. Hidden when there are none. */
export function BreakingBar() {
  const [items, setItems] = useState<BreakingItem[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/news", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as NewsPayload;
        if (!active) return;
        setItems(findBreaking(json.items, Date.now()));
      } catch {
        /* keep showing the previous set on a failed refresh */
      }
    }
    load();
    const refresh = setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(refresh);
    };
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [items.length]);

  const current = useMemo(() => items[index % Math.max(items.length, 1)], [items, index]);
  if (!current) return null;

  return (
    <div className="border-b border-brass/40 bg-fall/10" role="region" aria-label="Breaking news">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:px-6">
        <span className="shrink-0 rounded-sm bg-fall px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-bone">
          Breaking
        </span>
        <a
          key={current.url}
          href={current.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="min-w-0 flex-1 truncate text-sm text-bone hover:text-brass-light"
        >
          {current.headline}
        </a>
        <span className="hidden shrink-0 font-mono text-xs text-slate sm:inline">
          {current.sources.length} sources · {ageLabel(current.ageMinutes)}
        </span>
      </div>
    </div>
  );
}
