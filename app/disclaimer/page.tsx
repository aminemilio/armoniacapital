import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Armonia Capital content is not investment advice.",
};

export default function DisclaimerPage() {
  return (
    <PageShell title="Disclaimer" intro="Not financial advice. Please read this page in full.">
      <h2>No investment advice</h2>
      <p>
        Everything published on Armonia Capital, including articles, market data, charts, sentiment
        scores and newsletters, is provided for general information and education only. It is not
        investment, financial, legal, tax or accounting advice, and it is not a recommendation, offer or
        solicitation to buy, sell or hold any security, currency, commodity, digital asset or other
        instrument.
      </p>
      <h2>No personalised recommendations</h2>
      <p>
        Content does not take into account your objectives, financial situation or needs. Before making
        any investment decision, speak with a qualified, licensed professional who knows your
        circumstances.
      </p>
      <h2>Risk</h2>
      <p>
        All investing involves risk, including loss of principal. Digital assets can be extremely volatile.
        Past performance does not indicate future results. Views expressed may change without notice.
      </p>
      <h2>Market data</h2>
      <p>
        Some prices shown are indicative, delayed or sourced from third parties, and may contain errors or
        omissions. Sentiment scores and the heatmap are illustrative composite indicators, not measures of
        actual investor sentiment. Do not rely on them for trading.
      </p>
      <h2>Sharia compliance</h2>
      <p>
        Coverage of Islamic finance is educational. Screening methodologies differ between scholars,
        index providers and funds. Nothing here is a fatwa or a ruling that any investment is or is not
        Sharia-compliant.
      </p>
      <h2>Third parties and liability</h2>
      <p>
        Links and data from third parties are provided for convenience; we do not control or endorse them.
        To the fullest extent permitted by law, Armonia Capital and its contributors accept no liability for
        any loss arising from use of, or reliance on, this site.
      </p>
    </PageShell>
  );
}
