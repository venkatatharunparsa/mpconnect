import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export interface LogContext {
  traceId: string;
}

export const loggerContext = new AsyncLocalStorage<LogContext>();

export function getTraceId(): string | undefined {
  return loggerContext.getStore()?.traceId;
}

export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    const traceId = getTraceId();
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "INFO",
        traceId,
        message,
        ...context,
      })
    );
  },
  warn(message: string, context?: Record<string, unknown>) {
    const traceId = getTraceId();
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "WARN",
        traceId,
        message,
        ...context,
      })
    );
  },
  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    const traceId = getTraceId();
    let errDetail: unknown = undefined;

    if (error instanceof Error) {
      errDetail = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      errDetail = error;
    }

    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "ERROR",
        traceId,
        message,
        error: errDetail,
        ...context,
      })
    );
  },
  debug(message: string, context?: Record<string, unknown>) {
    const traceId = getTraceId();
    console.debug(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "DEBUG",
        traceId,
        message,
        ...context,
      })
    );
  },
};

/**
 * Tracing middleware wrapper for Next.js route handlers.
 * Initiates the trace context, logs metadata/duration, and sets x-trace-id response header.
 */
export async function withTracing(
  req: Request,
  handler: () => Promise<NextResponse>
): Promise<Response> {
  const traceId = req.headers.get("x-trace-id") || randomUUID();
  const startTime = Date.now();

  return loggerContext.run({ traceId }, async () => {
    logger.info(`Incoming Request: ${req.method} ${req.url}`);
    try {
      const response = await handler();
      const elapsedMs = Date.now() - startTime;
      logger.info(`Request Succeeded: ${req.method} ${req.url} [Status ${response.status}]`, {
        elapsedMs,
      });
      response.headers.set("x-trace-id", traceId);
      return response;
    } catch (err) {
      const elapsedMs = Date.now() - startTime;
      logger.error(`Request Failed: ${req.method} ${req.url}`, err, { elapsedMs });
      
      // Attempt dynamic loading of api-helpers to format error
      try {
        const { handleApiError } = require("../services/intake/api-helpers");
        const errResponse = handleApiError(err);
        errResponse.headers.set("x-trace-id", traceId);
        return errResponse;
      } catch {
        const fallBackResponse = NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
        fallBackResponse.headers.set("x-trace-id", traceId);
        return fallBackResponse;
      }
    }
  });
}
