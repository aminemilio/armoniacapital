import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsBrowser } from "@/components/NewsBrowser";
import { REGIONS, getRegion } from "@/lib/regions";

type Params = { region: string };

export function generateStaticParams() {
  return REGIONS.map((r) => ({ region: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { region } = await params;
  const cfg = getRegion(region);
  if (!cfg) return { title: "News not found" };
  return {
    title: cfg.title,
    description: cfg.description,
    alternates: { canonical: `/news/${cfg.slug}` },
  };
}

export default async function RegionNewsPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<{ country?: string; topic?: string }> }) {
  const { region } = await params;
  const sp = await searchParams;
  const cfg = getRegion(region);
  if (!cfg) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h1 className="font-serif text-4xl text-bone sm:text-5xl">{cfg.title}</h1>
      <p className="mt-3 max-w-2xl text-lg text-bone/70">{cfg.description}</p>
      <div className="mt-10">
        <NewsBrowser key={`${cfg.slug}|${sp.country ?? ""}|${sp.topic ?? ""}`} regionSlug={cfg.slug} initialCountry={sp.country} initialTopic={sp.topic} />
      </div>
    </div>
  );
}
