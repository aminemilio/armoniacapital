"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "/category/markets", label: "Markets" },
  { href: "/category/macro", label: "Macro" },
  { href: "/category/equities", label: "Equities" },
  { href: "/category/digital-assets", label: "Digital Assets" },
  { href: "/category/islamic-finance", label: "Islamic Finance" },
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
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-t-[3px] border-brass bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Armonia Capital home" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-bone/80 transition-colors hover:text-brass-light"
            >
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
          className="p-2 text-bone lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-white/10 bg-ink px-4 pb-5 pt-3 lg:hidden"
        >
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-white/5 py-3 text-bone/90"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/#newsletter"
            onClick={() => setOpen(false)}
            className="mt-4 block rounded-sm bg-brass px-4 py-3 text-center font-medium text-ink"
          >
            Subscribe
          </Link>
        </nav>
      )}
    </header>
  );
}
