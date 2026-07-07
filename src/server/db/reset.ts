import { db } from "./index";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Dropping all tables...");
  await db.execute(sql`DROP TABLE IF EXISTS events, submissions, demands, datasets, authorities, wards, verifications CASCADE`);
  console.log("Tables dropped successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to drop tables:", err);
  process.exit(1);
});
