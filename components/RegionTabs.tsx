import Link from "next/link";
import { REGIONS } from "@/lib/regions";
import { cn } from "@/lib/utils";

export function RegionTabs({ active }: { active?: string }) {
  const items = [{ slug: "", name: "All news", href: "/news" }, ...REGIONS.map((r) => ({ slug: r.slug, name: r.name, href: `/news/${r.slug}` }))];
  return (
    <nav aria-label="News regions" className="flex flex-wrap gap-2">
      {items.map((i) => {
        const isActive = (active ?? "") === i.slug;
        return (
          <Link
            key={i.slug || "all"}
            href={i.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "border px-4 py-2 text-sm transition-colors",
              isActive ? "border-brass bg-brass text-ink" : "border-white/15 text-bone/85 hover:border-brass hover:text-brass-light",
            )}
          >
            {i.name}
          </Link>
        );
      })}
    </nav>
  );
}
