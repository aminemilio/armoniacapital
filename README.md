# Armonia Capital

Financial market intelligence site for **armoniacapital.com**: markets through an equilibrium lens, with Islamic finance as a core vertical.
Next.js 15 (App Router) · TypeScript · Tailwind CSS 3 · Edge route for live quotes.

> This is a **new codebase**. Do not mix it with the old static HTML + Python GitHub Actions repo until cutover.

## Run locally

```bash
npm install
cp .env.local.example .env.local
npm run dev        # http://localhost:3000
npm run typecheck  # optional
npm run build && npm start
```

## Deploy to Vercel (recommended)

1. Push this folder to a new Git repo.
2. In Vercel: **Add New → Project**, import the repo (framework auto-detected as Next.js).
3. Add environment variables (below), then deploy.
4. **Settings → Domains**: add `armoniacapital.com` (and `www.armoniacapital.com`).
5. At your registrar, set DNS as Vercel shows: `A  @  76.76.21.21` and `CNAME  www  cname.vercel-dns.com` (use the exact values Vercel displays for your project).
6. Set `SITE_URL=https://armoniacapital.com` so canonical URLs, sitemap and robots are correct.

**Cloudflare Pages (optional):** use the Next.js on Pages adapter (`@cloudflare/next-on-pages`); the site runs on Cloudflare Workers through OpenNext (`@opennextjs/cloudflare`), which does not support `runtime = "edge"`, so `/api/quotes` uses the default runtime. Vercel needs no extra setup.

## Environment variables

Copy `.env.local.example` to `.env.local` (local) and add the same keys in Vercel → Settings → Environment Variables. For the GitHub Action, add the keys as repo **Secrets** (Settings → Secrets and variables → Actions).

| Variable | Used for |
| --- | --- |
| `SITE_URL` | Canonical URL, sitemap, robots |
| `LLM_PROVIDER` | `gemini` (default) or `groq` |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Article generator with Google Search grounding |
| `GROQ_API_KEY`, `GROQ_MODEL` | Article generator with `groq/compound` built-in web search |
| `PEXELS_API_KEY`, `PIXABAY_API_KEY` | Article images (Pexels first, Pixabay as fallback) |
| `DRAFT_MODE` | `true` = write to `data/drafts.json` for review instead of publishing |
| `ARTICLES_PER_RUN`, `CATEGORY` | How many per run (max 5) and an optional fixed category |
| `RESEND_API_KEY` | Future newsletter delivery |

The site itself needs none of the keys to run; they are only used by `npm run generate`.

## How live data works

- `GET /api/quotes` (`revalidate = 60`) returns `{ ticker, dashboard }`.
- **Crypto** (BTC, ETH, SOL, XRP) comes from the free CoinGecko public API, with a 5 s timeout.
- **S&P 500, NASDAQ, gold (futures), DXY, NVDA, TSLA** come from Yahoo Finance's free, keyless chart endpoint (`fetchEquities`). It is unofficial and can rate-limit or change, and quotes can be delayed. Each symbol falls back to its own mock value if its request fails; the UI labels mocks "indicative" and live values "LIVE". For a supported free API with a key, swap `fetchYahooOne` for Finnhub or Twelve Data (free tiers are rate-limited and may not include indices).
- If CoinGecko fails or rate-limits, the route returns mocks. If the route itself fails, the client keeps the last good data (or mocks). Nothing waits on "Loading…" forever.
- Client components use `lib/use-quotes.ts`, which polls every 60 s.
- The sentiment heatmap is deterministic: score = 15 + hash(`YYYY-MM-DD:REGION`) mod 71, so it changes daily and is stable within a day. It is illustrative, not a measured indicator.

## Content

Hand-written seed articles live in `lib/articles.ts`. Generated ones live in `data/articles.json` and are merged in automatically (slugs are de-duplicated). Both use the same `Article` shape; lines starting with `## ` in `content` become headings.

### Automated articles (`npm run generate`)

`scripts/generate-articles.ts` does one pass per article:

