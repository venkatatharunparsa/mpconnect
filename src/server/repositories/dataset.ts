import { db } from "@/server/db";
import { datasets } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function getDatasetRowsByWard(ward: string) {
  return db.select().from(datasets).where(eq(datasets.ward, ward));
}
