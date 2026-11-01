export type DeskKey = "us" | "eu" | "china";

export const DESK_META: Record<DeskKey, { name: string; short: string; description: string }> = {
  us: {
    name: "United States",
    short: "US",
    description: "The Federal Reserve, Treasury, jobs and inflation data, Wall Street and the dollar: the economy that sets the price of money for the world.",
  },
  eu: {
    name: "European Union",
    short: "EU",
    description: "The ECB, euro-area growth and inflation, energy, fiscal rules and European markets, and how they reach emerging markets.",
  },
  china: {
    name: "China",
    short: "China",
    description: "PBoC policy, property, exports, the yuan and Chinese markets, and what they mean for commodities and trade partners worldwide.",
  },
};

export const DESK_KEYS = Object.keys(DESK_META) as DeskKey[];
export const isDeskKey = (v: string): v is DeskKey => v in DESK_META;
