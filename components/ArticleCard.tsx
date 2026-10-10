import Image from "next/image";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { getCategoryName } from "@/lib/articles";
import { cn } from "@/lib/utils";
import type { Article } from "@/lib/types";

interface Props {
  article: Article;
  variant?: "default" | "featured" | "compact";
}

export function ArticleCard({ article, variant = "default" }: Props) {
  const href = `/articles/${article.slug}`;
  const meta = (
    <p className="font-mono text-xs text-slate">
      {format(parseISO(article.date), "MMM d, yyyy")} · {article.readTime} min read
    </p>
  );
  const category = (
    <p className="text-xs font-medium text-brass-light">{getCategoryName(article.category)}</p>
  );

  if (variant === "compact") {
    return (
      <Link
        href={href}
        className="group flex gap-4 border border-white/10 bg-ink-2 p-3 transition-colors hover:border-brass"
      >
        <div className="relative h-20 w-28 shrink-0 overflow-hidden bg-ink">
          <Image src={article.image} alt="" fill sizes="112px" className="object-cover" />
        </div>
        <div className="min-w-0">
          {category}
          <h3 className="mt-1 line-clamp-2 font-serif text-base leading-snug text-bone group-hover:text-brass-light">
            {article.title}
          </h3>
          <div className="mt-1.5">{meta}</div>
        </div>
      </Link>
    );
  }

  const featured = variant === "featured";
  return (
    <Link
      href={href}
      className="group flex h-full flex-col border border-white/10 bg-ink-2 transition-colors hover:border-brass"
    >
      <div className={cn("relative w-full overflow-hidden bg-ink", featured ? "aspect-[16/9]" : "aspect-[16/10]")}>
        <Image
          src={article.image}
          alt=""
          fill
          priority={featured}
          sizes={featured ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        {category}
        <h3
          className={cn(
            "mt-2 font-serif leading-snug text-bone group-hover:text-brass-light",
            featured ? "text-2xl sm:text-3xl" : "text-xl",
          )}
        >
          {article.title}
        </h3>
        {featured && <p className="mt-3 leading-relaxed text-bone/70">{article.excerpt}</p>}
        <div className="mt-auto pt-4">{meta}</div>
      </div>
    </Link>
  );
}
