// TODO: confirm shape with A — inferred from src/db/schema.ts events table

export type ActorType = "citizen" | "model" | "human" | "system";

export interface TimelineEvent {
  id: number;
  eventType: string;
  demandId?: string | null;
  submissionId?: string | null;
  actorType: ActorType;
  actorId: string;
  payload: Record<string, unknown>;
  prevHash?: string;
  hash?: string;
  occurredAt: string;
}

export interface ChainVerification {
  ok: boolean;
  brokenAtEventId?: number;
}
