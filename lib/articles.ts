import type { Article, Category, CategorySlug } from "./types";
import generated from "../data/articles.json";
import overridesJson from "../data/image-overrides.json";

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
  learn: { name: "Learn", description: "Plain-language guides to markets, macro and Islamic finance" },
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
  {
    slug: "what-is-a-bond-yield-and-why-does-it-move-every-market",
    title: "What Is a Bond Yield, and Why Does It Move Every Market?",
    excerpt: "Bond yields set the price of money across the economy. Here is how they work, why they move inversely to bond prices, and why stock and currency traders watch them.",
    category: "learn",
    date: "2026-09-22",
    image: px(590041),
    readTime: 5,
    content: `## What a bond yield measures

A bond is a loan. You lend money to a government or company, and it pays you interest, called the coupon, and returns your principal at maturity. The yield is the annual return you earn relative to the price you actually pay. If a bond pays 4 units a year and costs 100, the yield is about 4 percent.

## Why prices and yields move in opposite directions

Existing bonds keep paying their fixed coupons. If new bonds start offering higher coupons, nobody will pay full price for the older, lower-paying ones, so their prices fall until their yield matches the new market level. A falling bond price therefore means a rising yield, and the reverse.

## What drives yields

Three things matter most: expectations for the central bank's policy rate, expected inflation, and the extra compensation investors demand for lending for a longer time. News that raises any of these tends to push yields up.

## Why other markets care

Yields act as the benchmark price of money. When they rise, mortgages and corporate borrowing cost more, and future company profits are worth less in today's terms, which weighs on stock valuations. Higher yields can also attract foreign money into a currency. That is why a surprise in inflation data can move bonds, stocks and the dollar within minutes.

## A useful habit

Look at real yields, which subtract expected inflation, as well as headline yields. A 4 percent yield means something very different when inflation is 2 percent than when it is 4 percent.`,
  },
  {
    slug: "how-central-banks-set-interest-rates-a-plain-language-guide",
    title: "How Central Banks Set Interest Rates: A Plain-Language Guide",
    excerpt: "Central banks do not decide rates on a whim. They balance inflation against jobs, using a short list of tools and imperfect data. Here is how the process works.",
    category: "learn",
    date: "2026-09-21",
    image: px(210607),
    readTime: 5,
    content: `## The job of a central bank

Most central banks have a mandate to keep prices stable. Some, like the US Federal Reserve, also target maximum employment. They pursue these goals mainly by setting a short-term policy rate, the rate at which banks lend to each other overnight.

## From one rate to the whole economy

When the policy rate rises, borrowing becomes more expensive for banks, and the effect spreads to mortgages, business loans and savings rates. Higher borrowing costs cool spending and hiring, which eventually slows price rises. Lowering rates works in the opposite direction. The effect takes months to appear, so policymakers act on forecasts, not only on today's data.

## The other tools

Central banks also use their balance sheets. Quantitative easing means buying bonds to push long-term yields down; quantitative tightening lets those holdings shrink. Forward guidance, the way officials describe their likely path, can move markets as much as an actual rate change.

## Why it is hard

No one can observe the neutral rate, the level at which policy neither speeds up nor slows the economy. Inflation data arrives late and is revised. Committees therefore move gradually, and often wait when the signals conflict.

## What to watch

The statement wording, the committee's projections, and the press conference. Markets compare each new statement with the previous one and trade the differences.`,
  },
  {
    slug: "what-is-sukuk-and-how-do-islamic-bonds-work",
    title: "What Is Sukuk? How Islamic Bonds Work, Step by Step",
    excerpt: "Sukuk look like bonds but are built on assets, not interest-bearing debt. A plain explanation of how the structure works and how it differs from a conventional bond.",
    category: "learn",
    date: "2026-09-20",
    image: px(730564),
    readTime: 5,
    content: `## The basic idea

A conventional bond is a loan that pays interest. Islamic finance prohibits interest, so sukuk work differently. A sukuk certificate gives its holder a share of ownership in an asset, the use of an asset, or a business venture. The returns come from what that asset earns, such as rent or profit, not from interest on a loan.

## A typical structure

An issuer sets up a special purpose vehicle. Investors buy certificates, and the vehicle uses the money to acquire or lease an asset, for example a building or equipment. The vehicle then leases the asset back to the issuer in return for regular payments. Those payments are passed on to investors as periodic returns. At maturity, the issuer buys the asset back and investors get their principal.

## Common contract types

Ijara sukuk are based on leasing. Murabaha sukuk are based on cost-plus sales. Mudarabah and musharakah sukuk are based on partnerships that share profit. Each structure has its own rules about how risk and returns are allocated.

## How sukuk differ from bonds in practice

Sukuk are tied to identifiable assets or ventures, which is why scholars require specific structures. Many are asset-based rather than fully asset-backed, meaning investors rely mainly on the issuer's credit. Investors still face credit and market risk, and prices move with interest-rate conditions much like conventional bonds.

## Who issues and buys them

Governments, state-linked entities and banks in the Gulf and Southeast Asia are large issuers. Buyers include Islamic banks, takaful operators, funds and increasingly international investors. Whether a particular sukuk is Sharia-compliant is decided by its scholars, so always check the issuer's board.`,
  },
  {
    slug: "what-is-the-us-dollar-index-dxy-and-how-to-read-it",
    title: "What Is the US Dollar Index (DXY) and How to Read It",
    excerpt: "DXY is the most quoted gauge of the dollar, but it covers only six currencies and leans heavily on the euro. Here is what it shows and what it leaves out.",
    category: "learn",
    date: "2026-09-19",
    image: px(6770610),
    readTime: 4,
    content: `## What DXY is

The US Dollar Index measures the dollar against a fixed basket of six currencies: the euro, Japanese yen, British pound, Canadian dollar, Swedish krona and Swiss franc. It began in 1973, and its composition has barely changed since the euro replaced several European currencies.

## The weights matter

The euro makes up well over half of the index. A move in the euro against the dollar therefore explains most of the move in DXY. When the index rises, the dollar is stronger against that basket; when it falls, it is weaker.

## How to read a move

A rising DXY often coincides with higher US yields, stronger US data, or a flight to safety. A falling DXY often follows expectations of lower US rates or improving global growth. Because many commodities, including gold and oil, are priced in dollars, a stronger dollar tends to weigh on them, though other forces can override that link.

## What DXY leaves out

It excludes the Chinese yuan, the Mexican peso and other currencies that matter for US trade. Broader trade-weighted indices exist for that reason. DXY is best used as a quick summary of dollar direction against developed-market currencies, not as a full picture.

## Practical tip

When a headline says the dollar rose, check which currencies drove it. A move led by the yen tells a different story from one led by the euro.`,
  },
  {
    slug: "market-breadth-explained-is-a-rally-broad-or-narrow",
    title: "Market Breadth Explained: Is a Rally Broad or Narrow?",
    excerpt: "An index can hit a new high while most stocks fall. Breadth indicators show whether a rally has wide support or rests on a few names.",
    category: "learn",
    date: "2026-09-18",
    image: px(187041),
    readTime: 4,
    content: `## Why headline indexes can mislead

Major indexes such as the S&P 500 and Nasdaq are weighted by company size. The largest companies have the biggest influence, so a few strong stocks can lift the whole index even when most members are flat or falling.

## Common breadth measures

The advance-decline line tracks how many stocks rise versus fall each day, cumulated over time. The share of stocks above their 50-day or 200-day moving average shows how many are in uptrends. The ratio of new highs to new lows shows how many stocks are leading or breaking down. Comparing an equal-weighted index with its cap-weighted version shows how much the giants are carrying the result.

## How to interpret them

If the index rises and breadth improves, the advance has broad support, which is generally a healthier sign. If the index rises while breadth weakens, the rally depends on fewer stocks and can be more fragile. Breadth does not time turning points; divergences can last for months.

## Why it matters

Narrow markets concentrate risk. A disappointment from one or two large companies can move the entire index. Broad markets spread that risk and usually reflect wider confidence in the economy.

## A balanced approach

Treat breadth as context, not a trading signal. Use it alongside earnings, interest rates and valuations to judge how stretched the market is.`,
  },
  {
    slug: "what-are-spot-crypto-etfs-and-what-do-etf-flows-tell-you",
    title: "What Are Spot Crypto ETFs, and What Do ETF Flows Tell You?",
    excerpt: "Spot crypto ETFs hold the underlying coin and trade like stocks. Their daily flows are a useful, but imperfect, clue about demand.",
    category: "learn",
    date: "2026-09-17",
    image: px(844124),
    readTime: 5,
    content: `## What a spot ETF is

A spot crypto exchange-traded fund holds the actual cryptocurrency, such as bitcoin, and issues shares that trade on a stock exchange. Investors get exposure through an ordinary brokerage account without managing wallets or keys. The fund charges an annual fee for custody and administration.

## How flows are created

Large financial firms called authorised participants create or redeem fund shares. When demand for shares is high, they deliver cash or coins to the fund and receive new shares, so the fund buys more of the asset. When investors sell, shares are redeemed and the fund sells. Net flow is creations minus redemptions, usually reported daily by issuers and data providers.

## What flows can tell you

Sustained inflows suggest new capital is entering through regulated channels. Persistent outflows suggest investors are reducing exposure. Flows are easier to track than most crypto activity because they are reported by regulated funds.

## Limits of the signal

Flows show what investors did, not what will happen next. They can follow price rather than lead it. Some flows are arbitrage or hedging trades, such as basis trades, rather than directional bets. One day of data is noise; weeks of data are more informative.

## How to use it

Compare ETF flows with exchange volumes, derivatives positioning and funding rates. When several indicators agree, the picture is more reliable than any single one.`,
  },
  {
    slug: "riba-explained-how-islamic-finance-avoids-interest",
    title: "Riba Explained: How Islamic Finance Avoids Interest",
    excerpt: "Riba is at the centre of Islamic finance. Here is what it means, why it is prohibited, and which contracts are used instead.",
    category: "learn",
    date: "2026-09-16",
    image: px(6801648),
    readTime: 5,
    content: `## What riba means

Riba literally means increase or excess. In finance it refers to a predetermined return charged on a loan, in other words interest. Classical Islamic jurisprudence prohibits it, along with excessive uncertainty and speculation without a real underlying transaction.

## The reasoning

The common explanation is that money should not earn a guaranteed return simply by being lent. Returns should be linked to real economic activity and the sharing of risk. Scholars discuss this at length, and interpretations of how the rule applies to modern banking vary.

## Contracts used instead

A murabaha is a sale in which the seller discloses cost and adds an agreed margin. An ijara is a lease. A mudarabah is a partnership between a capital provider and an entrepreneur who share profits by agreement. A musharakah is a joint venture in which partners share profit and loss according to their contributions. Each replaces a loan with a transaction tied to an asset or a venture.

## What this means for savers and investors

Islamic banks offer profit-sharing deposits and financing based on these contracts. In investing, funds screen out companies whose main business is prohibited and cap leverage and interest income through ratio tests. Any small impure income is typically purified through charitable donations.

## A note on diversity of views

Standards differ between scholars, jurisdictions and index providers. If a decision matters to you, consult a qualified Sharia scholar or the sharia board of the institution you are dealing with.`,
  },
];

/** Seed articles + anything the generator script has committed to data/articles.json. */
export const ARTICLES: Article[] = (() => {
  const seen = new Set<string>();
  const overrides = (overridesJson as { overrides?: Record<string, { image: string; credit?: string }> }).overrides ?? {};
  return [...(generated as Article[]), ...SEED_ARTICLES]
    .filter((a) => {
      if (seen.has(a.slug)) return false;
      seen.add(a.slug);
      return true;
    })
    // data/image-overrides.json (written by `npm run fix-images`) replaces photos that do not fit their category.
    .map((a) => (overrides[a.slug] ? { ...a, image: overrides[a.slug].image, imageCredit: overrides[a.slug].credit ?? a.imageCredit } : a));
})();

/* ---------- Helpers ---------- */

const stamp = (a: Article): string => a.publishedAt ?? `${a.date}T00:00:00.000Z`;

export function getAllArticles(): Article[] {
  return [...ARTICLES].sort((a, b) => stamp(b).localeCompare(stamp(a)));
}

/** News and analysis only: educational guides are shown in the Learn section instead. */
export function getLatestIntelligence(): Article[] {
  return getAllArticles().filter((a) => a.category !== "learn");
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
