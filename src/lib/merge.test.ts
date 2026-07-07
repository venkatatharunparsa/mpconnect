// Override DATABASE_URL for local testing before importing DB modules
process.env.DATABASE_URL = "postgresql://postgres@localhost:5432/mpconnect";

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/db";
import { submissions, demands, events } from "@/db/schema";
import { eq, inArray, like } from "drizzle-orm";
import { processSubmission, split, applyMergeReviewDecision } from "@/lib/merge";
import { embedText } from "@/lib/gemini";
import { recomputeRank } from "@/lib/rank";

describe("Merge Engine", () => {
  const TEST_CITIZEN_1 = "TEST-CIT-001";
  const TEST_CITIZEN_2 = "TEST-CIT-002";
  const TEST_CITIZEN_3 = "TEST-CIT-003";

  // Clean up any test records
  async function cleanup() {
    await db.delete(events).where(like(events.actorId, "TEST-%"));
    await db.delete(events).where(like(events.actorId, "test-%"));
    await db.delete(submissions).where(like(submissions.citizenKey, "TEST-%"));
    
    // Clean up demands created during testing
    // Since demands don't have citizenKey, we can delete demands that have no submissions left, or delete based on title
    await db.delete(demands).where(like(demands.title, "TEST %"));
  }

  beforeAll(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  it("creates a new demand when no similar candidate exists", async () => {
    // 1. Insert a clean test submission
    const [sub] = await db
      .insert(submissions)
      .values({
        refId: "VZG-TEST-00001",
        channel: "web",
        citizenKey: TEST_CITIZEN_1,
        rawText: "TEST water leakage on beach road Bheemili",
        summaryEn: "TEST water leakage Bheemili",
        category: "water_leakage",
        kind: "grievance",
        lat: 17.8890,
        lng: 83.4470,
        ward: "test-ward",
        urgency: "medium",
        status: "received",
      })
      .returning();

    // 2. Process through merge engine
    await processSubmission(sub.id);

    // 3. Verify a new demand was created and submission was merged into it
    const [updatedSub] = await db.select().from(submissions).where(eq(submissions.id, sub.id)).limit(1);
    expect(updatedSub.demandId).not.toBeNull();
    expect(updatedSub.status).toBe("merged");

    const [demand] = await db.select().from(demands).where(eq(demands.id, updatedSub.demandId!)).limit(1);
    expect(demand).toBeDefined();
    expect(demand.title).toBe("TEST water leakage Bheemili");
    expect(demand.affectedCount).toBe(1);
    expect(demand.rankScore).toBeGreaterThan(0);
  });

  it("auto-merges a second highly similar submission into the same demand", async () => {
    // Get the demand from the previous test
    const [existingSub] = await db.select().from(submissions).where(eq(submissions.citizenKey, TEST_CITIZEN_1)).limit(1);
    const demandId = existingSub.demandId!;

    // 1. Insert a highly similar submission from a different citizen
    const [sub2] = await db
      .insert(submissions)
      .values({
        refId: "VZG-TEST-00002",
        channel: "web",
        citizenKey: TEST_CITIZEN_2,
        rawText: "TEST water leakage on beach road Bheemili", // identical text to ensure max similarity
        summaryEn: "TEST water leakage Bheemili",
        category: "water_leakage",
        kind: "grievance",
        lat: 17.8891, // slightly close
        lng: 83.4471,
        ward: "test-ward",
        urgency: "medium",
        status: "received",
      })
      .returning();

    // 2. Process
    await processSubmission(sub2.id);

    // 3. Verify it auto-merged into the same demandId
    const [updatedSub2] = await db.select().from(submissions).where(eq(submissions.id, sub2.id)).limit(1);
    expect(updatedSub2.demandId).toBe(demandId);
    expect(updatedSub2.status).toBe("merged");

    // 4. Verify affectedCount is now 2
    const [demand] = await db.select().from(demands).where(eq(demands.id, demandId)).limit(1);
    expect(demand.affectedCount).toBe(2);
  });

  it("does not inflate affectedCount if the same citizen submits twice", async () => {
    const [existingSub] = await db.select().from(submissions).where(eq(submissions.citizenKey, TEST_CITIZEN_1)).limit(1);
    const demandId = existingSub.demandId!;

    // 1. Submit again by TEST_CITIZEN_1
    const [sub3] = await db
      .insert(submissions)
      .values({
        refId: "VZG-TEST-00003",
        channel: "web",
        citizenKey: TEST_CITIZEN_1, // SAME citizen key
        rawText: "TEST water leakage on beach road Bheemili",
        summaryEn: "TEST water leakage Bheemili",
        category: "water_leakage",
        kind: "grievance",
        lat: 17.8892,
        lng: 83.4472,
        ward: "test-ward",
        urgency: "medium",
        status: "received",
      })
      .returning();

    // 2. Process
    await processSubmission(sub3.id);

    // 3. Verify it merged to same demand, but affectedCount remains 2
    const [updatedSub3] = await db.select().from(submissions).where(eq(submissions.id, sub3.id)).limit(1);
    expect(updatedSub3.demandId).toBe(demandId);

    const [demand] = await db.select().from(demands).where(eq(demands.id, demandId)).limit(1);
    expect(demand.affectedCount).toBe(2); // still 2, not 3
  });

  it("splits submissions out of a demand correctly", async () => {
    // Fetch submissions belonging to the demand
    const [sub1] = await db.select().from(submissions).where(eq(submissions.citizenKey, TEST_CITIZEN_1)).limit(1);
    const originalDemandId = sub1.demandId!;

    // Find submission for TEST_CITIZEN_2
    const [sub2] = await db.select().from(submissions).where(eq(submissions.citizenKey, TEST_CITIZEN_2)).limit(1);

    // 1. Perform split on sub2 (which belongs to TEST_CITIZEN_2)
    const { newDemandId } = await split(originalDemandId, [sub2.id], "test-operator");

    // 2. Check that sub2 now points to newDemandId
    const [updatedSub2] = await db.select().from(submissions).where(eq(submissions.id, sub2.id)).limit(1);
    expect(updatedSub2.demandId).toBe(newDemandId);

    // 3. Check original demand affectedCount is now 1 (only TEST_CITIZEN_1 left)
    const [origDemand] = await db.select().from(demands).where(eq(demands.id, originalDemandId)).limit(1);
    expect(origDemand.affectedCount).toBe(1);

    // 4. Check new demand affectedCount is 1
    const [newDemand] = await db.select().from(demands).where(eq(demands.id, newDemandId)).limit(1);
    expect(newDemand.affectedCount).toBe(1);
  });
});
