export interface RegionConfig {
  slug: string;
  name: string; // must match the values used in data/feeds.json "regions"
  title: string;
  description: string;
  countries: string[];
}

export const REGIONS: RegionConfig[] = [
  {
    slug: "europe",
    name: "Europe",
    title: "Europe economy news",
    description: "Euro area and UK economy, ECB and Bank of England decisions, and European business headlines.",
    countries: ["Eurozone", "United Kingdom"],
  },
  {
    slug: "africa",
    name: "Africa",
    title: "Africa economy news: the five largest economies",
    description:
      "Headlines from Africa's five largest economies by 2026 IMF nominal GDP projections (South Africa, Egypt, Nigeria, Algeria and Morocco), plus pan-African coverage.",
    countries: ["South Africa", "Egypt", "Nigeria", "Algeria", "Morocco"],
  },
  {
    slug: "asia",
    name: "Asia",
    title: "Asia economy news",
    description: "Central banks and economy headlines from China, Japan, India and the wider Asia-Pacific region.",
    countries: ["China", "Japan", "India"],
  },
  {
    slug: "mena",
    name: "MENA",
    title: "MENA economy news",
    description: "Middle East and North Africa: Gulf economies, Egypt, the Maghreb, and Islamic finance headlines.",
    countries: ["UAE", "Saudi Arabia", "Egypt", "Algeria", "Morocco"],
  },
];

export const getRegion = (slug: string): RegionConfig | undefined => REGIONS.find((r) => r.slug === slug);
