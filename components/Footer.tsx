import Link from "next/link";
import { Logo } from "./Header";

const COVERAGE = [
  { href: "/category/markets", label: "Markets" },
  { href: "/category/macro", label: "Macro" },
  { href: "/category/equities", label: "Equities" },
  { href: "/category/digital-assets", label: "Digital Assets" },
  { href: "/category/islamic-finance", label: "Islamic Finance" },
];

const SITE = [
  { href: "/about", label: "About" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-ink-2">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-bone/70">
            Armonia Capital reads financial markets through the lens of equilibrium: where positioning is
            stretched, where it is balanced, and how prices overshoot on the way back. Coverage includes
            Sharia-compliant finance as a core vertical.
          </p>
        </div>
        <div>
          <h3 className="font-serif text-lg text-bone">Coverage</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {COVERAGE.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-bone/70 hover:text-brass-light">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-serif text-lg text-bone">Site</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {SITE.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-bone/70 hover:text-brass-light">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate sm:flex-row sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Armonia Capital. All rights reserved.</p>
          <p>
            Not investment advice. Content is for information and education only.{" "}
            <Link href="/disclaimer" className="underline hover:text-brass-light">
              Read the full disclaimer
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
