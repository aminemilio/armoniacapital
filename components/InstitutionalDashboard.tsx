"use client";

import { useQuotes } from "@/lib/use-quotes";
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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-white/10 bg-ink-2 p-6">
      <h3 className="font-serif text-lg text-bone">{title}</h3>
      {children}
    </div>
  );
}

export function InstitutionalDashboard() {
  const { data } = useQuotes();
  const { overview, indices, featured } = data.dashboard;
  const up = featured.changePct >= 0;

  return (
    <section aria-labelledby="dash-heading" className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
      <h2 id="dash-heading" className="font-serif text-3xl text-bone">
        Institutional dashboard
      </h2>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
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
        <Card title="Featured Asset">
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-bone">{featured.name}</span>
              <span
                className={cn(
                  "rounded-sm px-1.5 py-0.5 font-mono text-[10px]",
                  featured.live ? "bg-rise/25 text-rise" : "bg-white/10 text-slate",
                )}
              >
                {featured.live ? "LIVE" : "INDICATIVE"}
              </span>
            </div>
            <p className="mt-3 font-mono text-4xl text-bone">{formatPrice(featured.price)}</p>
            <p className={cn("mt-1 font-mono text-sm", up ? "text-rise" : "text-fall")}>
              {up ? "▲" : "▼"} {formatPct(featured.changePct)} 24h
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
