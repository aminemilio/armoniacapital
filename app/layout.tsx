import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TickerBar } from "@/components/TickerBar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});

const SITE_URL = process.env.SITE_URL ?? "https://armoniacapital.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Armonia Capital — Markets seek equilibrium",
    template: "%s | Armonia Capital",
  },
  description:
    "Financial market intelligence through an equilibrium lens: markets, macro, equities, digital assets and Sharia-compliant finance. Not investment advice.",
  openGraph: {
    type: "website",
    siteName: "Armonia Capital",
    title: "Armonia Capital — Markets seek equilibrium",
    description:
      "Market intelligence through an equilibrium lens, with Islamic finance coverage as a core vertical.",
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#0E1116",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${plexMono.variable}`}>
      <body className="bg-ink font-sans text-bone antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:bg-brass focus:px-3 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        <Header />
        <TickerBar />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
