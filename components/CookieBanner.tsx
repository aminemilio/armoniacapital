"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getConsent, setConsent } from "@/lib/consent";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(getConsent() === null);
  }, []);

  if (!show) return null;
  const choose = (v: "all" | "essential") => {
    setConsent(v);
    setShow(false);
  };

  return (
    <div role="dialog" aria-label="Cookie and storage preferences" className="fixed inset-x-0 bottom-0 z-[70] border-t border-brass/50 bg-ink-2 p-4 shadow-2xl sm:p-5">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-bone/80">
          We use only essential storage to run the site. If we add analytics or advertising, we will use them only with your consent. See our{" "}
          <Link href="/privacy" className="text-brass-light underline">
            privacy policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-3">
          <button type="button" onClick={() => choose("essential")} className="border border-white/25 px-4 py-2 text-sm text-bone hover:border-brass">
            Essential only
          </button>
          <button type="button" onClick={() => choose("all")} className="bg-brass px-4 py-2 text-sm font-medium text-ink hover:bg-brass-light">
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
