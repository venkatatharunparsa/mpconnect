/**
 * Verification quorum logic — pure functions for testability.
 */
import { CONFIG } from "@/lib/config";

export type QuorumOutcome = "resolved" | "reopened" | "pending";

export interface QuorumResult {
  outcome: QuorumOutcome;
  confirms: number;
  denies: number;
  quorumNeeded: number;
}

/** Determine verification outcome from confirm/deny counts. Any deny reopens immediately. */
export function evaluateVerificationQuorum(
  confirms: number,
  denies: number,
): QuorumResult {
  const quorumNeeded = CONFIG.verification.quorumConfirm;
  if (denies > 0) {
    return { outcome: "reopened", confirms, denies, quorumNeeded };
  }
  if (confirms >= quorumNeeded) {
    return { outcome: "resolved", confirms, denies, quorumNeeded };
  }
  return { outcome: "pending", confirms, denies, quorumNeeded };
}
