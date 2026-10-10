"use client";

import { useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function submit() {
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    // Wire this to your provider (e.g. Resend) via an API route — see README.
    setDone(true);
  }

  return (
    <section id="newsletter" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-20 sm:px-6">
      <div className="border border-brass/40 bg-ink-2 p-8 sm:p-12">
        <h2 className="max-w-2xl font-serif text-3xl text-bone sm:text-4xl">
          The morning balance — one email before the open
        </h2>
        <p className="mt-3 max-w-xl text-bone/70">
          Where markets are stretched, where they are settled, and what could shift the balance today.
        </p>

        {done ? (
          <p role="status" className="mt-8 font-serif text-xl text-brass-light">
            You&apos;re on the list
          </p>
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
              <button
                type="button"
                onClick={submit}
                className="bg-brass px-6 py-3 font-medium text-ink transition-colors hover:bg-brass-light"
              >
                Subscribe
              </button>
            </div>
            {error && (
              <p id="nl-error" role="alert" className="mt-2 text-sm text-fall">
                {error}
              </p>
            )}
            <p className="mt-3 text-xs text-slate">One email a day. Unsubscribe anytime. Not investment advice.</p>
          </div>
        )}
      </div>
    </section>
  );
}
