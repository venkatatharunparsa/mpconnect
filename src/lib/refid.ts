import { sql } from "drizzle-orm";
import { db } from "@/db";
import { CONFIG } from "@/lib/config";
import { isValidRefIdFormat } from "@/lib/refid-format";

export { isValidRefIdFormat };

let sequenceReady = false;

/** Ensure Postgres sequence exists for monotonic ref IDs. */
async function ensureSequence() {
  if (sequenceReady) return;
  await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS ref_id_seq START 1`);
  sequenceReady = true;
}

/** Generate a reference ID: VZG-YYMM-NNNNN (e.g. VZG-2607-00042). */
export async function generateRefId(): Promise<string> {
  await ensureSequence();
  const result = await db.execute<{ nextval: string }>(
    sql`SELECT nextval('ref_id_seq') AS nextval`,
  );
  const seq = Number(result[0]?.nextval ?? 1);
  const now = new Date();
  const yymm = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const suffix = String(seq).padStart(5, "0");
  return `${CONFIG.refIdPrefix}-${yymm}-${suffix}`;
}

