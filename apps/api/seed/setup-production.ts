/**
 * One-shot production/demo DB setup from your machine.
 * Uses DATABASE_URL from .env.local (repo root or apps/api).
 *
 * Usage:
 *   pnpm seed:production          # base seed + demo demands (keeps existing authorities if present)
 *   pnpm seed:production --reset  # wipe + full reload
 */
import "./load-env";

import { execSync } from "child_process";
import { join } from "path";
import postgres from "postgres";
import { db } from "../src/server/db";
import { authorities } from "../src/server/db/schema";
import { count } from "drizzle-orm";

const reset = process.argv.includes("--reset");
const apiRoot = join(__dirname, "..");

async function ensurePhotoUrlColumn() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const sql = postgres(connectionString, { prepare: false, ssl: "require" });
  try {
    await sql`ALTER TABLE demands ADD COLUMN IF NOT EXISTS photo_url text`;
    console.log("✓ demands.photo_url column ready");
  } finally {
    await sql.end();
  }
}

async function needsBaseSeed(): Promise<boolean> {
  const [row] = await db.select({ count: count() }).from(authorities);
  return (row?.count ?? 0) === 0;
}

function run(script: string, args: string[] = []) {
  execSync(`pnpm exec tsx ${script} ${args.join(" ")}`.trim(), {
    cwd: apiRoot,
    stdio: "inherit",
    env: process.env,
  });
}

async function main() {
  console.log("MPconnect production seed setup");
  console.log(`DATABASE_URL host: ${process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "(not set)"}`);

  await ensurePhotoUrlColumn();

  if (reset) {
    console.log("\n→ Resetting base tables…");
    run("seed/load.ts", ["--reset"]);
  } else if (await needsBaseSeed()) {
    console.log("\n→ Loading authorities, wards, datasets…");
    run("seed/load.ts");
  } else {
    console.log("\n→ Base seed already present (skip). Use --reset to wipe and reload.");
  }

  console.log("\n→ Loading 12 demo user complaints (with feed thumbnails)…");
  run("seed/demo-user-complaints.ts");

  console.log("\n✓ Production seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
