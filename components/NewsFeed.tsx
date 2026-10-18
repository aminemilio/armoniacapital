"use client";

import { useEffect, useMemo, useState } from "react";
import type { NewsItem, NewsPayload } from "@/lib/types";
import { cn } from "@/lib/utils";

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

interface Props {
  limit?: number;
  filters?: boolean;
  compact?: boolean;
  /** Only show headlines tagged with this region (must match data/feeds.json "regions"). */
  region?: string;
  /** Preferred order of country filter chips for the region. */
  countries?: string[];
}

export function NewsFeed({ limit = 40, filters = true, compact = false, region, countries }: Props) {
  const [payload, setPayload] = useState<NewsPayload | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [topic, setTopic] = useState("All");
  const [country, setCountry] = useState("All");
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

  const regional = useMemo(() => {
    const all = payload?.items ?? [];
    return region ? all.filter((i) => i.regions?.includes(region)) : all;
  }, [payload, region]);

  const topics = useMemo(() => {
    const set = new Set(regional.map((i) => i.topic));
    return ["All", ...Array.from(set)];
  }, [regional]);

  const countryChips = useMemo(() => {
    if (!region) return [];
    const present = new Set(regional.map((i) => i.country).filter((c): c is string => Boolean(c)));
    const configured = countries ?? [];
    // Configured countries always get a chip, even if their feed is down right now.
    const extra = Array.from(present).filter((c) => !configured.includes(c));
    const all = [...configured, ...extra];
    return all.length > 1 ? ["All", ...all] : [];
  }, [regional, region, countries]);

  const items: NewsItem[] = useMemo(() => {
    let list = regional;
    if (countryChips.length > 0 && country !== "All") list = list.filter((i) => i.country === country);
    else if (!region && topic !== "All") list = list.filter((i) => i.topic === topic);
    return list.slice(0, limit);
  }, [regional, topic, country, countryChips, region, limit]);

  const chips = countryChips.length > 0 ? countryChips : region ? [] : topics;
  const chipValue = countryChips.length > 0 ? country : topic;
  const setChip = countryChips.length > 0 ? setCountry : setTopic;

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

  if (status === "ready" && region && regional.length === 0) {
    return (
      <div className="border border-white/10 bg-ink-2 p-6 text-bone/70">
        No recent {region} headlines yet. Some sources may be temporarily unavailable; check back soon.
      </div>
    );
  }

  if (status === "error" && items.length === 0) {
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
      {filters && chips.length > 2 && (
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label={countryChips.length > 0 ? "Filter news by country" : "Filter news by topic"}>
          {chips.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={chipValue === t}
              onClick={() => setChip(t)}
              className={cn(
                "border px-3 py-1.5 text-xs transition-colors",
                chipValue === t ? "border-brass bg-brass text-ink" : "border-white/15 text-bone/80 hover:border-brass",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className="border border-white/10 bg-ink-2 p-6 text-bone/70">
          No recent headlines for {country !== "All" ? country : "this selection"} yet. The source may be temporarily unavailable.
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
          Headlines from {payload.sources.ok} of {payload.sources.total} sources, refreshed every 5 minutes. Click a headline to read the story
          at the publisher. Third-party content is not edited or endorsed by Armonia Capital.
        </p>
      )}
    </div>
  );
}
