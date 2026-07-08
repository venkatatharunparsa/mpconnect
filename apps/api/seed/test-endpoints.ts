import "./load-env";

import { GET as getEvidence } from "../src/app/api/demands/[id]/evidence/route";
import { GET as getMplads } from "../src/app/api/demands/[id]/mplads-pack/route";
import { db } from "../src/server/db";
import { demands } from "../src/server/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const schoolDemands = await db
    .select()
    .from(demands)
    .where(eq(demands.category, "school_upgrade"));

  const masterDemand = schoolDemands.find((d) => d.affectedCount === 40);
  if (!masterDemand) {
    console.error("Master school upgrade demand not found in database.");
    process.exit(1);
  }

  const demandId = masterDemand.id;
  console.log(`Testing API endpoints for Demand ID: ${demandId}\n`);

  // 1. Test /api/demands/[id]/evidence
  console.log("Fetching GET /api/demands/[id]/evidence...");
  const evReq = new Request(`http://localhost:3000/api/demands/${demandId}/evidence`);
  const evRes = await getEvidence(evReq, { params: { id: demandId } });
  const evData = await evRes.json();
  console.log("Status Code:", evRes.status);
  console.log("Response Body preview:\n", JSON.stringify(evData, null, 2).slice(0, 1000) + "...\n");

  // 2. Test /api/demands/[id]/mplads-pack
  console.log("Fetching GET /api/demands/[id]/mplads-pack...");
  const mpReq = new Request(`http://localhost:3000/api/demands/${demandId}/mplads-pack`);
  const mpRes = await getMplads(mpReq, { params: { id: demandId } });
  const mpData = await mpRes.json();
  console.log("Status Code:", mpRes.status);
  console.log("Response Body:\n", JSON.stringify(mpData, null, 2));

  process.exit(0);
}

main().catch(console.error);
