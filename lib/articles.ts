import type { Article, Category, CategorySlug } from "./types";
import generated from "../data/articles.json";

const px = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;

export const CATEGORY_META: Record<CategorySlug, { name: string; description: string }> = {
  markets: {
    name: "Markets",
    description: "Cross-asset positioning and where it's stretched",
  },
  macro: {
    name: "Macro",
    description: "Rates, central banks, and the data that moves them",
  },
  equities: {
    name: "Equities",
    description: "Single names, sectors, and earnings that shift the balance",
  },
  "digital-assets": {
    name: "Digital Assets",
    description: "Crypto flows, ETFs, and on-chain positioning",
  },
  "islamic-finance": {
    name: "Islamic Finance",
    description: "Sharia-compliant equities, sukuk, and halal screening",
  },
  investing: {
    name: "Investing",
    description: "Allocation, behaviour, and how capital actually moves",
  },
  business: { name: "Business", description: "Corporate strategy and the economy behind the tape" },
  politics: { name: "Politics", description: "Policy and geopolitics where they touch prices" },
  stock: { name: "Stock", description: "Individual stock notes and watchlists" },
};

/** The five verticals always shown on the homepage grid. */
export const CORE_CATEGORIES: CategorySlug[] = [
  "markets",
  "macro",
  "equities",
  "digital-assets",
  "islamic-finance",
];

