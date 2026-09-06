import { AxiomError } from "@axiom-webmcp/client";
import { AxiomPublisherError } from "@axiom-webmcp/sdk";

export class FrontendAxiomError extends Error {
  readonly code: string;
  readonly status: number | undefined;
  readonly details: Readonly<Record<string, unknown>> | undefined;
  readonly requestId: string | undefined;

  constructor(
    code: string,
    message: string,
    options: {
      status?: number;
      details?: Readonly<Record<string, unknown>>;
      requestId?: string;
    } = {},
  ) {
    super(message);
    this.name = "FrontendAxiomError";
    this.code = code;
    this.status = options.status;
    this.details = options.details;
    this.requestId = options.requestId;
  }
}

export function toFrontendAxiomError(error: unknown): FrontendAxiomError {
  if (error instanceof FrontendAxiomError) return error;

  if (error instanceof AxiomError || error instanceof AxiomPublisherError) {
    return new FrontendAxiomError(error.code, error.message, {
      status: error.status,
      details: error.details,
      requestId: error.requestId,
    });
  }

  return new FrontendAxiomError(
    "INTERNAL_ERROR",
    "Axiom could not complete the request.",
  );
}

export function formatFrontendError(error: unknown): string {
  const mapped = toFrontendAxiomError(error);

  if (mapped.code === "NETWORK_ERROR") {
    return "Unable to reach the Axiom API. Check the configured API URL and try again.";
  }
  if (mapped.code === "TIMEOUT") {
    return "The Axiom API took too long to respond. Try again.";
  }
  if (mapped.code === "INVALID_RESPONSE") {
    return "The Axiom API returned an unexpected response.";
  }

  return mapped.message;
}
