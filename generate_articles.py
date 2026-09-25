#!/usr/bin/env python3
"""
Armonia Capital — automated content pipeline (runs on GitHub Actions, $0 cost)

Flow:
  1. Pull headlines from free finance RSS feeds
  2. Skip anything already published (tracked in state/seen.json)
  3. Send each new item to Groq's free-tier LLM API, rewritten into house style
  4. Write a static HTML article page + update articles/index.json (feeds the homepage)

Env vars required (set as GitHub Actions secrets):
  GROQ_API_KEY   — free at https://console.groq.com
"""

import os
import re
import json
import html
import hashlib
import datetime
import urllib.request
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTICLES_DIR = os.path.join(ROOT, "articles")
STATE_DIR = os.path.join(ROOT, "state")
SEEN_PATH = os.path.join(STATE_DIR, "seen.json")
INDEX_PATH = os.path.join(ARTICLES_DIR, "index.json")

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"  # free tier, generous daily quota

# Free RSS/Atom feeds — swap/add as you like. Keep to reputable wire/official sources.
FEEDS = {
    "Macro": "https://www.federalreserve.gov/feeds/press_all.xml",
    "Markets": "https://finance.yahoo.com/news/rssindex",
    "Equities": "https://www.marketwatch.com/rss/topstories",
    "Islamic Finance": "https://salaamgateway.com/feed/insights",  # Atom feed — handled below
}

MAX_NEW_ARTICLES_PER_RUN = 4  # keeps each run fast + within free-tier limits

HOUSE_STYLE_PROMPT = """You are the lead writer for Armonia Capital, a markets-intelligence \
publication whose voice is about EQUILIBRIUM: where positioning has overshot, where flows are \
quietly reversing, what's overextended vs cheap. Never hype, never generic.

Armonia Capital's differentiator is an Islamic Finance vertical most market-intelligence \
sites skip entirely. When the source item is about Islamic/Sharia-compliant finance (sukuk, \
halal equity screening, Islamic banks, zakat-linked funds, AAOIFI/Sharia board rulings, GCC \
Islamic capital markets), write it with working knowledge of the space: explain riba \
(interest) avoidance, debt-ratio/haram-income screening thresholds, or sukuk structures in \
plain language for a reader who may be new to the space, without being preachy or religious \
in tone — this is markets journalism, not a sermon.

Given a news headline + summary, write an original article in this exact structure:
1. A punchy, specific headline (not the source headline verbatim — reframe it through the \
   equilibrium lens, or the halal/haram-screening lens if it's an Islamic Finance item).
2. A one-sentence lede stating the core fact.
3. 2-4 short H2-worthy sections, each 2-3 sentences, covering: what happened, why it matters, \
   what the data/positioning shows, and (if relevant) what to watch next.
4. Never fabricate specific numbers you weren't given — speak in terms of direction and \
   magnitude if exact figures aren't in the source.

Return ONLY valid JSON, no markdown fences, no preamble:
{"headline": "...", "category": "Markets|Macro|Equities|Digital Assets|Islamic Finance",
 "excerpt": "...", "sections": [{"heading": "...", "body": "..."}, ...]}
"""


def slugify(text):
    text = re.sub(r"[^a-zA-Z0-9\s-]", "", text).strip().lower()
    return re.sub(r"[\s_]+", "-", text)[:80]


def load_json(path, default):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return default


def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


ATOM_NS = "{http://www.w3.org/2005/Atom}"


def fetch_rss(url):
    """Minimal RSS + Atom parser — no external deps needed (feedparser optional upgrade).
    Salaam Gateway (Islamic Finance) serves Atom; the others serve RSS 2.0 — both handled."""
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        raw = resp.read()
    root = ET.fromstring(raw)
    items = []

    rss_items = root.findall(".//item")
    if rss_items:
        for item in rss_items[:10]:
            title = (item.findtext("title") or "").strip()
            desc = (item.findtext("description") or "").strip()
            link = (item.findtext("link") or "").strip()
            desc = re.sub("<[^<]+?>", "", html.unescape(desc))
            if title and link:
                items.append({"title": title, "summary": desc[:500], "link": link})
        return items

    # Atom fallback
    for entry in root.findall(f"{ATOM_NS}entry")[:10]:
        title = (entry.findtext(f"{ATOM_NS}title") or "").strip()
        summary = (entry.findtext(f"{ATOM_NS}summary")
                   or entry.findtext(f"{ATOM_NS}content") or "").strip()
        summary = re.sub("<[^<]+?>", "", html.unescape(summary))
        link_el = entry.find(f"{ATOM_NS}link")
        link = link_el.get("href") if link_el is not None else ""
        if title and link:
            items.append({"title": title, "summary": summary[:500], "link": link})
    return items


