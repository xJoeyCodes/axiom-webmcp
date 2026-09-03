import type { ApplicationErrorCode } from "@axiom/core";
import { ApplicationError } from "@axiom/core";
import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

const statusByCode: Record<ApplicationErrorCode, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

export function registerErrorHandling(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) => {
    return reply.status(404).send({
      error: {
        code: "NOT_FOUND",
        message: "Route not found.",
        requestId: request.id,
      },
    });
  });

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
      if (statusCode >= 500) {
        request.log.error({ err: error }, "Application request failed");
      }

      return reply.status(statusCode).send({
        error: {
          code: error.code,
          message:
            statusCode >= 500 ? "An unexpected error occurred." : error.message,
          requestId: request.id,
          ...(error.details ? { details: error.details } : {}),
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