const SEED_ARTICLES: Article[] = [
  {
    slug: "institutions-are-buying-while-retail-panics",
    title: "Institutions Are Buying While Retail Panics. Read the Gap Carefully.",
    excerpt:
      "When sentiment surveys and allocator flows point in opposite directions, the divergence describes who is on which side of the trade — not what happens next.",
    category: "investing",
    date: "2026-10-05",
    image: px(590041),
    readTime: 5,
    content: `## The divergence

After sharp drawdowns, retail sentiment tends to swing toward caution almost immediately. Larger allocators move on a different clock. Filings, custody data and fund-flow reports often show them adding to assets that have slipped below their intended weights. The gap between the two groups is not a signal on its own. It is a description of who is positioned where.

## Rebalancing is not a forecast

Pension, endowment and balanced-fund mandates enforce target weights. When equities fall relative to bonds, the mandate buys what has fallen and trims what has risen, mechanically and without an opinion about next quarter. Treating that flow as a bullish call is the most common misreading of institutional buying.

## Reading it through equilibrium

Markets overshoot because participants do not all act at once or for the same reasons. Price-insensitive buyers, such as rebalancers, absorb supply that price-sensitive sellers are willing to give away. The useful question is how far prices travelled before the rebalancing bid appeared, and whether the selling was forced or discretionary.

## What would change the picture

A divergence narrows in one of two ways: retail follows institutions back in, or institutions give up. Watch whether fund flows stay consistent over several weeks, and whether credit spreads confirm the equity move. If they disagree, trust the credit market first.`,
  },
  {
    slug: "no-rate-cut-likely-at-first-fed-meeting",
    title: "No Rate Cut Likely at the First Fed Meeting. The Statement Is the Event.",
    excerpt:
      "A hold is the base case. The market's attention will sit on the wording of the statement and what it implies about the path from here.",
    category: "macro",
    date: "2026-10-04",
    image: px(210607),
    readTime: 4,
    content: `## A hold is the baseline

Futures pricing and recent committee commentary both point toward policy staying where it is. A hold carries little information by itself. What the market will parse is how the committee describes inflation progress, labour-market slack and the balance of risks.

## Language over levels

Small edits matter. A shift from describing inflation as "elevated" to "somewhat elevated", or a change in how the committee characterises the pace of cooling in the labour market, can move front-end yields more than the rate decision itself. Traders read statements against the previous version, line by line.

## Where the equilibrium sits

Policy is trying to settle at a rate that neither stokes demand nor chokes it. That level cannot be observed directly, so the committee infers it from data. When the data is mixed, it prefers to wait. Patience is the policy.

## What to watch around the meeting

The press conference tone, any change to balance-sheet language, and the reaction in two-year yields against the dollar. If yields and the dollar move together, the market is repricing the path. If they diverge, something else is driving the move.`,
  },
  {
    slug: "hype-crypto-price-prediction-volume-etf-inflows",
    title: "Hype Crypto: Volume and ETF Inflows Are Doing the Talking",
    excerpt:
      "Price predictions are cheap. Trading volume and regulated-product flows show whether new capital is arriving or old capital is rotating.",
    category: "digital-assets",
    date: "2026-10-03",
    image: px(844124),
    readTime: 5,
    content: `## Prediction versus participation

Every rally produces confident price targets. Fewer of them check whether participation is rising. Volume that expands on up days and fades on down days suggests demand is absorbing supply. The reverse suggests distribution.

## What ETF flows add

Spot ETF flows are a cleaner read on regulated, allocator-style demand than exchange volume, which includes leveraged and short-term trading. Sustained net inflows imply new money. Alternating inflows and outflows imply positions being traded rather than built.

## The overshoot pattern

Crypto tends to overshoot in both directions because leverage amplifies moves. Funding rates, open interest and liquidation data show how crowded the trade is. A rally on rising open interest and elevated funding is fragile. A rally on flat open interest and steady spot buying is sturdier.

## A balanced reading

No single metric settles the question. Look for agreement between spot volume, ETF flows and derivatives positioning. When all three lean the same way, the move has support. When they disagree, treat the headline price with caution.`,
  },
  {
    slug: "sp-500-spy-voo-outlook-this-week",
    title: "S&P 500 (SPY, VOO) Outlook This Week: Where the Equilibrium Zone Sits",
    excerpt:
      "Index funds track the same benchmark, so the useful question is where price is relative to recent value areas, not which ticker you hold.",
    category: "equities",
    date: "2026-10-02",
    image: px(187041),
    readTime: 4,
    content: `## One index, several wrappers

SPY and VOO both track the S&P 500, so their charts tell the same story. Differences in fees, structure and trading volume matter for holders, but not for reading the index. This note concerns the index itself.

## Value areas, not forecasts

Price spends most of its time inside zones where buyers and sellers have repeatedly agreed on value. Moves away from those zones need a catalyst, such as earnings, rates or a macro surprise. Without one, price tends to drift back. Marking the recent trading range gives a reference for how stretched the market is.

## What shifts the balance this week

Earnings from large index constituents, the path of long-dated yields, and any change in market breadth. If the index rises while fewer stocks participate, the advance is narrower than the headline suggests.

## Practical framing

Rather than predicting a level, ask which scenario would change your view. A decisive move outside the recent range on strong volume would suggest the balance has shifted. A move that fails and returns to the range suggests it has not.`,
  },
  {
    slug: "sukuk-issuance-gcc-pipeline-what-it-signals",
    title: "GCC Sukuk Pipeline: What Issuance Plans Signal",
    excerpt:
      "Sovereign and quasi-sovereign sukuk supply says something about funding needs, investor appetite and the depth of the Islamic fixed-income market.",
    category: "islamic-finance",
    date: "2026-10-01",
    image: px(730564),
    readTime: 5,
    content: `## Why the pipeline matters

Sukuk are asset-backed or asset-based certificates structured to comply with Sharia principles. Gulf issuers are among the largest sources of supply. Their planned issuance shows how governments and state-linked entities intend to fund budgets and capital projects, and how they see demand.

## Reading supply and demand

Heavy supply into a thin market pushes pricing wider. Heavy supply into a deep, oversubscribed market does not. Order-book coverage, the spread to comparable conventional bonds and the mix of investors are more informative than the headline size of a deal.

## The balance between conventional and Islamic funding

Issuers choose between sukuk and conventional bonds based on relative cost, investor base and policy goals. When sukuk price at or inside conventional debt, it signals demand from Islamic banks, takaful operators and funds that cannot hold interest-bearing paper.

## What to watch

Calendar clustering around fiscal year-ends, oil-price sensitivity of the issuers, and whether new structures or tenors appear. Broader participation from international investors would indicate that the asset class is maturing beyond its core base.`,
  },
  {
    slug: "gold-spot-dxy-divergence-what-it-means",
    title: "Gold and the Dollar Rising Together: What the Divergence Means",
    excerpt:
      "Gold and the US dollar usually move in opposite directions. When both climb, a third force, usually fear or official-sector buying, is overriding the normal relationship.",
    category: "markets",
    date: "2026-09-30",
    image: px(6770610),
    readTime: 4,
    content: `## The normal relationship

Gold is priced in dollars, so a stronger dollar usually weighs on it. The inverse correlation is a tendency, not a rule. It breaks when other drivers become stronger than currency translation.

## Candidates for the third force

Safe-haven demand during geopolitical stress lifts both gold and the dollar. Central-bank reserve diversification supports gold regardless of currency moves. Falling real yields support gold while a risk-off bid supports the dollar. Identifying which force is dominant matters more than the divergence itself.

## Why it tends to be temporary

Relationships that break usually restore. Either the dollar eases as the stress fades, or gold gives back gains as the haven bid weakens. Markets rarely sustain two assets that normally offset each other moving the same way without a clear reason.

## How to monitor it

Compare gold with real yields, not just the dollar. Check whether the move is led by physical demand, ETF holdings or futures positioning. If speculators are driving it, it can reverse quickly. If official buyers are driving it, it tends to be steadier.`,
  },
  {
    slug: "sharia-screening-thresholds-practical-guide",
    title: "Sharia Screening Thresholds: A Practical Guide",
    excerpt:
      "How halal equity screens work: business-activity filters, financial-ratio caps and income purification, explained without the jargon.",
    category: "islamic-finance",
    date: "2026-09-29",
    image: px(6801648),
    readTime: 6,
    content: `## Two kinds of screen

Sharia-compliant equity screening has two parts. The first is qualitative: does the company's core business involve prohibited activities such as alcohol, gambling, conventional financial services, tobacco or adult entertainment? The second is quantitative: do its financial ratios stay within set limits?

## The ratio tests

Most screening standards cap interest-bearing debt, interest-bearing cash and securities, and non-compliant income, each relative to a base such as market capitalisation or total assets. Commonly cited ceilings fall around a third for debt and cash ratios and a few percent for impure income, but the exact figures and the denominator differ between standards and index providers. Always check the methodology of the screen being used.

## Purification

If a company passes but earns a small share of income from impermissible sources, investors typically donate the corresponding portion of their dividends to charity. This is called purification. Some funds do it for you.

## Why screens disagree

One stock can pass one provider's screen and fail another's because of different denominators, averaging periods or treatment of certain income. That is normal. For individual decisions, consult a qualified Sharia scholar or the board of the fund you use.`,
  },
  {
    slug: "nasdaq-leadership-narrow-or-broadening",
    title: "Nasdaq Leadership: Narrow or Broadening?",
    excerpt:
      "A handful of mega-caps can carry an index. Breadth tells you whether the rest of the market is joining in or being left behind.",
    category: "equities",
    date: "2026-09-28",
    image: px(7567565),
    readTime: 4,
    content: `## Concentration is a feature of the index

The Nasdaq is cap-weighted, so its largest constituents dominate the headline return. When a few names rise strongly, the index can climb even while most members lag. That is not an error. It is a reminder to read the index with a second lens.

## Measuring breadth

Compare the cap-weighted index with its equal-weighted counterpart. Track the share of constituents above their 50- and 200-day averages, and the ratio of new highs to new lows. If these improve alongside the index, leadership is widening. If they deteriorate, the advance is narrowing.

## What each regime implies

Narrow leadership makes the index sensitive to a few earnings reports and a few valuations. Broadening participation spreads that risk and usually reflects improving confidence in growth outside the largest firms.

## Equilibrium view

Extreme concentration tends to mean-revert, though timing is unpredictable. Leadership rotates when rates fall, when earnings expectations catch up in neglected areas, or when the leaders disappoint. Watching breadth tells you which of these is underway.`,
  },
  {
    slug: "bitcoin-etf-flows-positioning-reset",
    title: "Bitcoin ETF Flows Cool Down: A Positioning Reset?",
    excerpt:
      "After a stretch of heavy inflows, slower flows may reflect digestion rather than disinterest. The distinction matters for how the next move develops.",
    category: "digital-assets",
    date: "2026-09-26",
    image: px(534216),
    readTime: 4,
    content: `## From surge to pause

Strong ETF inflows often arrive in bursts, tied to price momentum and new distribution channels. A cooling period follows when early buyers are done and later ones wait for better entry points. Slower flows alone do not signal weakness.

## Digestion versus distribution

Digestion looks like flat or mildly positive flows, stable prices and falling realised volatility. Distribution looks like persistent outflows, rising volatility and weaker rallies. Distinguishing the two requires several weeks of data, not a single day.

## Cross-checks

Compare ETF flows with exchange balances, stablecoin supply and derivatives funding rates. If funding is neutral and stablecoin supply holds steady, positioning is resetting without stress. If funding is negative and exchange inflows rise, selling pressure is building.

## Equilibrium reading

Reset phases clear excess leverage and shorten the list of participants who need to sell. They often precede the next directional move, though not always in the direction the prior trend suggests. Treat them as a pause for information.`,
  },
  {
    slug: "uk-gdp-services-drag-monthly-print",
    title: "UK GDP: Services Drag in the Latest Monthly Print",
    excerpt:
      "A soft services reading complicates the Bank of England's path and tests how much weakness it is willing to look through.",
    category: "macro",
    date: "2026-09-25",
    image: px(6772076),
    readTime: 4,
    content: `## What the print showed

Monthly GDP is volatile and often revised, but a soft services component stands out because services are most of the UK economy. A weak reading suggests domestic demand is losing momentum, even if goods and construction offset part of it.

## The Bank of England's dilemma

The Monetary Policy Committee is balancing sticky services inflation against slowing output. Weak growth argues for easing. Persistent services prices and wage growth argue for patience. One soft month is rarely enough to change the stance, but a run of them is.

## Market reaction channels

Gilt yields typically fall on weak growth surprises as rate-cut expectations rise. Sterling often softens at the same time. If gilts sell off despite weak data, the market is focusing on inflation or fiscal supply instead.

## What would shift the view

Revisions to prior months, forward-looking surveys such as PMIs, and wage settlements. Confirmation from several sources would suggest a genuine slowdown rather than noise.`,
  },
];

