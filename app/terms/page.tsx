import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms governing use of Armonia Capital.",
};

export default function TermsPage() {
  return (
    <PageShell title="Terms of Use" intro="By using this site you agree to the terms below.">
      <h2>Use of content</h2>
      <p>
        Content is provided for personal, non-commercial information and education. You may not republish,
        scrape or redistribute it at scale without written permission. Short quotations with attribution
        and a link are welcome.
      </p>
      <h2>No advice</h2>
      <p>
        Nothing on this site is investment advice. See the <Link href="/disclaimer">disclaimer</Link>. You
        are solely responsible for your own investment decisions.
      </p>
      <h2>No warranty</h2>
      <p>
        The site and its data are provided &quot;as is&quot; without warranties of any kind, including accuracy,
        completeness or availability.
      </p>
      <h2>Limitation of liability</h2>
      <p>
        To the extent permitted by law, we are not liable for any direct or indirect loss arising from your
        use of the site.
      </p>
      <h2>Changes</h2>
      <p>We may update these terms at any time. Continued use means you accept the updated terms.</p>
    </PageShell>
  );
}
