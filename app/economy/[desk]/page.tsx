import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { getAllArticles } from "@/lib/articles";
import { DESK_KEYS, DESK_META, isDeskKey } from "@/lib/desks";

type Params = { desk: string };

export function generateStaticParams() {
  return DESK_KEYS.map((desk) => ({ desk }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { desk } = await params;
  if (!isDeskKey(desk)) return { title: "Not found" };
  return {
    title: `${DESK_META[desk].name} economy analysis`,
    description: DESK_META[desk].description,
    alternates: { canonical: `/economy/${desk}` },
  };
}

export default async function EconomyPage({ params }: { params: Promise<Params> }) {
  const { desk } = await params;
  if (!isDeskKey(desk)) notFound();
  const articles = getAllArticles().filter((a) => a.desk === desk);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <h1 className="font-serif text-4xl text-bone sm:text-5xl">{DESK_META[desk].name}: economy and markets</h1>
      <p className="mt-3 max-w-2xl text-lg text-bone/70">{DESK_META[desk].description}</p>
      {articles.length === 0 ? (
        <p className="mt-12 border border-white/10 bg-ink-2 p-8 text-bone/70">The first analysis from this desk will appear after the next daily run.</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
