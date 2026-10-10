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

**Cloudflare Pages (optional):** use the Next.js on Pages adapter (`@cloudflare/next-on-pages`); the `/api/quotes` route already uses the Edge runtime. Vercel needs no extra setup.

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

- `GET /api/quotes` (Edge, `revalidate = 60`) returns `{ ticker, dashboard }`.
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

## Newsletter

`components/Newsletter.tsx` validates the email and shows "You're on the list" client-side only; nothing is stored yet. To wire it: add `app/api/subscribe/route.ts` that validates the email and calls Resend (`RESEND_API_KEY`) to add the contact to an audience, then have `submit()` POST to it and show errors on failure.

## Legal

The disclaimer, privacy and terms pages are reasonable starting text, not legal advice. Have them reviewed for your jurisdiction before launch, especially for a financial-content site.
