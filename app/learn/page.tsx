import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { getArticlesByCategory } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Learn: Markets, Macro and Islamic Finance Explained",
  description: "Plain-language guides to bond yields, central banks, sukuk, riba, the dollar index and more, plus a glossary.",
  alternates: { canonical: "/learn" },
};

export default function LearnPage() {
  const guides = getArticlesByCategory("learn");

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <p className="font-mono text-sm text-brass-light">Learn</p>
      <h1 className="mt-2 max-w-3xl font-serif text-4xl leading-tight text-bone sm:text-5xl">
        Understand the markets, one concept at a time
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-bone/70">
        Short, plain-language guides to the ideas behind the headlines, from bond yields to sukuk. No jargon without an explanation.
      </p>
      <div className="mt-6">
        <Link href="/learn/glossary" className="inline-block border border-brass px-5 py-2.5 text-brass-light transition-colors hover:bg-brass/10">
          Browse the glossary →
        </Link>
      </div>

      {guides.length === 0 ? (
        <p className="mt-12 border border-white/10 bg-ink-2 p-8 text-bone/70">Guides are coming soon.</p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      )}

      <p className="mt-12 text-sm text-slate">Educational content only. Not investment advice.</p>
    </div>
  );
}
