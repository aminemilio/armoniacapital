import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Armonia Capital handles your data.",
};

export default function PrivacyPage() {
  return (
    <PageShell title="Privacy Policy" intro="We collect as little as we can and use it for one purpose each.">
      <h2>What we collect</h2>
      <p>
        If you subscribe to the newsletter, we collect your email address. Our hosting provider may log
        standard technical data such as IP address, browser type and pages requested, for security and
        performance.
      </p>
      <h2>How we use it</h2>
      <p>
        Email addresses are used only to send the newsletter and service messages. We do not sell personal
        data. You can unsubscribe at any time using the link in any email.
      </p>
      <h2>Third parties</h2>
      <p>
        Market data is requested server-side from third-party providers such as CoinGecko. Email delivery
        may be handled by a provider such as Resend. Each has its own privacy policy.
      </p>
      <h2>Your rights</h2>
      <p>
        Depending on where you live, you may have rights to access, correct or delete your personal data.
        Contact us at the address published on this site to make a request.
      </p>
    </PageShell>
  );
}
