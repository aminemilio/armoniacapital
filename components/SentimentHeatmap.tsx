"use client";

import { useMemo } from "react";
import { dailyScore, sentimentLabel, type SentimentLabel } from "@/lib/market-data";

const CELLS = [
  { code: "USA", name: "United States" },
  { code: "GBR", name: "United Kingdom" },
  { code: "DEU", name: "Germany" },
  { code: "JPN", name: "Japan" },
  { code: "CHN", name: "China" },
  { code: "IND", name: "India" },
  { code: "AUS", name: "Australia" },
  { code: "CAN", name: "Canada" },
  { code: "BRA", name: "Brazil" },
  { code: "FRA", name: "France" },
  { code: "SAU", name: "Saudi Arabia" },
  { code: "KOR", name: "South Korea" },
  { code: "BTC", name: "Bitcoin" },
  { code: "ETH", name: "Ethereum" },
  { code: "XAU", name: "Gold" },
  { code: "DXY", name: "US Dollar Index" },
];

const COLORS: Record<SentimentLabel, string> = {
  "Extreme Fear": "#8C4A3B",
  Fear: "#5F4540",
  Neutral: "#343A44",
  Greed: "#365648",
  "Extreme Greed": "#3E6B57",
};

const LEGEND: SentimentLabel[] = ["Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"];

export function SentimentHeatmap() {
  const date = new Date().toISOString().slice(0, 10);
  const cells = useMemo(
    () =>
      CELLS.map((c) => {
        const score = dailyScore(date, c.code);
        return { ...c, score, label: sentimentLabel(score) };
      }),
    [date],
  );

  return (
    <section aria-labelledby="heat-heading" className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="heat-heading" className="font-serif text-3xl text-bone">
          Global sentiment heatmap
        </h2>
        <p className="font-mono text-xs text-slate">{date} · refreshes daily</p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cells.map((c) => (
          <div
            key={c.code}
            className="flex min-h-[92px] flex-col justify-between p-3"
            style={{ backgroundColor: COLORS[c.label] }}
            title={`${c.name}: ${c.label} (${c.score})`}
          >
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-sm text-bone">{c.code}</span>
              <span className="font-mono text-lg text-bone">{c.score}</span>
            </div>
            <span className="text-xs text-bone/80">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-bone/70">
        {LEGEND.map((l) => (
          <span key={l} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3" style={{ backgroundColor: COLORS[l] }} />
            {l}
          </span>
        ))}
        <span className="text-slate">Illustrative composite score, 15–85. Not financial advice.</span>
      </div>
    </section>
  );
}
