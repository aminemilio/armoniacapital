import Link from "next/link";
import { getAllArticles } from "@/lib/articles";
import { DESK_KEYS, DESK_META } from "@/lib/desks";

/** Homepage strip: the latest analysis from each of the three economies that move the world. */
export function BigThree() {
  const all = getAllArticles();
  return (
    <section aria-labelledby="big3-heading" className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
      <h2 id="big3-heading" className="font-serif text-3xl text-bone">
        The economies that move the world
      </h2>
      <p className="mt-2 max-w-2xl text-bone/70">Daily analysis of the United States, the European Union and China, and how each reaches the rest of the world.</p>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {DESK_KEYS.map((k) => {
          const latest = all.find((a) => a.desk === k);
          return (
            <div key={k} className="flex flex-col border border-white/10 bg-ink-2 p-6">
              <p className="font-mono text-xs uppercase tracking-wider text-brass-light">{DESK_META[k].name}</p>
              {latest ? (
                <Link href={`/articles/${latest.slug}`} className="mt-3 font-serif text-xl leading-snug text-bone hover:text-brass-light">
                  {latest.title}
                </Link>
              ) : (
                <p className="mt-3 text-bone/60">{DESK_META[k].description}</p>
              )}
              <Link href={`/economy/${k}`} className="mt-auto pt-5 text-sm text-brass-light hover:underline">
                All {DESK_META[k].short} analysis →
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
