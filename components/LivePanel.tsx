"use client";

import { useEffect, useState } from "react";
import { useQuotes } from "@/lib/use-quotes";
import { sentimentFromChanges } from "@/lib/market-data";
import { cn, formatPct, formatPrice } from "@/lib/utils";

function utcClock(): string {
  return new Date().toISOString().slice(11, 19);
}

export function LivePanel() {
  const { data, status } = useQuotes();
  const [clock, setClock] = useState<string>("--:--:--");

  useEffect(() => {
    setClock(utcClock());
    const id = setInterval(() => setClock(utcClock()), 1000);
    return () => clearInterval(id);
  }, []);

  const rows = data.ticker.slice(0, 6);
  const tone = sentimentFromChanges(data.ticker.map((t) => t.changePct));

  return (
    <section
      aria-label="Live market panel"
      className="border border-white/10 bg-ink-2 p-5 shadow-[0_0_0_1px_rgba(173,133,54,0.15)]"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono text-xs">
        <span className="text-slate">UTC</span>
        <span className="text-brass-light" suppressHydrationWarning>
          {clock}
        </span>
      </div>

      <ul className={cn("divide-y divide-white/5 transition-opacity", status === "loading" && "opacity-60")}>
        {rows.map((item) => {
          const up = item.changePct >= 0;
          return (
            <li key={item.symbol} className="flex items-center justify-between py-3">
              <div>
                <p className="font-mono text-sm text-bone">{item.symbol}</p>
                <p className="text-xs text-slate">
                  {item.name}
                  {!item.live && <span className="ml-1.5 text-slate/70">· indicative</span>}
                </p>
              </div>
              <div className="text-right font-mono">
                <p className="text-sm text-bone">{formatPrice(item.price)}</p>
                <p className={cn("text-xs", up ? "text-rise" : "text-fall")}>{formatPct(item.changePct)}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate">
        <span>
          {status === "loading" ? "Syncing…" : status === "live" ? "Updated live" : "Showing cached data"} · Not
          financial advice
        </span>
        <span className="font-mono text-bone/70">Tape: {tone.label}</span>
      </div>
    </section>
  );
}
