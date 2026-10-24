"use client";

import { useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot: real visitors never see or fill this
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (busy) return;
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), company }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && json.ok) setDone(true);
      else setError(json.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="newsletter" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-20 sm:px-6">
      <div className="border border-brass/40 bg-ink-2 p-8 sm:p-12">
        <h2 className="max-w-2xl font-serif text-3xl text-bone sm:text-4xl">The morning balance: one email before the open</h2>
        <p className="mt-3 max-w-xl text-bone/70">
          What moved, why it matters, and what to watch today across Europe, Africa, Asia and MENA, with Islamic finance in the mix.
        </p>

        {done ? (
          <div role="status" className="mt-8 max-w-xl">
            <p className="font-serif text-xl text-brass-light">Check your inbox</p>
            <p className="mt-2 text-bone/75">
              We sent a confirmation link to <strong className="text-bone">{email.trim()}</strong>. Click it to start receiving the briefing. If it
              does not arrive in a few minutes, look in your spam folder.
            </p>
          </div>
        ) : (
          <div className="mt-8 max-w-xl">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor="nl-email" className="sr-only">
                Email address
              </label>
              <input
                id="nl-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="you@example.com"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "nl-error" : undefined}
                className="min-w-0 flex-1 border border-white/15 bg-ink px-4 py-3 text-bone placeholder:text-slate focus:border-brass focus:outline-none"
              />
              <input
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                name="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
              />
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="bg-brass px-6 py-3 font-medium text-ink transition-colors hover:bg-brass-light disabled:opacity-60"
              >
                {busy ? "Sending…" : "Subscribe"}
              </button>
            </div>
            {error && (
              <p id="nl-error" role="alert" className="mt-2 text-sm text-fall">
                {error}
              </p>
            )}
            <p className="mt-3 text-xs text-slate">One email a day. Unsubscribe in one click. Not investment advice.</p>
          </div>
        )}
      </div>
    </section>
  );
}
