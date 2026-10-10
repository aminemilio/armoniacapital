import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArticleCard } from "@/components/ArticleCard";
import { ARTICLES, getArticle, getCategoryName, getRelatedArticles } from "@/lib/articles";

type Params = { slug: string };

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Article not found" };
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      publishedTime: article.date,
      images: [article.image],
    },
  };
}

function renderBody(content: string) {
  return content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) =>
      line.startsWith("## ") ? (
        <h2 key={i} className="mt-10 font-serif text-2xl text-bone">
          {line.slice(3)}
        </h2>
      ) : (
        <p key={i} className="mt-4 text-lg leading-[1.75] text-bone/85">
          {line}
        </p>
      ),
    );
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  const related = getRelatedArticles(article);

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Link
        href={`/category/${article.category}`}
        className="text-sm font-medium text-brass-light hover:underline"
      >
        {getCategoryName(article.category)}
      </Link>
      <h1 className="mt-3 font-serif text-4xl leading-tight text-bone sm:text-5xl">{article.title}</h1>
      <p className="mt-4 font-mono text-xs text-slate">
        {format(parseISO(article.date), "MMMM d, yyyy")} · {article.readTime} min read
      </p>
      <p className="mt-6 text-xl leading-relaxed text-bone/75">{article.excerpt}</p>

      <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden bg-ink-2">
        <Image src={article.image} alt="" fill priority sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
      </div>

      {article.imageCredit && <p className="mt-2 text-xs text-slate">{article.imageCredit}</p>}

      <div className="mt-6">{renderBody(article.content)}</div>

      {article.sources && article.sources.length > 0 && (
        <section className="mt-10" aria-labelledby="sources-heading">
          <h2 id="sources-heading" className="font-serif text-xl text-bone">
            Sources
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-bone/70">
            {article.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="text-brass-light underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <aside className="mt-12 border border-white/10 bg-ink-2 p-5 text-sm leading-relaxed text-bone/70">
        <strong className="text-bone">Not investment advice.</strong> This article is for information and
        education only. It does not consider your objectives or circumstances and is not a recommendation to
        buy or sell any security. See the{" "}
        <Link href="/disclaimer" className="text-brass-light underline">
          full disclaimer
        </Link>
        .
      </aside>

      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="related-heading">
          <h2 id="related-heading" className="font-serif text-2xl text-bone">
            Related reading
          </h2>
          <div className="mt-6 flex flex-col gap-4">
            {related.map((a) => (
              <ArticleCard key={a.slug} article={a} variant="compact" />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
