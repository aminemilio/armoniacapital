import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Armonia Capital handles your data, cookies and email subscriptions.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PageShell title="Privacy Policy" intro="We collect as little as we can and use it for one purpose each.">
      <h2>Who we are</h2>
      <p>
        {SITE.name} is the controller of the data described here. Contact: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
        {SITE.postalAddress ? ` Postal address: ${SITE.postalAddress}.` : ""}
      </p>
      <h2>What we collect</h2>
      <p>
        <strong>Newsletter.</strong> If you subscribe to The Morning Balance, we collect your email address, confirm it by email (double opt-in), and store it with
        our email provider Resend. <strong>Contact form.</strong> Name, email and message, sent to us by email. <strong>Server logs.</strong> Our hosting provider
        Cloudflare may log technical data such as IP address, browser type and pages requested, for security and performance.
      </p>
      <h2>Cookies and local storage</h2>
      <p>
        The site uses only essential browser storage today, for example to remember your cookie choice. If we add analytics or advertising, we will ask for your
        consent first and describe those tools here. You can change your choice by clearing this site&apos;s data in your browser.
      </p>
      <h2>How we use it</h2>
      <p>
        Email addresses are used only to send the newsletter and service messages. Contact messages are used only to reply to you. We do not sell personal data. Every
        newsletter has a one-click unsubscribe link.
      </p>
      <h2>Third parties</h2>
      <p>
        Cloudflare (hosting and delivery), Resend (email), and, for market data and news, requests made by our servers to providers such as Yahoo Finance, CoinGecko
        and Kraken. These requests do not include your personal data. Each provider has its own privacy policy.
      </p>
      <h2>Retention and your rights</h2>
      <p>
        We keep subscriber data until you unsubscribe and contact messages for up to 12 months. Depending on where you live, you may have the right to access,
        correct, export or delete your data and to object to processing. Write to us to exercise them. We do not knowingly collect data from children.
      </p>
      <p>
        See also our <Link href="/terms">terms of use</Link> and <Link href="/disclaimer">disclaimer</Link>.
      </p>
    </PageShell>
  );
}
