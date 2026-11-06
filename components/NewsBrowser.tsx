"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NewsFeed } from "@/components/NewsFeed";
import { NewsMenu, type NewsSelection } from "@/components/NewsMenu";
import { getRegion } from "@/lib/regions";

/** News page body: nested category menu on the left (collapsible on phones) and the headline feed. */
export function NewsBrowser({ regionSlug }: { regionSlug?: string }) {
  const cfg = regionSlug ? getRegion(regionSlug) : undefined;
  const pathname = usePathname();
  const [sel, setSel] = useState<NewsSelection>({});

  // Read ?country= / ?topic= from the URL on load, on navigation, and on back/forward.
  useEffect(() => {
    const read = () => {
      const p = new URLSearchParams(window.location.search);
      setSel({ country: p.get("country") ?? undefined, topic: p.get("topic") ?? undefined });
    };
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, [pathname]);

  const select = (next: NewsSelection) => {
    setSel(next);
    const p = new URLSearchParams();
    if (next.country) p.set("country", next.country);
    if (next.topic) p.set("topic", next.topic);
    const qs = p.toString();
    window.history.pushState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  };

  const crumbs = [cfg?.name ?? "All news", sel.country, sel.topic].filter(Boolean).join("  ›  ");
  const filtered = Boolean(sel.country || sel.topic);

  return (
    <div className="grid gap-8 lg:grid-cols-[270px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <NewsMenu region={cfg?.slug} selection={sel} onSelect={select} />
      </aside>
      <section aria-label="Headlines">
        <div className="mb-4 flex items-center justify-between gap-4 border-b border-white/10 pb-3">
          <p className="font-mono text-sm text-brass-light">{crumbs}</p>
          {filtered && (
            <Link
              href={cfg ? `/news/${cfg.slug}` : "/news"}
              onClick={(e) => {
                e.preventDefault();
                select({});
              }}
              className="text-xs text-slate underline hover:text-bone"
            >
              Clear filter
            </Link>
          )}
        </div>
        <NewsFeed region={cfg?.name} country={sel.country} topic={sel.topic} limit={60} />
      </section>
    </div>
  );
}
