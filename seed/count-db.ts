import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { db } from "../src/db";
import { count } from "drizzle-orm";
import { submissions, demands, events } from "../src/db/schema";

async function main() {
  const [subsCount] = await db.select({ count: count() }).from(submissions);
  const [demandsCount] = await db.select({ count: count() }).from(demands);
  const [eventsCount] = await db.select({ count: count() }).from(events);
  
  console.log("Database Stats:");
  console.log(`- Submissions: ${subsCount?.count}`);
  console.log(`- Demands: ${demandsCount?.count}`);
  console.log(`- Events: ${eventsCount?.count}`);
  
  if (demandsCount?.count > 0) {
    const allDemands = await db.select().from(demands);
    console.log("\nDemands List:");
    for (const d of allDemands) {
      console.log(`- ID: ${d.id}, Title: "${d.title}", Ward: ${d.ward}, Category: ${d.category}, AffectedCount: ${d.affectedCount}, State: ${d.state}`);
    }
  }
  
  process.exit(0);
}

main().catch(console.error);
