import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { NewsFeed } from "@/components/NewsFeed";
import { lookupQuotes } from "@/lib/quote-lookup";
import { searchSite } from "@/lib/search";
import { cn, formatPct, formatPrice, fxDigits } from "@/lib/utils";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };
export const dynamic = "force-dynamic";

const SUGGESTIONS = ["NVIDIA", "bitcoin", "sukuk", "inflation", "oil", "Algeria", "ECB", "China"];

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 80);

  if (!query) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="font-serif text-4xl text-bone">Search</h1>
        <p className="mt-3 text-bone/70">Look up a stock, coin or index (with a live price), or search our articles, guides and headlines.</p>
        <form action="/search" method="get" className="mt-8 flex gap-3">
          <input name="q" type="search" placeholder="NVIDIA, bitcoin, sukuk, oil…" className="min-w-0 flex-1 border border-white/15 bg-ink-2 px-4 py-3 text-bone focus:border-brass focus:outline-none" />
          <button className="bg-brass px-6 py-3 font-medium text-ink hover:bg-brass-light">Search</button>
        </form>
        <p className="mt-6 text-sm text-slate">Try:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} className="border border-white/15 px-3 py-1.5 text-sm text-bone/85 hover:border-brass hover:text-brass-light">
              {s}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const [quotes, site] = await Promise.all([lookupQuotes(query), Promise.resolve(searchSite(query))]);
  const nothing = quotes.length === 0 && site.articles.length === 0 && site.terms.length === 0 && site.profiles.length === 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <h1 className="font-serif text-3xl text-bone sm:text-4xl">Results for &ldquo;{query}&rdquo;</h1>
      <form action="/search" method="get" className="mt-6 flex gap-3">
        <input name="q" defaultValue={query} type="search" className="min-w-0 flex-1 border border-white/15 bg-ink-2 px-4 py-3 text-bone focus:border-brass focus:outline-none" />
        <button className="bg-brass px-6 py-3 font-medium text-ink hover:bg-brass-light">Search</button>
      </form>

      {quotes.length > 0 && (
        <section className="mt-10" aria-labelledby="q-h">
          <h2 id="q-h" className="font-serif text-2xl text-bone">
            Stocks, coins and indices
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {quotes.map((h) => {
              const up = h.changePct >= 0;
              return (
                <li key={h.symbol} className="flex items-baseline justify-between border border-white/10 bg-ink-2 p-4">
                  <div>
                    <p className="font-mono text-sm text-bone">{h.symbol}</p>
                    <p className="text-xs text-slate">{h.name}</p>
                  </div>
                  <div className="text-right font-mono">
                    <p className="text-lg text-bone">
                      {formatPrice(h.price, fxDigits(h.symbol))}
                      {h.currency && <span className="ml-1 text-xs text-slate">{h.currency}</span>}
                    </p>
                    <p className={cn("text-xs", up ? "text-rise" : "text-fall")}>{formatPct(h.changePct)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-slate">Prices may be delayed. Not investment advice.</p>
        </section>
      )}

      {site.profiles.length > 0 && (
        <section className="mt-10" aria-labelledby="p-h">
          <h2 id="p-h" className="font-serif text-2xl text-bone">
            Our asset profiles
          </h2>
          <ul className="mt-4 space-y-3">
            {site.profiles.map((f) => (
              <li key={`${f.symbol}-${f.date}`} className="border border-white/10 bg-ink-2 p-4">
                <Link href="/featured" className="font-serif text-lg text-bone hover:text-brass-light">
                  {f.name} <span className="font-mono text-xs text-slate">({f.symbol}, {f.date})</span>
                </Link>
                <p className="mt-1 text-sm text-bone/70">{f.utility}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {site.articles.length > 0 && (
        <section className="mt-10" aria-labelledby="a-h">
          <h2 id="a-h" className="font-serif text-2xl text-bone">
            Articles
          </h2>
          <div className="mt-4 flex flex-col gap-4">
            {site.articles.map((a) => (
              <ArticleCard key={a.slug} article={a} variant="compact" />
            ))}
          </div>
        </section>
      )}

      {site.terms.length > 0 && (
        <section className="mt-10" aria-labelledby="g-h">
          <h2 id="g-h" className="font-serif text-2xl text-bone">
            Glossary
          </h2>
          <dl className="mt-4 space-y-3">
            {site.terms.map((t) => (
              <div key={t.term} className="border border-white/10 bg-ink-2 p-4">
                <dt className="font-serif text-lg text-bone">{t.term}</dt>
                <dd className="mt-1 text-sm text-bone/75">{t.definition}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm">
            <Link href="/learn/glossary" className="text-brass-light underline">
              Full glossary
            </Link>
          </p>
        </section>
      )}

      <section className="mt-10" aria-labelledby="n-h">
        <h2 id="n-h" className="font-serif text-2xl text-bone">
          Latest headlines
        </h2>
        <div className="mt-2">
          <NewsFeed query={query} limit={8} compact />
        </div>
      </section>

      {nothing && <p className="mt-10 text-bone/70">No matches in our articles or quotes yet. Check the spelling, or try a ticker such as NVDA or a topic such as oil.</p>}
    </div>
  );
}
