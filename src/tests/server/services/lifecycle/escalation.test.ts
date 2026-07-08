import { describe, it, expect } from "vitest";
import { db } from "@/server/db";
import { demands, authorities, events } from "@/server/db/schema";
import { processEscalations } from "@/server/services/lifecycle/escalation";
import { eq } from "drizzle-orm";

describe("escalation", () => {
  it("escalates demand to parent authority when SLA is breached", async () => {
    // 1. Create a parent and child authority
    const [parent] = await db
      .insert(authorities)
      .values({
        name: "District Collector, Visakhapatnam",
        org: "Revenue",
        level: "district",
        categories: ["garbage"],
        sourceUrl: "https://vizag.ap.gov.in",
        verifiedOn: "2026-07-07",
        verified: true,
      })
      .returning();

    const [child] = await db
      .insert(authorities)
      .values({
        name: "GVMC Zonal Commissioner, Zone 6",
        org: "GVMC",
        level: "zone",
        categories: ["garbage"],
        escalationParentId: parent.id,
        sourceUrl: "https://gvmc.gov.in",
        verifiedOn: "2026-07-07",
        verified: true,
      })
      .returning();

    // 2. Create a demand with an updatedAt date in the past (e.g. 5 days ago; SLA for garbage is 2 days)
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const [demand] = await db
      .insert(demands)
      .values({
        title: "Piles of garbage near main road",
        category: "garbage",
        kind: "grievance",
        ward: "Ward 12",
        authorityId: child.id,
        state: "routed",
        updatedAt: fiveDaysAgo,
      })
      .returning();

    // 3. Process escalations
    const res = await processEscalations();

    expect(res.escalatedIds).toContain(demand.id);

    // 4. Verify authority has changed to parent
    const [updated] = await db
      .select()
      .from(demands)
      .where(eq(demands.id, demand.id))
      .limit(1);

    expect(updated.authorityId).toBe(parent.id);

    // 5. Verify event ledger has an Escalated entry
    const matchingEvents = await db
      .select()
      .from(events)
      .where(eq(events.demandId, demand.id));

    const escalatedEvent = matchingEvents.find((e) => e.eventType === "Escalated");
    expect(escalatedEvent).toBeDefined();
    expect(escalatedEvent?.payload).toMatchObject({
      reason: "SLA_breach",
      previousAuthorityId: child.id,
      newAuthorityId: parent.id,
    });
  });
});
