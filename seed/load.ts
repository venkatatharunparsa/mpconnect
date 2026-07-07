/**
 * Seed loader: `pnpm seed` (or `pnpm demo:reset` to wipe first).
 * Loads: authorities (from authorities.json — citation-or-silence enforced),
 * pilot wards, datasets (UDISE/Census — real or explicitly estimated),
 * synthetic citizen corpus (built in prompt H-seed; marked SYNTHETIC).
 */
import { readFileSync } from "fs";
import { join } from "path";
import { db } from "../src/server/db";
import { authorities, wards, datasets, demands, submissions, events } from "../src/server/db/schema";

const reset = process.argv.includes("--reset");

async function main() {
  if (reset) {
    console.log("Resetting tables…");
    await db.delete(events);
    await db.delete(submissions);
    await db.delete(demands);
    await db.delete(datasets);
    await db.delete(authorities);
    await db.delete(wards);
  }

  // 1. Authorities — refuse any entry missing citation fields (sacred contract #2)
  const auth = JSON.parse(readFileSync(join(__dirname, "authorities.json"), "utf-8"));
  for (const a of auth.authorities) {
    if (!a.sourceUrl || !a.verifiedOn) {
      throw new Error(`REFUSED: authority "${a.name}" lacks sourceUrl/verifiedOn`);
    }
    await db.insert(authorities).values(a);
  }
  console.log(`Seeded ${auth.authorities.length} authorities (citation-checked).`);

  // 2. Pilot wards (placeholder polygons until real shapefiles land — marked SYNTHETIC)
  // TODO(H-seed): replace with real GVMC ward GeoJSON if obtained in time.
  const pilotWards = JSON.parse(readFileSync(join(__dirname, "wards.json"), "utf-8"));
  for (const w of pilotWards.wards) await db.insert(wards).values(w);
  console.log(`Seeded ${pilotWards.wards.length} pilot wards.`);

  // 3. Datasets (UDISE/Census) — every row carries source; estimated rows say so.
  const ds = JSON.parse(readFileSync(join(__dirname, "datasets.json"), "utf-8"));
  for (const d of ds.rows) {
    if (!d.sourceUrl) throw new Error(`REFUSED: dataset row without sourceUrl (${d.metric})`);
    await db.insert(datasets).values(d);
  }
  console.log(`Seeded ${ds.rows.length} dataset rows.`);

  console.log("Seed complete. Synthetic citizen corpus loads via prompt H-seed script.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
