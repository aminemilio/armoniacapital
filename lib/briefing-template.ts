import { formatPct, formatPrice } from "./utils";

export interface BriefingData {
  date: string; // YYYY-MM-DD
  subject: string;
  preview: string;
  balance: string;
  stories: { headline: string; analysis: string; url?: string }[];
  regions: { region: string; text: string; url?: string }[];
  watch: string[];
  snapshot: { symbol: string; name: string; price: number; changePct: number; currency?: string }[];
  article?: { title: string; excerpt: string; slug: string };
  featured?: { name: string; symbol: string; type: string; utility: string; whyNow: string; risks: string[] };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const INK = "#0E1116";
const BRASS = "#AD8536";
const TEXT = "#1B1F26";
const MUTED = "#5E6672";
const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "Arial,Helvetica,sans-serif";

function longDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** Renders the email as inline-styled, table-free HTML plus a plain-text twin. Contains Resend's unsubscribe placeholder. */
export function renderBriefing(d: BriefingData, site: string): { html: string; text: string } {
  const h2 = (t: string) =>
    `<h2 style="font-family:${SERIF};font-size:20px;color:${INK};margin:32px 0 10px;padding-bottom:6px;border-bottom:2px solid ${BRASS}">${esc(t)}</h2>`;
  const link = (label: string, url?: string) =>
    url ? ` <a href="${esc(url)}" style="color:${BRASS};text-decoration:none;font-weight:bold">${esc(label)}</a>` : "";

  const snapshot = d.snapshot.length
    ? `${h2("Market snapshot")}<div style="font-family:${SANS};font-size:14px;line-height:1.9;color:${TEXT}">${d.snapshot
        .map((s) => {
          const up = s.changePct >= 0;
          return `<span style="display:inline-block;min-width:48%;"><strong>${esc(s.symbol)}</strong> ${formatPrice(s.price)}${s.currency ? " " + esc(s.currency) : ""} <span style="color:${up ? "#2F6B52" : "#9A4A3A"}">${up ? "▲" : "▼"} ${esc(formatPct(Math.abs(s.changePct)).replace("+", ""))}</span></span>`;
        })
        .join("")}</div><p style="font-family:${SANS};font-size:11px;color:${MUTED};margin:6px 0 0">Prices at the time of writing; may be delayed.</p>`
    : "";

  const stories = d.stories
    .map(
      (s) =>
        `<p style="font-family:${SANS};font-size:15px;line-height:1.6;color:${TEXT};margin:0 0 14px"><strong style="font-family:${SERIF};font-size:17px;color:${INK}">${esc(s.headline)}</strong><br>${esc(s.analysis)}${link("Source →", s.url)}</p>`,
    )
    .join("");

  const regions = d.regions
    .map(
      (r) =>
        `<p style="font-family:${SANS};font-size:15px;line-height:1.6;color:${TEXT};margin:0 0 12px"><strong style="color:${BRASS}">${esc(r.region)}.</strong> ${esc(r.text)}${link("Source →", r.url)}</p>`,
    )
    .join("");

  const watch = d.watch
    .map((w) => `<li style="font-family:${SANS};font-size:15px;line-height:1.6;color:${TEXT};margin:0 0 6px">${esc(w)}</li>`)
    .join("");

  const article = d.article
    ? `${h2("Today's analysis")}<div style="background:#FFFFFF;border:1px solid #E4DFD0;padding:18px 20px"><p style="font-family:${SERIF};font-size:19px;color:${INK};margin:0 0 8px">${esc(d.article.title)}</p><p style="font-family:${SANS};font-size:14px;line-height:1.6;color:${TEXT};margin:0 0 12px">${esc(d.article.excerpt)}</p><a href="${site}/articles/${esc(d.article.slug)}" style="font-family:${SANS};font-size:14px;color:${BRASS};font-weight:bold;text-decoration:none">Read the full analysis →</a></div>`
    : "";

  const featured = d.featured
    ? `${h2("Featured asset of the day")}<p style="font-family:${SANS};font-size:15px;line-height:1.6;color:${TEXT};margin:0 0 8px"><strong style="font-family:${SERIF};font-size:17px;color:${INK}">${esc(d.featured.name)}</strong> <span style="color:${MUTED}">(${esc(d.featured.symbol)}, ${esc(d.featured.type)})</span><br>${esc(d.featured.utility)}</p><p style="font-family:${SANS};font-size:15px;line-height:1.6;color:${TEXT};margin:0 0 8px"><strong>In focus today.</strong> ${esc(d.featured.whyNow)}</p>${
        d.featured.risks.length
          ? `<p style="font-family:${SANS};font-size:13px;line-height:1.6;color:${MUTED};margin:0"><strong>Risks:</strong> ${d.featured.risks.map(esc).join(" ")}</p>`
          : ""
      }<p style="font-family:${SANS};font-size:12px;color:${MUTED};margin:8px 0 0">Editorial spotlight for its real-world utility. Not a recommendation to buy or sell.</p>`
    : "";

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(d.subject)}</title></head>
<body style="margin:0;padding:0;background:#F1EDE2">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#F1EDE2">${esc(d.preview)}</div>
<div style="max-width:640px;margin:0 auto;background:#FBF9F3">
  <div style="background:${INK};border-top:4px solid ${BRASS};padding:22px 28px">
    <div style="font-family:${SERIF};font-size:24px;color:#E8E2D0">Armonia Capital</div>
    <div style="font-family:${SANS};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#D9AF63;margin-top:4px">The Morning Balance · ${esc(longDate(d.date))}</div>
  </div>
  <div style="padding:8px 28px 28px">
    ${h2("Today's balance")}
    <p style="font-family:${SANS};font-size:16px;line-height:1.7;color:${TEXT};margin:0">${esc(d.balance)}</p>
    ${snapshot}
    ${h2("Top stories")}
    ${stories}
    ${article}
    ${h2("Regional watch")}
    ${regions}
    ${h2("What to watch today")}
    <ul style="margin:0;padding-left:20px">${watch}</ul>
    ${featured}
  </div>
  <div style="background:#EFEADB;padding:20px 28px;font-family:${SANS};font-size:12px;line-height:1.6;color:${MUTED}">
    <p style="margin:0 0 8px"><strong>Not investment advice.</strong> This briefing is for information and education only and does not consider your objectives or circumstances. Markets involve risk, including loss of capital. Headlines come from third-party publishers linked above.</p>
    <p style="margin:0 0 8px">You receive this because you subscribed at ${esc(site.replace(/^https?:\/\//, ""))}. <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:${BRASS}">Unsubscribe</a> · <a href="${site}/disclaimer" style="color:${BRASS}">Disclaimer</a> · <a href="${site}/privacy" style="color:${BRASS}">Privacy</a></p>
  </div>
</div></body></html>`;

  const text = [
    `ARMONIA CAPITAL · THE MORNING BALANCE · ${longDate(d.date)}`,
    "",
    "TODAY'S BALANCE",
    d.balance,
    "",
    ...(d.snapshot.length ? ["MARKET SNAPSHOT", ...d.snapshot.map((s) => `${s.symbol} ${formatPrice(s.price)}${s.currency ? " " + s.currency : ""} (${formatPct(s.changePct)})`), ""] : []),
    "TOP STORIES",
    ...d.stories.map((s) => `- ${s.headline}\n  ${s.analysis}${s.url ? "\n  " + s.url : ""}`),
    "",
    ...(d.article ? ["TODAY'S ANALYSIS", d.article.title, `${site}/articles/${d.article.slug}`, ""] : []),
    "REGIONAL WATCH",
    ...d.regions.map((r) => `- ${r.region}: ${r.text}${r.url ? "\n  " + r.url : ""}`),
    "",
    "WHAT TO WATCH TODAY",
    ...d.watch.map((w) => `- ${w}`),
    "",
    ...(d.featured ? ["FEATURED ASSET OF THE DAY", `${d.featured.name} (${d.featured.symbol}): ${d.featured.utility}`, `In focus today: ${d.featured.whyNow}`, "Editorial spotlight, not a recommendation.", ""] : []),
    "Not investment advice. Unsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}",
  ].join("\n");

  return { html, text };
}
