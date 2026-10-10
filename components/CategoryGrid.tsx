import Link from "next/link";
import { CORE_CATEGORIES, getAllCategories } from "@/lib/articles";

export function CategoryGrid() {
  const all = getAllCategories();
  const core = CORE_CATEGORIES.map((slug) => all.find((c) => c.slug === slug)!);

  return (
    <section aria-labelledby="briefings-heading" className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
      <h2 id="briefings-heading" className="font-serif text-3xl text-bone">
        Briefings &amp; series
      </h2>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {core.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="group flex flex-col border border-white/10 bg-ink-2 p-5 transition-colors hover:border-brass"
          >
            <h3 className="font-serif text-xl text-bone">{c.name}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-bone/70">{c.description}</p>
            <div className="mt-5 flex items-center justify-between text-xs">
              <span className="font-mono text-slate">
                {c.count} {c.count === 1 ? "post" : "posts"}
              </span>
              <span className="text-brass-light group-hover:underline">Explore →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
