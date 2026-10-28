import type { Metadata } from "next";
import Link from "next/link";
import { getFeatured, getFeaturedArchive, type FeaturedSpotlight } from "@/lib/featured";

export const metadata: Metadata = {
  title: "Featured Asset of the Day",
  description: "A daily profile of one stock or coin with real-world utility: what it does, the evidence, why it is in focus today, and the risks.",
  alternates: { canonical: "/featured" },
};

function Profile({ f, heading }: { f: FeaturedSpotlight; heading: boolean }) {
  return (
    <article className="border border-white/10 bg-ink-2 p-6 sm:p-8">
      <p className="font-mono text-xs text-slate">
        {f.date} · {f.type.toUpperCase()} · {f.symbol}
        {f.sector ? ` · ${f.sector}` : ""}
      </p>
      {heading ? <h2 className="mt-2 font-serif text-3xl text-bone">{f.name}</h2> : <h3 className="mt-2 font-serif text-2xl text-bone">{f.name}</h3>}
      <p className="mt-4 leading-relaxed text-bone/85">
        <strong className="text-bone">What it does. </strong>
        {f.utility}
      </p>
      <p className="mt-3 leading-relaxed text-bone/85">
        <strong className="text-bone">In focus. </strong>
        {f.whyNow}
      </p>
      {f.profile && f.profile.split("\n\n").map((para) => (
        <p key={para.slice(0, 40)} className="mt-4 leading-relaxed text-bone/80">
          {para}
        </p>
      ))}
      {f.evidence.length > 0 && (
        <div className="mt-5">
          <p className="font-semibold text-bone">Evidence of real-world use</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-bone/80">
            {f.evidence.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {f.risks.length > 0 && (
        <div className="mt-5">
          <p className="font-semibold text-bone">Risks to keep in mind</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-bone/80">
            {f.risks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
      {f.sources.length > 0 && (
        <p className="mt-5 text-xs text-slate">
          Sources:{" "}
          {f.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && " · "}
              <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-bone">
                {s.title}
              </a>
            </span>
          ))}
        </p>
      )}
    </article>
  );
}

export default function FeaturedPage() {
  const today = getFeatured();
  const earlier = getFeaturedArchive().filter((f) => f.date !== today?.date);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-serif text-4xl text-bone sm:text-5xl">Featured asset of the day</h1>
      <p className="mt-3 text-lg text-bone/70">
        One stock or coin a day, chosen for what it actually does in the real world. This is an editorial spotlight, not a recommendation to
        buy or sell, and not investment advice.
      </p>

      <div className="mt-10">
        {today ? <Profile f={today} heading /> : <p className="border border-white/10 bg-ink-2 p-6 text-bone/70">The first spotlight will appear after the next daily run.</p>}
      </div>

      {earlier.length > 0 && (
        <section className="mt-14" aria-labelledby="earlier-heading">
          <h2 id="earlier-heading" className="font-serif text-2xl text-bone">
            Previously featured
          </h2>
          <div className="mt-6 space-y-4">
            {earlier.map((f) => (
              <details key={`${f.date}-${f.symbol}`} className="border border-white/10 bg-ink-2 p-4">
                <summary className="cursor-pointer font-serif text-lg text-bone">
                  {f.name} <span className="font-mono text-xs text-slate">· {f.date}</span>
                </summary>
                <div className="mt-4">
                  <Profile f={f} heading={false} />
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      <p className="mt-12 text-sm text-slate">
        <Link href="/disclaimer" className="underline hover:text-bone">
          Read the full disclaimer
        </Link>
      </p>
    </div>
  );
}
