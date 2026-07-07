/**
 * Append-only, hash-chained event ledger (sacred contract #1).
 * Each demand has its own chain: event.prevHash = hash of the demand's previous
 * event (genesis constant for the first). Tampering with any historical row breaks
 * every subsequent hash — verifyChain() detects it.
 */
import { createHash } from "crypto";
import { sql, desc, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema";
import { events } from "@/server/db/schema";

type DbExecutor = PostgresJsDatabase<typeof schema>;

const GENESIS = "mpconnect-genesis-2026";

export type ActorType = "citizen" | "model" | "human" | "system";

export interface AppendEventInput {
  eventType: string;
  demandId?: string | null;
  submissionId?: string | null;
  actorType: ActorType;
  actorId: string;
  payload: Record<string, unknown>;
}

function canonical(input: AppendEventInput, prevHash: string, occurredAt: string) {
  return JSON.stringify({
    eventType: input.eventType,
    demandId: input.demandId ?? null,
    submissionId: input.submissionId ?? null,
    actorType: input.actorType,
    actorId: input.actorId,
    payload: sortKeys(input.payload),
    prevHash,
    occurredAt,
  });
}

function sortKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortKeys(v)]),
    );
  }
  return obj;
}

export function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

async function insertEvent(
  tx: DbExecutor,
  input: AppendEventInput,
  prevHash: string,
  occurredAt: Date,
) {
  const occurredAtIso = occurredAt.toISOString();
  const hash = sha256(canonical(input, prevHash, occurredAtIso));
  const [row] = await tx
    .insert(events)
    .values({
      eventType: input.eventType,
      demandId: input.demandId ?? null,
      submissionId: input.submissionId ?? null,
      actorType: input.actorType,
      actorId: input.actorId,
      payload: input.payload,
      prevHash,
      hash,
      occurredAt,
    })
    .returning();
  return row;
}

/** Append one event, computing the chain hash. Returns the inserted row. */
export async function appendEvent(input: AppendEventInput) {
  const occurredAt = new Date();

  if (!input.demandId) {
    return insertEvent(db, input, GENESIS, occurredAt);
  }

  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${input.demandId!}))`);

    const prev = await tx.query.events.findFirst({
      where: eq(events.demandId, input.demandId!),
      orderBy: [desc(events.id)],
    });
    const prevHash = prev?.hash ?? GENESIS;
    return insertEvent(tx, input, prevHash, occurredAt);
  });
}

/** Verify a demand's full chain. Returns { ok, brokenAtEventId? }. */
export async function verifyChain(demandId: string) {
  const rows = await db.query.events.findMany({
    where: eq(events.demandId, demandId),
    orderBy: [events.id],
  });
  let prevHash = GENESIS;
  for (const row of rows) {
    if (row.prevHash !== prevHash) return { ok: false as const, brokenAtEventId: row.id };
    const recomputed = sha256(
      canonical(
        {
          eventType: row.eventType,
          demandId: row.demandId,
          submissionId: row.submissionId,
          actorType: row.actorType as ActorType,
          actorId: row.actorId,
          payload: row.payload as Record<string, unknown>,
        },
        row.prevHash,
        row.occurredAt.toISOString(),
      ),
    );
    if (recomputed !== row.hash) return { ok: false as const, brokenAtEventId: row.id };
    prevHash = row.hash;
  }
  return { ok: true as const };
}

/** Human-readable timeline for the UI. */
export async function demandTimeline(demandId: string) {
  return db.query.events.findMany({
    where: eq(events.demandId, demandId),
    orderBy: [events.id],
  });
}
