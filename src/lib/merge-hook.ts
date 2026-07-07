/**
 * Async hook into C's merge engine after intake.
 * Dynamic import so platform layer builds before intelligence layer lands.
 */
export async function triggerMergeProcessing(submissionId: string): Promise<void> {
  try {
    const mod = await import("@/lib/merge");
    if (typeof mod.processSubmission === "function") {
      await mod.processSubmission(submissionId);
    }
  } catch {
    // merge.ts not yet implemented — Person C wires this in C2
  }
}
