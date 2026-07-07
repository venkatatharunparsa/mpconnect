import { logger, loggerContext } from "@/server/core/logger";
import { randomUUID } from "node:crypto";

/**
 * Async hook into C's merge engine after intake.
 * Dynamic import so platform layer builds before intelligence layer lands.
 * Carries forward the parent trace context to group background process logs.
 */
export async function triggerMergeProcessing(
  submissionId: string,
  parentTraceId?: string
): Promise<void> {
  const traceId = parentTraceId || randomUUID();

  // Run the merge background processing inside the trace context
  loggerContext.run({ traceId }, async () => {
    logger.info(`Starting background merge processing for submission ${submissionId}`);
    try {
      const mod = await import("@/server/services/engine/merge");
      if (typeof mod.processSubmission === "function") {
        await mod.processSubmission(submissionId);
        logger.info(`Successfully finished merge processing for submission ${submissionId}`);
      } else {
        logger.warn("processSubmission is not exported from merge service");
      }
    } catch (err) {
      logger.error(`Error during background merge processing for submission ${submissionId}`, err);
    }
  });
}
