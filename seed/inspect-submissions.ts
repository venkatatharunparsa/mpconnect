import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { db } from "../src/db";
import { count, eq, like } from "drizzle-orm";
import { submissions, events } from "../src/db/schema";

async function main() {
  const schoolSubs = await db
    .select()
    .from(submissions)
    .where(like(submissions.citizenKey, "SYN-GAJ-SCH-%"));
  
  console.log(`GAJ-SCH submissions count: ${schoolSubs.length}`);
  
  const statusCounts: Record<string, number> = {};
  for (const s of schoolSubs) {
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
  }
  console.log("Status breakdown:", statusCounts);

  const reviewEvents = await db
    .select()
    .from(events)
    .where(eq(events.eventType, "MergeReviewQueued"));
  console.log(`MergeReviewQueued events count: ${reviewEvents.length}`);

  for (const e of reviewEvents.slice(0, 5)) {
    console.log(`- Event ID: ${e.id}, SubmissionId: ${e.submissionId}, Payload:`, JSON.stringify(e.payload));
  }

  process.exit(0);
}

main().catch(console.error);
