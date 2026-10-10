import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { CategoryGrid } from "@/components/CategoryGrid";
import { InstitutionalDashboard } from "@/components/InstitutionalDashboard";
import { LivePanel } from "@/components/LivePanel";
import { Newsletter } from "@/components/Newsletter";
import { SentimentHeatmap } from "@/components/SentimentHeatmap";
import { getAllArticles } from "@/lib/articles";

export default function HomePage() {
  const [featured, ...rest] = getAllArticles();
  const side = rest.slice(0, 4);

  return (
    <>
      <section className="mx-auto grid max-w-7xl gap-12 px-4 pt-16 sm:px-6 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:pt-24">
        <div>
          <p className="font-mono text-sm text-brass-light">Today&apos;s balance</p>
          <h1 className="mt-4 font-serif text-4xl leading-[1.1] text-bone sm:text-5xl lg:text-6xl">
            Markets don&apos;t trend. They seek equilibrium — and overshoot on the way.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-bone/75">
            Armonia Capital reads rates, equities, gold and digital assets by asking one question: how far
            is price from balance, and what would pull it back? Sharia-compliant finance, from sukuk to
            halal screening, sits beside the conventional markets as a core part of the coverage.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/articles/${featured.slug}`}
              className="bg-brass px-6 py-3 font-medium text-ink transition-colors hover:bg-brass-light"
            >
              Read today&apos;s briefing
            </Link>
            <Link
              href="/#newsletter"
              className="border border-brass px-6 py-3 font-medium text-brass-light transition-colors hover:bg-brass/10"
            >
              Get it every morning
            </Link>
          </div>
        </div>
        <LivePanel />
      </section>

      <InstitutionalDashboard />
      <CategoryGrid />

      <section aria-labelledby="latest-heading" className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <h2 id="latest-heading" className="font-serif text-3xl text-bone">
          Latest intelligence
        </h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <ArticleCard article={featured} variant="featured" />
          <div className="flex flex-col gap-4">
            {side.map((a) => (
              <ArticleCard key={a.slug} article={a} variant="compact" />
            ))}
          </div>
        </div>
      </section>

      <SentimentHeatmap />
      <Newsletter />
    </>
  );
}
