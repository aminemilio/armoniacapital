/**
 * Audits the images of existing articles and replaces the ones that do not fit their category
 * (for example a bitcoin photo on an Islamic finance article). Replacements go to data/image-overrides.json.
 *
 *   npm run fix-images
 *
 * Needs PEXELS_API_KEY (from .env.local locally, or the GitHub secret). Each article is checked once.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ARTICLES } from "../lib/articles";
import { findImage, imageBlocked, imageFits, pexelsPhotoInfo } from "./images";

const FILE = path.join(process.cwd(), "data", "image-overrides.json");
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function loadEnvFile(): Promise<void> {
  try {
    const raw = await readFile(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!m || line.trim().startsWith("#")) continue;
      const value = m[2].replace(/^["']|["']$/g, "");
      if (value && process.env[m[1]] === undefined) process.env[m[1]] = value;
    }
  } catch {
    /* no .env.local */
  }
}

interface Overrides {
  overrides: Record<string, { image: string; credit?: string }>;
  checked: string[];
}

async function main(): Promise<void> {
  await loadEnvFile();
  if (!process.env.PEXELS_API_KEY?.trim()) {
    console.log("PEXELS_API_KEY is not set: nothing to audit.");
    return;
  }
  let state: Overrides = { overrides: {}, checked: [] };
  try {
    state = JSON.parse(await readFile(FILE, "utf8")) as Overrides;
  } catch {
    /* first run */
  }
  state.overrides ??= {};
  state.checked ??= [];

  const used = new Set(ARTICLES.map((a) => a.image));
  let replaced = 0;
  let audited = 0;

  for (const a of ARTICLES) {
    if (state.checked.includes(a.slug) || state.overrides[a.slug]) continue;
    const id = a.image.match(/pexels\.com\/photos\/(\d+)\//)?.[1];
    audited++;
    if (!id) {
      state.checked.push(a.slug);
      continue;
    }
    const info = await pexelsPhotoInfo(id);
    await sleep(350);
    if (!info) continue; // network problem: try again next run
    const bad = imageBlocked(a.category, info.alt) || !imageFits(a.category, info.alt);
    if (bad) {
      const img = await findImage(a.category, "", a.slug, used);
      if (img) {
        state.overrides[a.slug] = { image: img.url, credit: img.credit };
        used.add(img.url);
        replaced++;
        console.log(`✓ ${a.slug}: replaced image (was: "${info.alt || "no description"}")`);
      } else {
        console.warn(`✗ ${a.slug}: no better image found`);
        continue;
      }
    }
    state.checked.push(a.slug);
  }

  await writeFile(FILE, JSON.stringify(state, null, 2) + "\n", "utf8");
  console.log(`Audited ${audited} article(s), replaced ${replaced} image(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
