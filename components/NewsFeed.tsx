"use client";

import { useEffect, useMemo, useState } from "react";
import type { NewsItem, NewsPayload } from "@/lib/types";

function timeAgo(iso: string, now: number): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

const LANGS: Record<string, string> = { fr: "French", ar: "Arabic", es: "Spanish", de: "German", pt: "Portuguese" };

interface Props {
  limit?: number;
  compact?: boolean;
  /** Only headlines tagged with this region (matches data/feeds.json "regions"). */
  region?: string;
  country?: string;
  topic?: string;
}

export function NewsFeed({ limit = 40, compact = false, region, country, topic }: Props) {
  const [payload, setPayload] = useState<NewsPayload | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [now, setNow] = useState(() => Date.now());
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      try {
        const res = await fetch("/api/news", { cache: "no-store", signal: controller.signal });
        if (!res.ok) throw new Error(`news ${res.status}`);
        const json = (await res.json()) as NewsPayload;
        if (!active) return;
        setPayload(json);
        setStatus(json.items.length > 0 ? "ready" : "error");
      } catch {
        if (active) setStatus((s) => (s === "ready" ? s : "error"));
      } finally {
        clearTimeout(timer);
      }
    }
    load();
    const refresh = setInterval(load, 5 * 60_000);
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      active = false;
      clearInterval(refresh);
      clearInterval(tick);
    };
  }, [attempt]);

  const items: NewsItem[] = useMemo(() => {
    let list = payload?.items ?? [];
    if (region) list = list.filter((i) => i.regions?.includes(region));
    if (country) list = list.filter((i) => i.country === country);
    if (topic) list = list.filter((i) => i.topic === topic);
    return list.slice(0, limit);
  }, [payload, region, country, topic, limit]);

  if (status === "loading") {
    return (
      <ul aria-busy="true" className="divide-y divide-white/10">
        {Array.from({ length: compact ? 5 : 8 }).map((_, i) => (
          <li key={i} className="py-4">
            <div className="h-3 w-40 animate-pulse bg-white/10" />
            <div className="mt-3 h-5 w-4/5 animate-pulse bg-white/10" />
          </li>
        ))}
      </ul>
    );
  }

  if (status === "error" && !payload) {
    return (
      <div className="border border-white/10 bg-ink-2 p-6 text-bone/70">
        <p>News is temporarily unavailable.</p>
        <button
          type="button"
          onClick={() => {
            setStatus("loading");
            setAttempt((n) => n + 1);
          }}
          className="mt-3 text-sm text-brass-light underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      {items.length === 0 && (
        <div className="border border-white/10 bg-ink-2 p-6 text-bone/70">
          No recent headlines for {[region, country, topic].filter(Boolean).join(" › ") || "this selection"} yet. The source may be temporarily
          unavailable; check back soon.
        </div>
      )}

      <ul className="divide-y divide-white/10">
        {items.map((item) => (
          <li key={item.id} className="py-4">
            <div className="flex flex-wrap items-center gap-x-2 font-mono text-xs text-slate">
              <span className="text-brass-light">{item.source}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={item.publishedAt}>{timeAgo(item.publishedAt, now)}</time>
              {!compact && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{item.country ?? item.topic}</span>
                </>
              )}
              {item.translatedFrom && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate/80">Translated from {LANGS[item.translatedFrom] ?? item.translatedFrom}</span>
                </>
              )}
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-1 block font-serif text-lg leading-snug text-bone hover:text-brass-light"
            >
              {item.title}
            </a>
            {!compact && item.summary && <p className="mt-1 text-sm leading-relaxed text-bone/65">{item.summary}</p>}
          </li>
        ))}
      </ul>

      {payload && (
        <p className="mt-4 text-xs text-slate">
          Headlines from {payload.sources.ok} of {payload.sources.total} sources, refreshed every 5 minutes. Click a headline to read the story at
          the publisher. Third-party content is not edited or endorsed by Armonia Capital.
        </p>
      )}
    </div>
  );
}
