"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Compass, Euro, Globe, Layers, Menu, Newspaper, Sun, X } from "lucide-react";
import { NEWS_TOPICS, REGIONS } from "@/lib/regions";
import { cn } from "@/lib/utils";

type Icon = React.ComponentType<{ size?: number; className?: string }>;
const REGION_ICONS: Record<string, Icon> = { europe: Euro, africa: Globe, asia: Compass, mena: Sun };

export interface NewsSelection {
  country?: string;
  topic?: string;
}

interface Props {
  /** Slug of the region page we are on (undefined on /news). */
  region?: string;
  selection: NewsSelection;
  /** Called instead of navigating when the clicked link stays on the current page. */
  onSelect: (next: NewsSelection) => void;
}

const row = "flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] transition-colors";

export function NewsMenu({ region, selection, onSelect }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [open, setOpen] = useState<Set<string>>(() => new Set(region ? [region] : selection.topic ? ["topics"] : []));

  // Deep links (?topic=…) are read after the first render, so open the matching group then.
  useEffect(() => {
    if (selection.topic) setOpen((prev) => (prev.has("topics") ? prev : new Set(prev).add("topics")));
  }, [selection.topic]);
  useEffect(() => {
    if (region) setOpen((prev) => (prev.has(region) ? prev : new Set(prev).add(region)));
  }, [region]);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const activeRegion = REGIONS.find((r) => r.slug === region);
  const label = activeRegion
    ? [activeRegion.name, selection.country].filter(Boolean).join(" · ")
    : selection.topic ?? "All news";

  const isAll = !region && !selection.topic;

  const subLink = (active: boolean) =>
    cn(
      "block border-l-2 py-2.5 pl-4 pr-3 text-sm transition-colors",
      active ? "border-brass text-brass-light" : "border-transparent text-bone/65 hover:text-bone",
    );

  return (
    <nav aria-label="News categories">
      <button
        type="button"
        aria-expanded={mobileOpen}
        aria-controls="news-menu-panel"
        onClick={() => setMobileOpen((v) => !v)}
        className="flex w-full items-center justify-between border border-white/15 bg-ink-2 px-4 py-3 text-bone lg:hidden"
      >
        <span className="flex items-center gap-2">
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          Browse news
        </span>
        <span className="text-sm text-brass-light">{label}</span>
      </button>

      <div
        id="news-menu-panel"
        className={cn("mt-2 divide-y divide-white/5 border border-white/10 bg-ink-2 lg:mt-0 lg:block", mobileOpen ? "block" : "hidden")}
      >
        <Link
          href="/news"
          onClick={(e) => {
            if (!region) {
              e.preventDefault();
              onSelect({});
            }
          }}
          className={cn(row, isAll ? "text-brass-light" : "text-bone/80 hover:text-bone")}
        >
          <Newspaper size={18} className="shrink-0 text-slate" />
          All news
        </Link>

        {REGIONS.map((r) => {
          const Icon = REGION_ICONS[r.slug] ?? Globe;
          const isOpen = open.has(r.slug);
          const here = region === r.slug;
          return (
            <div key={r.slug}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`menu-${r.slug}`}
                onClick={() => toggle(r.slug)}
                className={cn(row, "justify-between", here ? "text-brass-light" : "text-bone/80 hover:text-bone")}
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} className="shrink-0 text-slate" />
                  {r.name}
                </span>
                <ChevronDown size={16} className={cn("text-brass-light transition-transform", isOpen && "rotate-180")} />
              </button>
              <ul id={`menu-${r.slug}`} hidden={!isOpen} className="mb-2 ml-[34px]">
                <li>
                  <Link
                    href={`/news/${r.slug}`}
                    onClick={(e) => {
                      if (here) {
                        e.preventDefault();
                        onSelect({});
                      }
                    }}
                    className={subLink(here && !selection.country)}
                  >
                    All {r.name}
                  </Link>
                </li>
                {r.countries.map((c) => (
                  <li key={c}>
                    <Link
                      href={`/news/${r.slug}?country=${encodeURIComponent(c)}`}
                      onClick={(e) => {
                        if (here) {
                          e.preventDefault();
                          onSelect({ country: c });
                        }
                      }}
                      className={subLink(here && selection.country === c)}
                    >
                      {c}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        <div>
          <button
            type="button"
            aria-expanded={open.has("topics")}
            aria-controls="menu-topics"
            onClick={() => toggle("topics")}
            className={cn(row, "justify-between", selection.topic ? "text-brass-light" : "text-bone/80 hover:text-bone")}
          >
            <span className="flex items-center gap-3">
              <Layers size={18} className="shrink-0 text-slate" />
              Topics
            </span>
            <ChevronDown size={16} className={cn("text-brass-light transition-transform", open.has("topics") && "rotate-180")} />
          </button>
          <ul id="menu-topics" hidden={!open.has("topics")} className="mb-2 ml-[34px]">
            {NEWS_TOPICS.map((t) => (
              <li key={t}>
                <Link
                  href={`/news?topic=${encodeURIComponent(t)}`}
                  onClick={(e) => {
                    if (!region) {
                      e.preventDefault();
                      onSelect({ topic: t });
                    }
                  }}
                  className={subLink(!region && selection.topic === t)}
                >
                  {t}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
