"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { NEWS_TOPICS, REGIONS } from "@/lib/regions";
import { cn } from "@/lib/utils";

const row = "flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-white/5 hover:text-brass-light";
const sub = "block py-2.5 pl-4 pr-3 text-sm text-bone/70 transition-colors hover:text-brass-light";

/** The list shown when you click "News" in the header: All news, regions (with countries), topics. */
export function NewsNavList({ onNavigate, idPrefix = "nn" }: { onNavigate?: () => void; idPrefix?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (id: string) => setOpen((cur) => (cur === id ? null : id));

  return (
    <ul className="divide-y divide-white/5 text-bone/90">
      <li>
        <Link href="/news" onClick={onNavigate} className={row}>
          All news
        </Link>
      </li>

      {REGIONS.map((r) => {
        const isOpen = open === r.slug;
        return (
          <li key={r.slug}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`${idPrefix}-${r.slug}`}
              onClick={() => toggle(r.slug)}
              className={row}
            >
              {r.name}
              <ChevronDown size={16} className={cn("text-brass-light transition-transform", isOpen && "rotate-180")} />
            </button>
            <ul id={`${idPrefix}-${r.slug}`} hidden={!isOpen} className="mb-2 ml-6 border-l border-white/10">
              <li>
                <Link href={`/news/${r.slug}`} onClick={onNavigate} className={sub}>
                  All {r.name}
                </Link>
              </li>
              {r.countries.map((c) => (
                <li key={c}>
                  <Link href={`/news/${r.slug}?country=${encodeURIComponent(c)}`} onClick={onNavigate} className={sub}>
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        );
      })}

      <li>
        <button
          type="button"
          aria-expanded={open === "topics"}
          aria-controls={`${idPrefix}-topics`}
          onClick={() => toggle("topics")}
          className={row}
        >
          Topics
          <ChevronDown size={16} className={cn("text-brass-light transition-transform", open === "topics" && "rotate-180")} />
        </button>
        <ul id={`${idPrefix}-topics`} hidden={open !== "topics"} className="mb-2 ml-6 border-l border-white/10">
          {NEWS_TOPICS.map((t) => (
            <li key={t}>
              <Link href={`/news?topic=${encodeURIComponent(t)}`} onClick={onNavigate} className={sub}>
                {t}
              </Link>
            </li>
          ))}
        </ul>
      </li>
    </ul>
  );
}
