import type { ErrorResponse } from "../../contracts/src/common.js";

export type AxiomErrorCode =
  | ErrorResponse["error"]["code"]
  | "CONFIGURATION_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "API_ERROR"
  | "INVALID_RESPONSE";

export interface AxiomErrorOptions {
  readonly status?: number | undefined;
  readonly details?: Readonly<Record<string, unknown>> | undefined;
  readonly requestId?: string | undefined;
}

/** Stable API and transport failure; never contains raw fetch errors or request credentials. */
export class AxiomError extends Error {
  readonly code: AxiomErrorCode;
  readonly status: number | undefined;
  readonly details: Readonly<Record<string, unknown>> | undefined;
  readonly requestId: string | undefined;

  constructor(
    code: AxiomErrorCode,
    message: string,
    options: AxiomErrorOptions = {},
  ) {
    super(message);
    this.name = "AxiomError";
    this.code = code;
    this.status = options.status;
    this.details = options.details;
    this.requestId = options.requestId;
  }
}
