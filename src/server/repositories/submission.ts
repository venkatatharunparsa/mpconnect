import { db } from "@/server/db";
import { submissions } from "@/server/db/schema";
import { eq, inArray, and, gte, isNull, ne } from "drizzle-orm";

export async function getSubmissionById(id: string) {
  const [sub] = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1);
  return sub || null;
}

export async function getSubmissionsByDemandId(demandId: string) {
  return db.select().from(submissions).where(eq(submissions.demandId, demandId));
}

export async function getSubmissionsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return db.select().from(submissions).where(inArray(submissions.id, ids));
}

export async function updateSubmission(id: string, fields: Partial<typeof submissions.$inferInsert>) {
  return db.update(submissions).set(fields).where(eq(submissions.id, id));
}

export async function getRecentIntakeCandidates(windowStart: Date, category: string, ward: string) {
  return db
    .select()
    .from(submissions)
    .where(
      and(
        gte(submissions.createdAt, windowStart),
        eq(submissions.category, category),
        eq(submissions.ward, ward),
        ne(submissions.status, "rejected"),
        ne(submissions.status, "merged"),
        ne(submissions.status, "quarantined"),
        isNull(submissions.demandId),
      ),
    );
}