1. Picks a category (rotates daily, or `CATEGORY=...`).
2. Asks a web-enabled model to research the last ~48 hours and write a note in the site's voice. `LLM_PROVIDER=gemini` uses Google Search grounding; `LLM_PROVIDER=groq` uses `groq/compound`, which searches the web server-side.
3. **Rejects the article** if fewer than 2 real web sources came back, it is too short, has too few sections, or contains advice-like phrases ("price target", "guaranteed", ...).
4. Fetches an unused landscape image from Pexels, or Pixabay if Pexels has no key or no result, and stores the credit line shown under the image.
5. Saves the article with its sources (shown in a "Sources" list on the page) to `data/articles.json`.

Run it locally with `npm run generate` (it reads the keys from `.env.local`), or let `.github/workflows/generate-articles.yml` run it daily (05:00 UTC) and commit the result; Vercel then redeploys. Trigger it manually from the Actions tab with "Run workflow".

Model names change often. Pin a current id in `GEMINI_MODEL` from Google's model list, and check the free-tier quota (including Search grounding) in AI Studio. If the quota runs out the run fails cleanly and nothing is committed.

**Review before trusting it.** This is financial content produced by a model. Start with `DRAFT_MODE=true`, read the drafts in `data/drafts.json`, and move good ones into `data/articles.json`. Once you trust the output, switch to publishing directly and spot-check regularly. Fully automated, unreviewed articles can also run into search-engine and ad-network policies on scaled AI content.

Seed images are Pexels URLs; replace any that no longer resolve.

## News, RSS and Learn

- **Market news (`/news`, homepage block):** `/api/news` fetches the feeds listed in `data/feeds.json`, parses RSS/Atom, merges, de-duplicates and sorts them. The page refreshes every 5 minutes in the browser; the server caches for 5 minutes per instance. A feed that fails is skipped, and the page says how many sources answered. Only headlines, a short summary and a link to the publisher are shown.
- **Add or remove a source:** edit `data/feeds.json` (`name`, `url`, `topic`, optional `"enabled": false`) and push. Topics become the filter buttons. Check each publisher's terms before enabling it on a monetised site: for example BBC feeds are licensed for non-commercial use, so BBC and CNBC ship disabled.
- **Regions and countries:** each feed in `data/feeds.json` has `regions` (`Europe`, `Africa`, `Asia`, `MENA`, `Global`) and an optional `country`. Region pages live at `/news/europe`, `/news/africa`, `/news/asia` and `/news/mena`, with country filter chips (Africa: South Africa, Egypt, Nigeria, Algeria, Morocco, the five largest economies by 2026 IMF nominal GDP projections). Edit region names, descriptions and country lists in `lib/regions.ts`. A feed can belong to several regions (Egypt is in Africa and MENA).
- **Check your feeds:** run `npm run check-feeds` (add `-- --all` to include disabled ones). It prints OK or FAIL for each feed from your own machine; set `"enabled": false` on any FAIL. Feeds marked `"verified": true` were confirmed to exist when the list was written; the others use the publishers' usual feed addresses and may need fixing.
- **Your own RSS feed:** `/feed.xml` lists the latest 30 articles and is advertised in the page `<head>`, so readers and aggregators can find it.
- **Learn (`/learn`, `/learn/glossary`):** guides use the same article format with category `learn`. They are excluded from the "Latest intelligence" block. The glossary lives in `lib/glossary.ts`. The generator writes one new Learn guide every Saturday (and any time you run the workflow manually with category `learn`).
- **Dates:** generated articles store a full timestamp (`publishedAt`) and show "Oct 17, 2026 · 12:35 UTC" on the article page; lists sort newest first.
- **Articles not appearing?** If the workflow variable `DRAFT_MODE` is `true`, new articles go to `data/drafts.json` and are never shown. Set `DRAFT_MODE` to `false` (Settings → Secrets and variables → Actions → Variables) to publish automatically.

## How article generation works (Groq)

`npm run generate` with `LLM_PROVIDER=groq` runs four stages:
1. **Radar** (`data/trends.json`): our own feeds plus GDELT's worldwide headlines are clustered by a small model into the 8 stories trending right now, plus sub-niche angles per region and country.
2. **Research**: two web-search passes with `openai/gpt-oss-120b`. Pass 1 gathers verified facts (primary sources first); pass 2 looks for regional and Islamic-finance angles in local sources.
3. **Write**: the article is written from the verified notes only (900 to 1,150 words, SEO fields included).
4. **Revise**: if a check fails (too short, banned cliché, too few sections or sources), the draft is rewritten up to 2 times.

