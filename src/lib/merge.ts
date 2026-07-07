/**
 * Merge engine stub — Person C replaces this file in task C2.
 * Platform intake calls processSubmission() via merge-hook after insert.
 */

export async function processSubmission(submissionId: string): Promise<void> {
  void submissionId;
  // No-op until C2 merge engine lands
}

export async function applyMergeReviewDecision(_args: {
  submissionId: string;
  decision: "merge" | "new" | "attach";
  demandId?: string;
  actorId: string;
}): Promise<never> {
  throw new Error("Merge engine not implemented — Person C task C2");
}
