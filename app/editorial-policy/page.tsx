import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Editorial Policy and AI Use",
  description: "How Armonia Capital researches, writes and checks its articles, how we use AI, how we handle sources, corrections and advertising.",
  alternates: { canonical: "/editorial-policy" },
};

export default function EditorialPolicyPage() {
  return (
    <PageShell title="Editorial policy and AI use" intro="How the articles on this site are produced, and how you can hold us to account.">
      <h2>How we produce articles</h2>
      <p>
        Our analysis is produced with AI systems under rules we set. Each day a research step scans worldwide headlines and official releases, then searches the
        web for the newest central bank statements, statistical releases and company financial statements. A writing step drafts the article only from the
        verified research notes, and every article lists the sources it relied on.
      </p>
      <p>
        Automated checks reject drafts that are too short, that cite too few sources, that rely on outdated figures, that contain recommendation-style language or
        that use stock phrases. Articles are not individually edited by a human before publication. We review samples regularly and correct errors when they are
        reported.
      </p>
      <h2>Sources and attribution</h2>
      <p>
        Facts come from primary sources where possible (central banks, statistics offices, regulators, company filings) and from reputable media. We summarise and
        analyse in our own words and link to the original. We do not republish other publishers&apos; articles. Our news pages show headlines with a short teaser
        and a link to the publisher. Headlines and teasers from non-English sources are machine-translated and marked as translated.
      </p>
      <h2>What we do not do</h2>
      <p>
        We do not give investment advice, price targets or personal recommendations. The featured asset of the day is an editorial profile of what a company or
        network does, with risks, and it is never a recommendation to buy or sell. See the <Link href="/disclaimer">disclaimer</Link>.
      </p>
      <h2>Images</h2>
      <p>Photos come from free-licence libraries (Pexels and Pixabay) and are credited on the article page. They illustrate a theme and are not photographs of the events described.</p>
      <h2>Corrections</h2>
      <p>
        If you find an error, write to <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> or use the <Link href="/contact">contact form</Link>. We correct
        confirmed errors promptly and note material corrections on the article.
      </p>
      <h2>Independence and monetisation</h2>
      <p>
        The site may carry advertising or affiliate links. Advertising never influences what we cover or how we describe it, we do not sell sponsored placements
        disguised as editorial content, and any commercial relationship will be disclosed on the page where it applies.
      </p>
      <h2>Updates to this policy</h2>
      <p>We update this page when our process changes. Last review: {new Date().getFullYear()}.</p>
    </PageShell>
  );
}
