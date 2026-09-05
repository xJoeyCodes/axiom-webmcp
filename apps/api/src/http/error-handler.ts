import type { ApplicationErrorCode } from "@axiom/core";
import { ApplicationError } from "@axiom/core";
import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

const statusByCode: Record<ApplicationErrorCode, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVICE_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
};

function hasClientErrorStatus(
  error: unknown,
): error is { readonly statusCode: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number" &&
    error.statusCode >= 400 &&
    error.statusCode < 500
  );
}

export function registerErrorHandling(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) =>
    reply.status(404).send({
      error: {
        code: "NOT_FOUND",
        message: "Route not found.",
        requestId: request.id,
      },
    }),
  );

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "The request is invalid.",
          requestId: request.id,
          details: { issues: error.issues },
        },
      });
    }
    if (error instanceof ApplicationError) {
      const statusCode = statusByCode[error.code];
      if (error.code === "INTERNAL_ERROR") {
        request.log.error({ err: error }, "Application request failed");
      }
      return reply.status(statusCode).send({
        error: {
          code: error.code,
          message:
            error.code === "INTERNAL_ERROR"
              ? "An unexpected error occurred."
              : error.message,
          requestId: request.id,
          ...(error.details ? { details: error.details } : {}),
        },
      });
    }
    if (hasClientErrorStatus(error)) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "The request is invalid.",
          requestId: request.id,
        },
      });
    }
    request.log.error({ err: error }, "Unhandled request error");
    return reply.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
        requestId: request.id,
      },
    });
  });
}
