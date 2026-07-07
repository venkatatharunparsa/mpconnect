import { db } from "@/server/db";
import { authorities } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function getAllAuthorities() {
  return db.select().from(authorities);
}

export async function getVerifiedAuthorityById(id: number) {
  const [row] = await db
    .select()
    .from(authorities)
    .where(eq(authorities.id, id))
    .limit(1);
  if (!row) return null;
  if (!row.verified) return null;
  return row;
}
