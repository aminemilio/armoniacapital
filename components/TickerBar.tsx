"use client";

import { useQuotes } from "@/lib/use-quotes";
import { cn, formatPct, formatPrice } from "@/lib/utils";

export function TickerBar() {
  const { data } = useQuotes();
  const items = data.ticker;
  const loop = [...items, ...items];

  return (
    <div
      role="region"
      aria-label="Market ticker"
      className="group overflow-hidden border-b border-white/10 bg-ink-2"
    >
      <div className="flex w-max animate-ticker gap-10 py-2 font-mono text-xs group-hover:[animation-play-state:paused]">
        {loop.map((item, i) => {
          const up = item.changePct >= 0;
          return (
            <span
              key={`${i}-${item.symbol}`}
              className="flex items-center gap-2 whitespace-nowrap"
              aria-hidden={i >= items.length}
            >
              <span className="text-bone">{item.symbol}</span>
              <span className="text-bone/80">{formatPrice(item.price)}</span>
              <span className={cn(up ? "text-rise" : "text-fall")}>
                {up ? "▲" : "▼"} {formatPct(Math.abs(item.changePct)).replace("+", "")}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
