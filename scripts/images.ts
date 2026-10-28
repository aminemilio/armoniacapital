/**
 * Relevant stock photos for articles (Pexels first, Pixabay second).
 * Each category has its own search topics and a block list, so an Islamic finance piece never gets a bitcoin photo.
 */
export interface Image {
  url: string;
  credit: string;
}

const env = (name: string): string | undefined => {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
};

/** Safe, on-topic search queries per category. The model's own suggestion is only used for non-sensitive categories. */
export const IMAGE_POOLS: Record<string, string[]> = {
  "islamic-finance": [
    "mosque architecture",
    "islamic geometric pattern",
    "dubai skyline",
    "kuala lumpur skyline",
    "arabic calligraphy",
    "riyadh skyline",
    "istanbul skyline",
    "moroccan architecture",
    "doha skyline",
    "abu dhabi skyline",
  ],
  macro: ["central bank building", "financial district skyline", "government building columns", "city skyline business", "economy city"],
  equities: ["stock market screen", "trading floor", "stock exchange building", "financial charts laptop", "business analytics dashboard"],
  markets: ["container port trade", "gold bars", "oil refinery", "world map business", "commodity trading"],
  "digital-assets": ["bitcoin coin", "blockchain network", "cryptocurrency chart", "digital technology abstract"],
  learn: ["books library", "notebook and calculator", "student studying desk", "chalkboard diagram", "reading book desk"],
  investing: ["financial planning desk", "investment portfolio chart", "savings and growth plant coins"],
  business: ["modern office building", "business meeting table", "city skyline business"],
  politics: ["parliament building", "government building columns", "city hall"],
  stock: ["stock market screen", "trading floor", "stock exchange building"],
};

const PREFER: Record<string, string[]> = {
  "islamic-finance": ["mosque", "islamic", "arab", "arabic", "dubai", "kuala", "istanbul", "calligraphy", "geometric", "riyadh", "moroccan", "doha", "abu dhabi", "cairo", "skyline", "architecture", "minaret", "dome"],
};

const CRYPTO = ["bitcoins?", "btc", "crypto\\w*", "ethereum", "blockchain", "dogecoin", "nfts?", "coins?", "tokens?", "altcoins?"];
const RELIGIOUS_OTHER = ["church", "cross", "christian", "jesus", "buddha", "buddhist", "hindu", "temple", "synagogue", "praying", "prayer", "worship", "kneeling"];
const VICE = ["casino", "gambling", "poker", "alcohol", "wine", "beer", "cocktail", "bikini", "nude", "lingerie", "cigarette", "smoking"];

function blockWords(category: string): string[] {
  const words = [...VICE];
  if (category !== "digital-assets") words.push(...CRYPTO);
  if (category === "islamic-finance") words.push(...RELIGIOUS_OTHER);
  return words;
}

/** True if the photo description/tags make it unsuitable for the category. */
export function imageBlocked(category: string, text: string): boolean {
  const re = new RegExp(`\\b(${blockWords(category).join("|")})\\b`, "i");
  return re.test(text);
}

function preferScore(category: string, text: string): number {
  const t = text.toLowerCase();
  return (PREFER[category] ?? []).filter((w) => t.includes(w)).length;
}

/** For categories with a strict look (Islamic finance), an image must match at least one preferred topic to be trusted. */
export function imageFits(category: string, text: string): boolean {
  if (imageBlocked(category, text)) return false;
  if (category === "islamic-finance") return preferScore(category, text) > 0;
  return true;
}

function hashPick(seed: string, n: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % n;
}

async function getJson<T>(url: string, init: RequestInit, label: string): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${label} failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

async function pexels(query: string, used: Set<string>, category: string): Promise<Image | null> {
  const key = env("PEXELS_API_KEY");
  if (!key) return null;
  type Resp = { photos?: { photographer: string; alt?: string; src: { large2x?: string; large: string } }[] };
  const json = await getJson<Resp>(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`,
    { headers: { Authorization: key } },
    "Pexels",
  );
  const candidates = (json.photos ?? [])
    .filter((p) => !used.has(p.src.large2x ?? p.src.large))
    .filter((p) => !imageBlocked(category, p.alt ?? ""))
    .map((p) => ({ p, score: preferScore(category, p.alt ?? "") }))
    .sort((a, b) => b.score - a.score);
  const best = candidates[0]?.p;
  return best ? { url: best.src.large2x ?? best.src.large, credit: `Photo by ${best.photographer} on Pexels` } : null;
}

async function pixabay(query: string, used: Set<string>, category: string): Promise<Image | null> {
  const key = env("PIXABAY_API_KEY");
  if (!key) return null;
  type Resp = { hits?: { largeImageURL: string; user: string; tags?: string }[] };
  const json = await getJson<Resp>(
    `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=20`,
    {},
    "Pixabay",
  );
  const candidates = (json.hits ?? [])
    .filter((h) => !used.has(h.largeImageURL))
    .filter((h) => !imageBlocked(category, h.tags ?? ""))
    .map((h) => ({ h, score: preferScore(category, h.tags ?? "") }))
    .sort((a, b) => b.score - a.score);
  const best = candidates[0]?.h;
  return best ? { url: best.largeImageURL, credit: `Image by ${best.user} on Pixabay` } : null;
}

/**
 * Picks an image for an article. For Islamic finance the model's own query is ignored and a curated, respectful topic is used.
 * `seed` (the title or slug) rotates which curated topic is tried first, so articles do not all get the same picture.
 */
export async function findImage(category: string, modelQuery: string, seed: string, used: Set<string>): Promise<Image | null> {
  const pool = IMAGE_POOLS[category] ?? IMAGE_POOLS.markets;
  const start = hashPick(seed, pool.length);
  const rotated = [...pool.slice(start), ...pool.slice(0, start)];
  const own = category === "islamic-finance" || !modelQuery.trim() ? [] : [modelQuery.trim()];
  const queries = [...own, ...rotated].slice(0, 7);

  for (const q of queries) {
    for (const fn of [pexels, pixabay]) {
      try {
        const img = await fn(q, used, category);
        if (img) return img;
      } catch (err) {
        console.warn(`Image lookup failed (${q}): ${(err as Error).message}`);
      }
    }
  }
  return null;
}

/** Description of a Pexels photo by id (used to audit existing articles). */
export async function pexelsPhotoInfo(id: string): Promise<{ alt: string; photographer: string } | null> {
  const key = env("PEXELS_API_KEY");
  if (!key) return null;
  try {
    const j = await getJson<{ alt?: string; photographer?: string }>(`https://api.pexels.com/v1/photos/${id}`, { headers: { Authorization: key } }, "Pexels photo");
    return { alt: j.alt ?? "", photographer: j.photographer ?? "" };
  } catch {
    return null;
  }
}
