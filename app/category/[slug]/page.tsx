import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import {
  CATEGORY_META,
  getArticlesByCategory,
  getCategoryName,
  isCategorySlug,
} from "@/lib/articles";

type Params = { slug: string };

export function generateStaticParams() {
  return Object.keys(CATEGORY_META).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isCategorySlug(slug)) return { title: "Category not found" };
  return {
    title: getCategoryName(slug),
    description: CATEGORY_META[slug].description,
    alternates: { canonical: `/category/${slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  if (!isCategorySlug(slug)) notFound();
  const articles = getArticlesByCategory(slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <h1 className="font-serif text-4xl text-bone sm:text-5xl">{getCategoryName(slug)}</h1>
      <p className="mt-3 max-w-2xl text-lg text-bone/70">{CATEGORY_META[slug].description}</p>

      {articles.length === 0 ? (
        <p className="mt-12 border border-white/10 bg-ink-2 p-8 text-bone/70">
          No articles in this category yet
        </p>
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
