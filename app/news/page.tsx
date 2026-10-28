import type { Metadata } from "next";
import { NewsBrowser } from "@/components/NewsBrowser";

export const metadata: Metadata = {
  title: "Market News",
  description:
    "Live economy and market headlines from Europe, Africa, Asia, the Middle East and North Africa, central banks, crypto and Islamic finance, with links to the original publishers.",
  alternates: { canonical: "/news" },
};

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ topic?: string; country?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h1 className="font-serif text-4xl text-bone sm:text-5xl">Market news</h1>
      <p className="mt-3 max-w-2xl text-lg text-bone/70">
        Headlines from central banks, regional business media, crypto and Islamic finance sources, in one place. Open a region in the menu to
        see its countries.
      </p>
      <div className="mt-10">
        <NewsBrowser key={`${sp.country ?? ""}|${sp.topic ?? ""}`} initialCountry={sp.country} initialTopic={sp.topic} />
      </div>
    </div>
  );
}
