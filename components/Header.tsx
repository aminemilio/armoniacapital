"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { NewsNavList } from "./NewsNavList";

const NAV_BEFORE_NEWS = [
  { href: "/category/markets", label: "Markets" },
  { href: "/category/macro", label: "Macro" },
  { href: "/category/equities", label: "Equities" },
  { href: "/category/digital-assets", label: "Digital Assets" },
  { href: "/category/islamic-finance", label: "Islamic Finance" },
];
const NAV_AFTER_NEWS = [
  { href: "/learn", label: "Learn" },
  { href: "/about", label: "About" },
];

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
        <circle cx="16" cy="16" r="14" fill="none" stroke="#AD8536" strokeWidth="2" />
        <path
          d="M9 19 L16 11 L23 19"
          fill="none"
          stroke="#E8E2D0"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="9" y="22" width="14" height="2.4" rx="1" fill="#D9AF63" />
      </svg>
      <span className="font-serif text-xl tracking-tight text-bone">Armonia Capital</span>
    </span>
  );
}

export function Header() {
  const [open, setOpen] = useState(false); // mobile menu
  const [newsOpen, setNewsOpen] = useState(false); // desktop News dropdown
  const [mobileNews, setMobileNews] = useState(false);
  const newsRef = useRef<HTMLDivElement>(null);

  // Close the News dropdown on outside click or Escape.
  useEffect(() => {
    if (!newsOpen) return;
    const onDown = (e: MouseEvent) => {
      if (newsRef.current && !newsRef.current.contains(e.target as Node)) setNewsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNewsOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [newsOpen]);

  const link = "text-sm text-bone/80 transition-colors hover:text-brass-light";
  const closeAll = () => {
    setOpen(false);
    setNewsOpen(false);
    setMobileNews(false);
  };

  return (
    <header className="sticky top-0 z-50 border-t-[3px] border-brass bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Armonia Capital home" onClick={closeAll}>
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 xl:flex">
          {NAV_BEFORE_NEWS.map((item) => (
            <Link key={item.href} href={item.href} className={link}>
              {item.label}
            </Link>
          ))}

          <div ref={newsRef} className="relative">
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={newsOpen}
              aria-controls="news-dropdown"
              onClick={() => setNewsOpen((v) => !v)}
              className={`${link} flex items-center gap-1`}
            >
              News
              <ChevronDown size={14} className={`transition-transform ${newsOpen ? "rotate-180" : ""}`} />
            </button>
            <div
              id="news-dropdown"
              hidden={!newsOpen}
              className="absolute left-1/2 top-full z-50 mt-4 w-72 -translate-x-1/2 border border-white/10 bg-ink-2 shadow-2xl"
            >
              <NewsNavList onNavigate={() => setNewsOpen(false)} idPrefix="nd" />
            </div>
          </div>

          {NAV_AFTER_NEWS.map((item) => (
            <Link key={item.href} href={item.href} className={link}>
              {item.label}
            </Link>
          ))}
          <Link
            href="/#newsletter"
            className="rounded-sm bg-brass px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-brass-light"
          >
            Subscribe
          </Link>
        </nav>

        <button
          type="button"
          className="p-2 text-bone xl:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="max-h-[80vh] overflow-y-auto border-t border-white/10 bg-ink px-4 pb-5 pt-3 xl:hidden">
          <ul className="flex flex-col">
            {NAV_BEFORE_NEWS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={closeAll} className="block border-b border-white/5 py-3 text-bone/90">
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="border-b border-white/5">
              <button
                type="button"
                aria-expanded={mobileNews}
                aria-controls="mobile-news-list"
                onClick={() => setMobileNews((v) => !v)}
                className="flex w-full items-center justify-between py-3 text-left text-bone/90"
              >
                News
                <ChevronDown size={16} className={`text-brass-light transition-transform ${mobileNews ? "rotate-180" : ""}`} />
              </button>
              <div id="mobile-news-list" hidden={!mobileNews} className="mb-2 border border-white/10 bg-ink-2">
                <NewsNavList onNavigate={closeAll} idPrefix="nm" />
              </div>
            </li>
            {NAV_AFTER_NEWS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={closeAll} className="block border-b border-white/5 py-3 text-bone/90">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/#newsletter" onClick={closeAll} className="mt-4 block rounded-sm bg-brass px-4 py-3 text-center font-medium text-ink">
            Subscribe
          </Link>
        </nav>
      )}
    </header>
  );
}
