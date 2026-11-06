"use client";

import { useEffect, useRef } from "react";
import { Search } from "lucide-react";

/** Full-width search bar that drops down under the header. Plain GET form, so it also works without JavaScript. */
export function SearchPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div id="site-search" hidden={!open} className="absolute inset-x-0 top-full border-b border-white/10 bg-ink/95 backdrop-blur-md">
      <form action="/search" method="get" role="search" onSubmit={onClose} className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
        <label htmlFor="site-search-input" className="sr-only">
          Search stocks, coins and topics
        </label>
        <Search size={18} className="shrink-0 text-slate" aria-hidden="true" />
        <input
          id="site-search-input"
          ref={input}
          name="q"
          type="search"
          autoComplete="off"
          maxLength={80}
          placeholder="Search a stock, coin or topic: NVIDIA, bitcoin, sukuk, oil, Algeria…"
          className="min-w-0 flex-1 bg-transparent text-bone placeholder:text-slate focus:outline-none"
        />
        <button type="submit" className="bg-brass px-4 py-2 text-sm font-medium text-ink hover:bg-brass-light">
          Search
        </button>
      </form>
    </div>
  );
}
