import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    return jsonError("Validation failed", 400, { details: err.flatten() });
  }
  if (err instanceof Error && err.name === "IllegalTransitionError") {
    return jsonError(err.message, 409);
  }
  console.error(err);
  return jsonError("Internal server error", 500);
}

export async function parseJsonBody<T>(req: Request): Promise<T> {
  return req.json() as Promise<T>;
}