Groq's free tier allows about 8,000 tokens per minute per model, so the script pauses about a minute between heavy calls and waits out 429 rate-limit replies automatically. A run takes roughly 4 to 6 minutes. If you hit a *daily* limit the run stops with a clear message; upgrading to Groq's Dev tier removes the waiting.

## Schedule: one article a day

The workflow runs once a day at 06:00 UTC. Monday to Friday it writes one news-analysis article (the category rotates through Markets, Macro, Equities, Digital Assets and Islamic Finance) framed for the European and US sessions. On Saturday it writes one Learn guide. You can also run it by hand from the Actions tab and type a category. Each run costs roughly 40,000 Groq tokens including the featured asset.

## Featured asset of the day

After the article, the generator picks one asset from `data/universe.json` (stocks and coins chosen for real-world utility) whose business connects to the day's trending stories. It avoids anything featured in the last 14 days, researches what the asset actually does with web search, and saves the result to `data/featured.json`: utility, evidence of use, why it is in focus today, risks and sources. The dashboard card shows that profile with a live price (CoinGecko for coins, Yahoo for stocks). The text is checked for recommendation wording ("buy", "undervalued", price targets) and rejected if it contains any; the card always says it is not investment advice. Add or remove assets in `data/universe.json` (`symbol`, `name`, `type`, plus `coingeckoId` for coins or a Yahoo ticker in `yahoo` for stocks). Set the workflow variable `FEATURED` to `false` to turn the step off.

## Priority sources

