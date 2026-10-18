import type { Metadata } from "next";
import { NewsFeed } from "@/components/NewsFeed";
import { RegionTabs } from "@/components/RegionTabs";

export const metadata: Metadata = {
  title: "Market News",
  description:
    "Live economy and market headlines from Europe, Africa, Asia, the Middle East and North Africa, central banks, crypto and Islamic finance, with links to the original publishers.",
  alternates: { canonical: "/news" },
};

export default function NewsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <h1 className="font-serif text-4xl text-bone sm:text-5xl">Market news</h1>
      <p className="mt-3 max-w-2xl text-lg text-bone/70">
        Headlines from central banks, regional business media, crypto and Islamic finance sources, in one place. Pick a region for local
        economy news.
      </p>
      <div className="mt-8">
        <RegionTabs />
      </div>
      <div className="mt-8">
        <NewsFeed />
      </div>
    </div>
  );
}