def call_groq(title, summary):
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY not set")
    body = json.dumps({
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": HOUSE_STYLE_PROMPT},
            {"role": "user", "content": f"Headline: {title}\nSummary: {summary}"},
        ],
        "temperature": 0.6,
        "max_tokens": 900,
    }).encode()
    req = urllib.request.Request(
        GROQ_URL, data=body,
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    content = data["choices"][0]["message"]["content"].strip()
    content = re.sub(r"^```(json)?|```$", "", content, flags=re.MULTILINE).strip()
    return json.loads(content)


ARTICLE_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{headline} — Armonia Capital</title>
<meta name="description" content="{excerpt}">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,450;9..144,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  body{{margin:0;background:#F6F4EE;color:#14181D;font-family:'Inter',sans-serif;line-height:1.6;}}
  .wrap{{max-width:720px;margin:0 auto;padding:56px 24px;}}
  a.back{{font-size:13px;color:#9C7A3C;text-decoration:none;}}
  .cat{{font-size:13px;color:#9C7A3C;margin:24px 0 10px;}}
  h1{{font-family:'Fraunces',serif;font-weight:450;font-size:clamp(28px,4vw,40px);line-height:1.15;margin:0 0 18px;}}
  .excerpt{{font-size:17px;color:#2A2F36;margin-bottom:32px;}}
  h2{{font-family:'Fraunces',serif;font-weight:450;font-size:21px;margin:32px 0 10px;}}
  p{{font-size:16px;color:#14181D;margin:0 0 14px;}}
  .meta{{font-size:12.5px;color:#5A6B6B;margin-top:40px;border-top:1px solid rgba(20,24,29,0.12);padding-top:16px;}}
</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="/">← Armonia Capital</a>
  <p class="cat">{category}</p>
  <h1>{headline}</h1>
  <p class="excerpt">{excerpt}</p>
  {body_html}
  <p class="meta">Published {date} · Not investment advice</p>
</div>
</body>
</html>
"""


def render_article(article, date_str):
    body_html = "\n".join(
        f"<h2>{s['heading']}</h2>\n<p>{s['body']}</p>" for s in article["sections"]
    )
    return ARTICLE_TEMPLATE.format(
        headline=article["headline"],
        category=article["category"],
        excerpt=article["excerpt"],
        body_html=body_html,
        date=date_str,
    )


def main():
    seen = load_json(SEEN_PATH, {"links": []})
    seen_links = set(seen["links"])
    index = load_json(INDEX_PATH, {"articles": []})

    new_count = 0
    for category, feed_url in FEEDS.items():
        if new_count >= MAX_NEW_ARTICLES_PER_RUN:
            break
        try:
            items = fetch_rss(feed_url)
        except Exception as e:
            print(f"[warn] could not fetch {feed_url}: {e}")
            continue

        for item in items:
            if new_count >= MAX_NEW_ARTICLES_PER_RUN:
                break
            if item["link"] in seen_links:
                continue

            print(f"[+] generating: {item['title'][:70]}")
            try:
                article = call_groq(item["title"], item["summary"])
            except Exception as e:
                print(f"[error] Groq call failed for '{item['title'][:50]}': {e}")
                continue

            slug = slugify(article["headline"]) or hashlib.md5(item["link"].encode()).hexdigest()[:10]
            date_str = datetime.date.today().isoformat()
            os.makedirs(ARTICLES_DIR, exist_ok=True)
            out_path = os.path.join(ARTICLES_DIR, f"{slug}.html")
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(render_article(article, date_str))

            index["articles"].insert(0, {
                "slug": slug,
                "headline": article["headline"],
                "category": article["category"],
                "excerpt": article["excerpt"],
                "date": date_str,
                "source_link": item["link"],
            })
            seen_links.add(item["link"])
            new_count += 1

    index["articles"] = index["articles"][:200]  # keep index bounded
    save_json(INDEX_PATH, index)
    save_json(SEEN_PATH, {"links": list(seen_links)[-2000:]})  # bounded state file
    print(f"[done] {new_count} new article(s) generated")


if __name__ == "__main__":
    main()
