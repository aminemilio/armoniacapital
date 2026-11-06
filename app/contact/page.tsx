import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { PageShell } from "@/components/PageShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Armonia Capital: corrections, feedback, partnerships and press.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <PageShell title="Contact" intro="Corrections, feedback, partnerships or press: we read every message.">
      <p>
        Found a factual error? Tell us the article and what is wrong, and we will check it and correct it. Our approach to corrections is in the{" "}
        <Link href="/editorial-policy">editorial policy</Link>.
      </p>
      <div className="not-prose">
        <ContactForm email={SITE.contactEmail} />
      </div>
    </PageShell>
  );
}
