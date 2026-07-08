import { db } from "@/server/db";
import { events } from "@/server/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function getLastEventForDemand(txOrDb: any, demandId: string) {
  return txOrDb.query.events.findFirst({
    where: eq(events.demandId, demandId),
    orderBy: [desc(events.id)],
  });
}

export async function getAllEventsForDemand(demandId: string) {
  return db.query.events.findMany({
    where: eq(events.demandId, demandId),
    orderBy: [events.id],
  });
}

export async function insertEventRow(txOrDb: any, values: typeof events.$inferInsert) {
  const [row] = await txOrDb.insert(events).values(values).returning();
  return row;
}

export async function findFirstEventByType(demandId: string, eventType: string) {
  return db.query.events.findFirst({
    where: and(eq(events.demandId, demandId), eq(events.eventType, eventType)),
    orderBy: [desc(events.id)],
  });
}
