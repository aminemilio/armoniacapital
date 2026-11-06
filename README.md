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

## Newsletter form

The form posts to `/api/subscribe` (see above). Without `RESEND_API_KEY` and `SUBSCRIBE_SECRET` set on Cloudflare it answers "Subscriptions are not available yet".

## Legal

The disclaimer, privacy and terms pages are reasonable starting text, not legal advice. Have them reviewed for your jurisdiction before launch, especially for a financial-content site.
