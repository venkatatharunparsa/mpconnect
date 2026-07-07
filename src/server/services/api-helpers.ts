import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/server/utils/logger";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    logger.warn("API input validation failed", { details: err.flatten() });
    return jsonError("Validation failed", 400, { details: err.flatten() });
  }
  if (err instanceof Error && err.name === "IllegalTransitionError") {
    logger.warn(`API transition rejected: ${err.message}`);
    return jsonError(err.message, 409);
  }
  logger.error("Unhandled API exception captured", err);
  return jsonError("Internal server error", 500);
}

export async function parseJsonBody<T>(req: Request): Promise<T> {
  return req.json() as Promise<T>;
}
