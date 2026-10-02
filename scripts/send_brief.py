#!/usr/bin/env python3
"""
Armonia Capital — daily email brief ($0 cost via Resend free tier: 3,000 emails/mo)

Reads:
  - state/subscribers.json  -> ["a@b.com", "c@d.com", ...]
  - articles/index.json     -> today's latest articles

Sends one email per subscriber via Resend's transactional API.

Env vars required (GitHub Actions secrets):
  RESEND_API_KEY   — free at https://resend.com
  SITE_URL         — e.g. https://armoniacapital.com
  FROM_EMAIL       — e.g. brief@armoniacapital.com (must be a verified Resend domain)
"""

import os
import json
import datetime
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUBSCRIBERS_PATH = os.path.join(ROOT, "state", "subscribers.json")
INDEX_PATH = os.path.join(ROOT, "articles", "index.json")

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SITE_URL = os.environ.get("SITE_URL", "https://armoniacapital.com")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "brief@armoniacapital.com")
RESEND_URL = "https://api.resend.com/emails"

COINGECKO_URL = ("https://api.coingecko.com/api/v3/simple/price"
                  "?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true")


def load_json(path, default):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return default


def get_market_snapshot():
    try:
        req = urllib.request.Request(COINGECKO_URL, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        rows = []
        for coin, sym in [("bitcoin", "BTC"), ("ethereum", "ETH"), ("solana", "SOL")]:
            d = data.get(coin)
            if not d:
                continue
            chg = d.get("usd_24h_change", 0)
            arrow = "▲" if chg >= 0 else "▼"
            rows.append(f"{sym}: ${d['usd']:,.0f} ({arrow}{abs(chg):.1f}%)")
        return " · ".join(rows)
    except Exception as e:
        print(f"[warn] market snapshot failed: {e}")
        return "Market data unavailable this morning."


def build_email_html(articles, snapshot, date_str):
    items_html = ""
    for a in articles[:5]:
        items_html += f"""
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #e5e1d6;">
            <div style="font-size:12px;color:#9C7A3C;margin-bottom:4px;">{a['category']}</div>
            <a href="{SITE_URL}/articles/{a['slug']}.html"
               style="font-family:Georgia,serif;font-size:17px;color:#14181D;text-decoration:none;">
              {a['headline']}
            </a>
            <div style="font-size:13.5px;color:#5A6B6B;margin-top:4px;">{a['excerpt']}</div>
          </td>
        </tr>"""
    return f"""
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,sans-serif;background:#F6F4EE;padding:32px 24px;">
      <div style="font-family:Georgia,serif;font-size:20px;color:#14181D;margin-bottom:4px;">Armonia Capital</div>
      <div style="font-size:13px;color:#5A6B6B;margin-bottom:20px;">The Morning Balance — {date_str}</div>
      <div style="background:#14181D;color:#EAE6DC;padding:14px 18px;border-radius:3px;font-size:13.5px;margin-bottom:24px;">
        {snapshot}
      </div>
      <table width="100%" cellpadding="0" cellspacing="0">
        {items_html}
      </table>
      <div style="font-size:11.5px;color:#5A6B6B;margin-top:28px;">
        Not investment advice. <a href="{SITE_URL}/unsubscribe" style="color:#9C7A3C;">Unsubscribe</a>
      </div>
    </div>
    """


def send_email(to_email, subject, html_body):
    body = json.dumps({
        "from": FROM_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_body,
    }).encode()
    req = urllib.request.Request(
        RESEND_URL, data=body,
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status == 200
    except Exception as e:
        print(f"[error] send to {to_email} failed: {e}")
        return False


def main():
    if not RESEND_API_KEY:
        raise RuntimeError("RESEND_API_KEY not set")

    subscribers = load_json(SUBSCRIBERS_PATH, [])
    index = load_json(INDEX_PATH, {"articles": []})
    articles = index.get("articles", [])

    if not subscribers:
        print("[info] no subscribers yet — nothing to send")
        return
    if not articles:
        print("[info] no articles yet — skipping send")
        return

    date_str = datetime.date.today().strftime("%B %d, %Y")
    snapshot = get_market_snapshot()
    html_body = build_email_html(articles, snapshot, date_str)
    subject = f"The Morning Balance — {date_str}"

    sent, failed = 0, 0
    for email in subscribers:
        if send_email(email, subject, html_body):
            sent += 1
        else:
            failed += 1

    print(f"[done] sent={sent} failed={failed}")


if __name__ == "__main__":
    main()
