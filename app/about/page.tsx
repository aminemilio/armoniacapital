import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "Armonia Capital reads markets, energy, digital assets and Islamic finance through an equilibrium lens, with daily coverage of the US, EU and China.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <PageShell title={`About ${SITE.name}`} intro="Markets rarely sit still at fair value. They swing past it, correct, and swing again. We write about that cycle.">
      <h2>What we do</h2>
      <p>
        {SITE.name} is an independent financial publication, founded in {SITE.founded} and based in {SITE.country}. Every weekday we publish analysis of the three
        economies that move the world, the United States, the European Union and China, and show how their news reaches emerging markets, Africa, the Gulf and
        Asia. We also cover energy, digital assets and Islamic finance, publish live headlines from central banks and regional media, and write plain-language{" "}
        <Link href="/learn">guides</Link> for readers new to markets.
      </p>
      <h2>The equilibrium lens</h2>
      <p>
        Every piece asks the same questions: where is price relative to balance, who is positioned on each side, and what would pull it back? We try to separate
        what is known from what is inferred, and we say so when sources disagree.
      </p>
      <h2>Islamic finance, covered properly</h2>
      <p>
        Sharia-compliant finance is a large and growing part of global markets, yet most financial media treat it as a footnote. We cover sukuk, halal equity
        screening and Islamic banking in plain language and without preaching. For rulings on individual investments, consult a qualified Sharia scholar.
      </p>
      <h2>Who is behind the site</h2>
      <p>{SITE.ownerLine}</p>
      <p>
        How articles are researched, written and checked is explained in our <Link href="/editorial-policy">editorial policy</Link>, including our use of AI. You
        can reach us on the <Link href="/contact">contact page</Link>.
      </p>
      <h2>What we are not</h2>
      <p>
        We are not investment advisers. We do not give personalised recommendations, and nothing on this site is an offer to buy or sell any security. Please read
        the <Link href="/disclaimer">full disclaimer</Link>.
      </p>
    </PageShell>
  );
}
