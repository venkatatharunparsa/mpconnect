import { db } from "@/server/db";
import { demands } from "@/server/db/schema";
import { eq, and, ne, notInArray } from "drizzle-orm";

export async function getDemandById(id: string) {
  const [demand] = await db.select().from(demands).where(eq(demands.id, id)).limit(1);
  return demand || null;
}

export async function getDemandsByState(state: string) {
  return db.select().from(demands).where(eq(demands.state, state));
}

export async function updateDemand(id: string, fields: Partial<typeof demands.$inferInsert>) {
  return db.update(demands).set(fields).where(eq(demands.id, id));
}

export async function createDemand(fields: typeof demands.$inferInsert) {
  const [newDemand] = await db.insert(demands).values(fields).returning();
  return newDemand;
}

export async function getDemandsByWardExcept(ward: string, exceptId: string) {
  return db
    .select()
    .from(demands)
    .where(and(eq(demands.ward, ward), ne(demands.id, exceptId)));
}

export async function getUnresolvedDemands() {
  return db
    .select()
    .from(demands)
    .where(notInArray(demands.state, ["resolved_verified", "resolved_unverified"]));
}
