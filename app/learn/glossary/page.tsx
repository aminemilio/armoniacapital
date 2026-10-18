import type { Metadata } from "next";
import Link from "next/link";
import { GLOSSARY } from "@/lib/glossary";

export const metadata: Metadata = {
  title: "Markets and Islamic Finance Glossary",
  description: "Plain-language definitions of market, macro, crypto and Islamic finance terms: bond yield, DXY, sukuk, riba, murabaha and more.",
  alternates: { canonical: "/learn/glossary" },
};

export default function GlossaryPage() {
  const terms = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term));
  const letters = Array.from(new Set(terms.map((t) => t.term[0].toUpperCase())));

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Link href="/learn" className="text-sm text-brass-light hover:underline">
        ← Learn
      </Link>
      <h1 className="mt-3 font-serif text-4xl text-bone sm:text-5xl">Glossary</h1>
      <p className="mt-3 text-lg text-bone/70">Markets, macro, crypto and Islamic finance terms in plain language.</p>

      <nav aria-label="Jump to letter" className="mt-8 flex flex-wrap gap-2 font-mono text-sm">
        {letters.map((l) => (
          <a key={l} href={`#letter-${l}`} className="border border-white/15 px-2.5 py-1 text-bone/80 hover:border-brass hover:text-brass-light">
            {l}
          </a>
        ))}
      </nav>

      <dl className="mt-10">
        {letters.map((l) => (
          <div key={l} id={`letter-${l}`} className="scroll-mt-24">
            <h2 className="mt-10 border-b border-white/10 pb-2 font-serif text-2xl text-brass-light">{l}</h2>
            {terms
              .filter((t) => t.term[0].toUpperCase() === l)
              .map((t) => (
                <div key={t.term} className="py-4">
                  <dt className="font-serif text-lg text-bone">{t.term}</dt>
                  <dd className="mt-1 leading-relaxed text-bone/75">{t.definition}</dd>
                </div>
              ))}
          </div>
        ))}
      </dl>

      <p className="mt-12 border border-white/10 bg-ink-2 p-5 text-sm text-bone/70">
        <strong className="text-bone">Educational content, not investment advice.</strong> Definitions are simplified. For Islamic finance
        rulings, consult a qualified Sharia scholar.
      </p>
    </div>
  );
}