/** Seed articles + anything the generator script has committed to data/articles.json. */
export const ARTICLES: Article[] = (() => {
  const seen = new Set<string>();
  return [...(generated as Article[]), ...SEED_ARTICLES].filter((a) => {
    if (seen.has(a.slug)) return false;
    seen.add(a.slug);
    return true;
  });
})();

/* ---------- Helpers ---------- */

export function getAllArticles(): Article[] {
  return [...ARTICLES].sort((a, b) => b.date.localeCompare(a.date));
}

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function isCategorySlug(value: string): value is CategorySlug {
  return value in CATEGORY_META;
}

export function getArticlesByCategory(slug: string): Article[] {
  return getAllArticles().filter((a) => a.category === slug);
}

export function getAllCategories(): Category[] {
  return (Object.keys(CATEGORY_META) as CategorySlug[]).map((slug) => ({
    slug,
    name: CATEGORY_META[slug].name,
    description: CATEGORY_META[slug].description,
    count: ARTICLES.filter((a) => a.category === slug).length,
  }));
}

export function getCategoryName(slug: string): string {
  return isCategorySlug(slug) ? CATEGORY_META[slug].name : slug;
}

export function getRelatedArticles(article: Article, limit = 3): Article[] {
  const all = getAllArticles().filter((a) => a.slug !== article.slug);
  const same = all.filter((a) => a.category === article.category);
  const rest = all.filter((a) => a.category !== article.category);
  return [...same, ...rest].slice(0, limit);
}
