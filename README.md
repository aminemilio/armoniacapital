# Armonia Capital — $0 automation pipeline

## What's new: Islamic Finance vertical
Added as a 4th content category — pulls from Salaam Gateway's free Islamic Finance/Halal
Industries feed (`https://salaamgateway.com/feed/insights`, Atom format, handled
automatically by the parser). The house-style prompt now writes these with working
knowledge of riba avoidance, Sharia screening thresholds, and sukuk structures — plain
language, not preachy. This is the differentiator Raw Capital and similar sites don't cover.

## What this does
- `scripts/generate_articles.py` — pulls RSS headlines, rewrites via Groq's free LLM API into
  house style, writes static HTML article pages + updates `articles/index.json`
- `scripts/send_brief.py` — sends a daily email brief (live prices + latest articles) to your
  subscriber list via Resend's free tier
- `.github/workflows/publish.yml` — runs the article generator 3x/day, commits new articles,
  which triggers your host (Cloudflare Pages / GitHub Pages) to auto-deploy
- `.github/workflows/send-brief.yml` — runs the email sender once a day

## One-time setup (all free)

1. **Groq API key** (article writing) — sign up at console.groq.com, create a key.
   Add as repo secret: `Settings → Secrets and variables → Actions → New secret → GROQ_API_KEY`

2. **Resend API key** (email sending) — sign up at resend.com, verify a sending domain
   (a subdomain like `mail.armoniacapital.com` works, add the DNS records they give you).
   Add as repo secret: `RESEND_API_KEY`
   Add as repo **variables** (not secrets, just config): `SITE_URL`, `FROM_EMAIL`

3. **Wire your subscribe form** to write into `automation/state/subscribers.json`.
   Simplest $0 way: point the homepage form at a free **Cloudflare Worker** (100k free
   requests/day) that appends the email to the JSON file via the GitHub API, or start
   manually — paste addresses into that file as you collect them until you have volume
   worth automating.

4. **Push this whole `automation/` folder** into the same repo as your site (`index.html`,
   `articles/`, etc.), connect the repo to Cloudflare Pages, and you're live.

## Costs to watch (still all free at reasonable volume)
- Groq free tier: generous daily token quota — 3 articles/run × 3 runs/day is nowhere close
- GitHub Actions: 2,000 free minutes/mo on private repos, unlimited on public repos — this
  workflow uses under 5 min/day
- Resend: 3,000 free emails/mo — fine up to ~100 daily subscribers
- CoinGecko: free public tier, no key — fine at this call volume

## What's intentionally left for you to decide
- Legal: a Financial Disclaimer + Privacy Policy page (required if you're publishing market
  commentary) — not generated here since it needs to reflect your actual entity/jurisdiction
- Whether to widen the RSS source list beyond the 3 feeds in `generate_articles.py`
- Moderation: nothing here fact-checks the LLM output before publishing — worth a manual
  skim of the first few weeks of articles before you fully trust the auto-publish