`data/sources.json` lists local sites the research step checks first for regional angles (currently Algerian Business, La Minute Arabe's English edition and Energy Circle). Add a site there when you find a good one. Sites with an RSS feed can also go in `data/feeds.json` so their headlines show on the news page. LinkedIn pages cannot be read automatically, so use LinkedIn to discover sources, then add their websites here.

## Translation (Cloudflare)

Feeds marked `"lang": "fr"` in `data/feeds.json` are translated to English when the news loads. Add `GROQ_API_KEY` as a **secret** in your Cloudflare Worker (Settings → Variables and Secrets) for this to work. Without it, non-English items are hidden instead of shown in French.

## Email briefing: how it works

1. **Sign-up (double opt-in).** The form on the homepage calls `/api/subscribe`, which emails a confirmation link. Clicking it (`/api/confirm`) creates the contact in Resend and adds it to your briefing segment. Nobody can subscribe someone else's address.
2. **Daily briefing.** After the article, the generator writes "The Morning Balance" from verified material only: the day's research notes, the trending-story radar, regional headlines with their links, a live price snapshot computed by code, and the featured asset. Links must come from the supplied headlines or notes, and any figure not found in that material triggers a rewrite (or the sentence is dropped). The result is saved to `data/briefing.json`.
3. **Sending.** The last workflow step (`npm run send-briefing`) waits until the day's article is live on the site, then sends one Resend broadcast named `briefing-YYYY-MM-DD` to your segment. A second run the same day skips it, and Resend handles the unsubscribe link and unsubscribes.

### One-time setup

1. Create a Resend account and **verify your domain**: Resend dashboard > Domains > Add domain `armoniacapital.com`, then add the DNS records it shows in Cloudflare DNS (set each record to "DNS only", not proxied) and click Verify. Until the domain is verified, Resend only delivers to your own account email.
2. **API key:** Resend > API Keys > Create, with **Full access** (sending-only keys cannot manage contacts or broadcasts).
3. **Segment:** Resend > Segments > Create "Briefing subscribers" and copy its ID.
4. **Cloudflare** (Worker > Settings > Variables and Secrets): secrets `RESEND_API_KEY`, `SUBSCRIBE_SECRET` (any long random string); variables `RESEND_SEGMENT_ID`, `EMAIL_FROM` (for example `Armonia Capital <briefing@armoniacapital.com>`), `SITE_URL`.
5. **GitHub** (repo > Settings > Secrets and variables > Actions): secret `RESEND_API_KEY`; variables `RESEND_SEGMENT_ID`, `EMAIL_FROM`, `SITE_URL`. Optional variables: `SEND_BRIEFING=false` to pause sending, `BRIEFING=false` to skip writing it.
6. **Test delivery** from your computer, with the same values in `.env.local`: `npm run send-briefing -- --test you@example.com`. It sends one email to you (the real briefing if one exists, otherwise a short test) and prints Resend's answer, including the reason if it refuses.

Resend's free plan has daily and monthly sending limits and contact limits; check them against your list size.

## Images that fit the article

`scripts/images.ts` picks a photo per category from curated topics (Islamic finance: mosque architecture, geometric patterns, Gulf and Malaysian skylines, calligraphy; Equities: trading floors and charts; and so on) and rejects any photo whose description or tags match a block list (for example crypto or bitcoin on a non-crypto article; casino, alcohol, or other religions' symbols on Islamic finance). For Islamic finance the model's own image idea is ignored. `npm run fix-images` audits articles that already exist and writes replacements to `data/image-overrides.json`; the workflow runs it before each generation and checks each article only once.

## Featured asset page

`/featured` shows today's full profile (what it does, evidence, why it is in focus, risks, a short analysis and sources) and every earlier pick (`data/featured-archive.json`). A profile that cites figures older than last year is rejected and researched again.

## Three articles a day: the economies that move the world

Monday to Friday the generator writes one article for each of three desks: the **United States**, the **European Union and euro area**, and **China**. Each desk gets a different site section every day (Markets, Macro, Equities, Digital Assets, Islamic Finance, rotating), so the three pieces differ and every section is covered over time. Each article leads with that economy and adds one paragraph on spillovers to emerging markets, Africa, the Gulf and Asia. Saturday: one Learn guide. Sunday: "the week ahead" for the three economies. Desk pages live at `/economy/us`, `/economy/eu` and `/economy/china`, and the homepage shows the latest piece from each.

**Always the latest:** research is told to start from the newest official releases and financial statements (central bank statements and minutes, statistics-office releases, company filings and earnings), to date every fact, and to use only material from the last 7 to 10 days for the main story. If the notes come back without recent dates, the script searches again once. An article that leans on figures from before last year is sent back for a rewrite.

**Token budget:** about 20,000 to 25,000 Groq tokens per article, so a weekday run is roughly 100,000 tokens including the radar, the featured asset and the briefing. Groq's free tier allows about 200,000 per day on the main model. Articles are saved as soon as each one finishes, and if the daily limit is hit the run stops cleanly and keeps what it finished. To cut usage, set the repo variable `RESEARCH_PASSES` to `1`, or `DESKS` to a subset such as `us,eu`. A weekday run takes about 20 to 30 minutes because Groq's per-minute limit forces pauses.

## Sections, search and trust pages

**Sections:** Markets (now includes macro, equities, rates, commodities and currencies), Energy, Digital Assets and Islamic Finance, plus the three economy desks (`/economy/us`, `/economy/eu`, `/economy/china`), News, Learn and the featured asset. The old `/category/macro`, `/category/equities`, `/category/stock` and `/category/investing` addresses redirect permanently to Markets, and older articles keep working.

**Search:** the magnifier in the header opens a search bar. `/search?q=...` looks up a live price for a ticker, coin or company name (Yahoo Finance's unofficial endpoints, so it can fail and then simply shows no price card), and searches our articles, asset profiles, glossary and the latest headlines.

**Pages for readers and ad networks:** About, Contact (form delivers to the `CONTACT_TO` address through Resend), Editorial policy and AI use, Privacy, Terms, Disclaimer, and a cookie banner. Edit your public details in `lib/site.ts`. The banner stores the choice in `localStorage`; load any future analytics or ad script only when `allowsOptional()` from `lib/consent.ts` returns true. For AdSense traffic from the EU and UK, Google also requires a certified consent tool, which AdSense provides for free once you are approved.

## A second AI provider (optional)

Any OpenAI-compatible API can take over the steps that need no web search (radar, writing, revising, the briefing, the featured pick). Set `FALLBACK_BASE_URL`, `FALLBACK_MODEL` and the secret `FALLBACK_API_KEY` (for Z.ai: base URL `https://api.z.ai/api/paas/v4` and one of its free "flash" models; check Z.ai's current model list). With `OFFLOAD_WRITING=true` it is used first, which cuts Groq usage by more than half and leaves Groq for the browsing research. With `OFFLOAD_WRITING=false` it only steps in when Groq hits a daily or rate limit. The research steps always stay on Groq because they need its built-in web search.

## If a run fails or looks weak

- **"Article too short" repeatedly, or a run over ~20 minutes:** the writer is told the word count is a hard minimum and gets up to 4 tries; a persistently short result usually means the research notes were themselves too thin (check the "Raw model output" or notes length in the log).
- **"Groq 500" several times in a row:** a transient fault on Groq's side. The script retries up to 6 times with a growing pause, and switches the web-search setting from "required" to "optional" on the last 3 tries in case the forced browsing itself is what is failing.
- **"still rate limited or erroring":** that one article is skipped; the run continues with the others, so a bad day costs one article, not three.
- **Token or time budget tight:** set the repo variable `RESEARCH_PASSES` to `1`, or `DESKS` to `us,eu` to publish two a day instead of three.

## Wider stock search (Twelve Data)

The search bar's coverage was limited to tickers Yahoo's unofficial search recognised. Get a free key at twelvedata.com (about 800 requests/day) and add it as the Cloudflare secret `TWELVEDATA_API_KEY`: the search then also covers most European, Gulf and Asian exchanges, shown with their exchange name (for example "SAP SE (Germany) · XETRA"). Without the key, search still works through Yahoo and your own `data/universe.json`, just with narrower international coverage.

## Official data grounding (Econdb) and Sharia screening (Halal Terminal)

**Econdb** (econdb.com) is a free, keyless API for official economic series (GDP, CPI, unemployment and more). It can feed real, dated figures straight into the US/EU/China research prompts, so an article can cite an exact official number instead of only what a web search turns up. Econdb's ticker codes are not guessable reliably, so every line in `data/econdb-series.json` starts `"enabled": false`. To turn one on: search the indicator and country on econdb.com, open the series, copy its ticker from the URL, put it in the file, then run `npm run check-econdb` to confirm it returns data before setting `"enabled": true`.

**Halal Terminal** (halalterminal.com) screens individual stocks for Sharia compliance. Its free tier is small (about 50 calls a month), so it is used only when an Islamic Finance article's research already names a specific stock, adding one verified compliance line to the notes. Get a free key at halalterminal.com and add it as the Cloudflare secret `HALALTERMINAL_API_KEY`; without it, this step is skipped.

**Why not the other sites in your list:** Helium Trades is an options-trading platform, not a data API. Alpaca's Market Data API is solid but free-tier US-only and would duplicate what Yahoo and Twelve Data already cover here.

## Wider price tape, breaking news bar, and more US coverage

- **Price tape:** now also carries FTSE 100, DAX, Nikkei 225, Hang Seng, Sensex, Bovespa, Tadawul, five more FX pairs (GBP, JPY, AUD, CAD, CNY), WTI and Brent crude, natural gas, silver, copper, wheat and corn — all through the same free Yahoo endpoint, no new key needed.
- **Breaking news bar:** a red strip under the price tape, visible only when a story is confirmed by 2 or more independent sources within the last 6 hours (checked against your existing news feeds every 5 minutes). It rotates through up to 6 such stories every 8 seconds and disappears when there is nothing to show. No extra API needed — it is computed from the same feeds already in `data/feeds.json`.
- **More US coverage:** CNBC is now enabled (it was present but switched off for licensing caution; turning it on is your call, already done here), plus MarketWatch and Yahoo Finance headline feeds.

## Checking the signup setup

Open `https://your-site/api/subscribe` in a browser. It lists which settings the server can read (`RESEND_API_KEY`, `SUBSCRIBE_SECRET`, `RESEND_SEGMENT_ID`), never their values. `"ready": true` means the signup form can send confirmation emails.

## Newsletter form

The form posts to `/api/subscribe` (see above). Without `RESEND_API_KEY` and `SUBSCRIBE_SECRET` set on Cloudflare it answers "Subscriptions are not available yet".

## Legal

The disclaimer, privacy and terms pages are reasonable starting text, not legal advice. Have them reviewed for your jurisdiction before launch, especially for a financial-content site.
