import type { ErrorResponse } from "../../contracts/src/common.js";

export type AxiomPublisherErrorCode =
  | ErrorResponse["error"]["code"]
  | "CONFIGURATION_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "API_ERROR"
  | "INVALID_RESPONSE";

export interface AxiomPublisherErrorOptions {
  readonly status?: number | undefined;
  readonly details?: Readonly<Record<string, unknown>> | undefined;
  readonly requestId?: string | undefined;
}

export class AxiomPublisherError extends Error {
  readonly code: AxiomPublisherErrorCode;
  readonly status: number | undefined;
  readonly details: Readonly<Record<string, unknown>> | undefined;
  readonly requestId: string | undefined;

  constructor(
    code: AxiomPublisherErrorCode,
    message: string,
    options: AxiomPublisherErrorOptions = {},
  ) {
    super(message);
    this.name = "AxiomPublisherError";
    this.code = code;
    this.status = options.status;
    this.details = options.details;
    this.requestId = options.requestId;
  }
}
