import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "About",
  description: "Armonia Capital reads markets through an equilibrium lens, with Islamic finance as a core vertical.",
};

export default function AboutPage() {
  return (
    <PageShell
      title="About Armonia Capital"
      intro="Markets rarely sit still at fair value. They swing past it, correct, and swing again. We write about that cycle."
    >
      <h2>The equilibrium lens</h2>
      <p>
        Every note we publish asks the same questions: where is price relative to balance, who is
        positioned on each side, and what would pull it back? We cover rates, equities, commodities and
        digital assets with that frame, and we try to separate what is known from what is inferred.
      </p>
      <h2>Islamic finance, covered properly</h2>
      <p>
        Sharia-compliant finance is a large and growing part of global capital markets, yet most
        financial media treat it as a footnote. We cover sukuk issuance, halal equity screening and the
        structures behind Islamic funds as a core vertical, in plain language and without preaching. For
        rulings on individual investments, consult a qualified Sharia scholar.
      </p>
      <h2>What we are not</h2>
      <p>
        We are not investment advisers. We do not give personalised recommendations, and nothing on this
        site is an offer to buy or sell any security. Please read the{" "}
        <Link href="/disclaimer">full disclaimer</Link>.
      </p>
    </PageShell>
  );
}
