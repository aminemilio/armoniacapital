"use client";

import Link from "next/link";
import { useQuotes } from "@/lib/use-quotes";
import { getFeatured } from "@/lib/featured";
import { cn, formatPct, formatPrice } from "@/lib/utils";
import type { TickerItem } from "@/lib/types";

function Row({ item }: { item: TickerItem }) {
  const up = item.changePct >= 0;
  return (
    <li className="flex items-baseline justify-between py-3">
      <div>
        <p className="font-mono text-sm text-bone">{item.symbol}</p>
        <p className="text-xs text-slate">
          {item.name}
          {!item.live && " · indicative"}
        </p>
      </div>
      <div className="text-right font-mono">
        <p className="text-lg text-bone">{formatPrice(item.price)}</p>
        <p className={cn("text-xs", up ? "text-rise" : "text-fall")}>{formatPct(item.changePct)}</p>
      </div>
    </li>
  );
}

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("border border-white/10 bg-ink-2 p-6", className)}>
      <h3 className="font-serif text-lg text-bone">{title}</h3>
      {children}
    </div>
  );
}

export function InstitutionalDashboard() {
  const { data } = useQuotes();
  const { overview, indices, featured } = data.dashboard;
  const spot = getFeatured();

  // The day's spotlight (data/featured.json). Fall back to the quote of the first-ever default (Bitcoin) before the first run.
  const quote = spot && featured.symbol === spot.symbol && featured.price > 0 ? featured : null;
  const up = (quote ?? featured).changePct >= 0;

  return (
    <section aria-labelledby="dash-heading" className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
      <h2 id="dash-heading" className="font-serif text-3xl text-bone">
        Institutional dashboard
      </h2>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Card title="Market Overview">
          <ul className="mt-2 divide-y divide-white/5">
            {overview.map((i) => (
              <Row key={i.symbol} item={i} />
            ))}
          </ul>
        </Card>
        <Card title="Key Indices">
          <ul className="mt-2 divide-y divide-white/5">
            {indices.map((i) => (
              <Row key={i.symbol} item={i} />
            ))}
          </ul>
        </Card>
      </div>

      {spot ? (
        <div className="mt-5 border border-brass/40 bg-ink-2 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="font-serif text-lg text-bone">Featured asset of the day</h3>
            <span className="rounded-sm bg-white/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-slate">{spot.type}</span>
            <span className="font-mono text-xs text-slate">{spot.date}</span>
          </div>

          <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <div>
              <p className="font-serif text-2xl text-bone">{spot.name}</p>
              <p className="mt-1 font-mono text-sm text-slate">
                {spot.symbol}
                {spot.sector ? ` · ${spot.sector}` : ""}
              </p>
              {quote ? (
                <>
                  <p className="mt-4 font-mono text-4xl text-bone">
                    {formatPrice(quote.price)}
                    {quote.currency && <span className="ml-2 text-sm text-slate">{quote.currency}</span>}
                  </p>
                  <p className={cn("mt-1 font-mono text-sm", up ? "text-rise" : "text-fall")}>
                    {up ? "▲" : "▼"} {formatPct(quote.changePct)} 24h
                    <span className="ml-2 rounded-sm bg-rise/25 px-1.5 py-0.5 text-[10px] text-rise">LIVE</span>
                  </p>
                </>
              ) : (
                <p className="mt-4 font-mono text-sm text-slate">Price unavailable right now</p>
              )}
            </div>

            <div className="space-y-4 text-sm leading-relaxed text-bone/80">
              <p>
                <strong className="text-bone">What it does. </strong>
                {spot.utility}
              </p>
              <p>
                <strong className="text-bone">In focus today. </strong>
                {spot.whyNow}
              </p>
              <p>
                <Link href="/featured" className="font-medium text-brass-light hover:underline">
                  Read the full profile and past picks →
                </Link>
              </p>
              {spot.evidence.length > 0 && (
                <div>
                  <p className="font-semibold text-bone">Evidence of real-world use</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {spot.evidence.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
              {spot.risks.length > 0 && (
                <div>
                  <p className="font-semibold text-bone">Risks to keep in mind</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {spot.risks.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {spot.sources.length > 0 && (
                <p className="text-xs text-slate">
                  Sources:{" "}
                  {spot.sources.slice(0, 4).map((s, i) => (
                    <span key={s.url}>
                      {i > 0 && " · "}
                      <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-bone">
                        {s.title}
                      </a>
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>
          <p className="mt-6 border-t border-white/10 pt-4 text-xs text-slate">
            Editorial spotlight chosen for its real-world utility. It is not a recommendation to buy or sell, and not investment advice.
          </p>
        </div>
      ) : (
        <Card title="Featured Asset" className="mt-5">
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-bone">{featured.name}</span>
              <span className={cn("rounded-sm px-1.5 py-0.5 font-mono text-[10px]", featured.live ? "bg-rise/25 text-rise" : "bg-white/10 text-slate")}>
                {featured.live ? "LIVE" : "INDICATIVE"}
              </span>
            </div>
            <p className="mt-3 font-mono text-4xl text-bone">{formatPrice(featured.price)}</p>
            <p className={cn("mt-1 font-mono text-sm", up ? "text-rise" : "text-fall")}>
              {up ? "▲" : "▼"} {formatPct(featured.changePct)} 24h
            </p>
          </div>
        </Card>
      )}
    </section>
  );
}
