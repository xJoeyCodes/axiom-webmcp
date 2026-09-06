import type { z } from "zod";

import { errorResponseSchema } from "../../contracts/src/common.js";
import { AxiomPublisherError } from "./error.js";
import type { AxiomPublisherOptions } from "./types.js";

export function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AxiomPublisherError(
      "VALIDATION_ERROR",
      "The publication is invalid.",
      {
        details: {
          issues: result.error.issues.map((issue) => ({
            path: issue.path.map(String),
            message: issue.message,
          })),
        },
      },
    );
  }
  return result.data;
}

export class PublisherTransport {
  private readonly baseUrl: string;
  private readonly fetchImplementation: typeof globalThis.fetch;
  private readonly headers: Headers;
  private readonly timeoutMs: number;

  constructor(options: AxiomPublisherOptions) {
    try {
      const url = new URL(options.baseUrl);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash
      ) {
        throw new Error();
      }
      this.baseUrl = url.href.replace(/\/+$/u, "");
    } catch {
      throw new AxiomPublisherError(
        "CONFIGURATION_ERROR",
        "baseUrl must be an absolute HTTP(S) URL without credentials, query, or fragment.",
      );
    }

    const fetchImplementation = options.fetch ?? globalThis.fetch;
    if (typeof fetchImplementation !== "function") {
      throw new AxiomPublisherError(
        "CONFIGURATION_ERROR",
        "This runtime requires an injected fetch implementation.",
      );
    }
    this.fetchImplementation = options.fetch
      ? fetchImplementation
      : fetchImplementation.bind(globalThis);
    this.timeoutMs = options.timeoutMs ?? 10_000;
    if (
      !Number.isInteger(this.timeoutMs) ||
      this.timeoutMs <= 0 ||
      this.timeoutMs > 2_147_483_647
    ) {
      throw new AxiomPublisherError(
        "CONFIGURATION_ERROR",
        "timeoutMs must be a positive integer no greater than 2147483647.",
      );
    }
    try {
      this.headers = new Headers(options.headers);
      this.headers.set("Accept", "application/json");
      this.headers.set("Content-Type", "application/json");
    } catch {
      throw new AxiomPublisherError(
        "CONFIGURATION_ERROR",
        "Custom headers are invalid.",
      );
    }
  }

  async post<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(
          new AxiomPublisherError("TIMEOUT", "The Axiom request timed out."),
        );
        controller.abort();
      }, this.timeoutMs);
    });

    try {
      return await Promise.race([
        this.execute(path, body, schema, controller.signal),
        deadline,
      ]);
    } catch (error) {
      if (error instanceof AxiomPublisherError) throw error;
      throw new AxiomPublisherError(
        "NETWORK_ERROR",
        "Could not reach the Axiom API.",
      );
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  }

  private async execute<T>(
    path: string,
    body: unknown,
    schema: z.ZodType<T>,
    signal: AbortSignal,
  ): Promise<T> {
    const response = await this.fetchImplementation(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: new Headers(this.headers),
      body: JSON.stringify(body),
      signal,
      redirect: "error",
      credentials: "omit",
    });
    const requestId = response.headers.get("x-request-id") ?? undefined;
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new AxiomPublisherError(
        response.ok ? "INVALID_RESPONSE" : "API_ERROR",
        response.ok
          ? "The Axiom API returned invalid JSON."
          : "The Axiom API request failed.",
        { status: response.status, requestId },
      );
    }

    if (!response.ok) {
      const parsedError = errorResponseSchema.safeParse(payload);
      if (parsedError.success) {
        throw new AxiomPublisherError(
          parsedError.data.error.code,
          parsedError.data.error.message,
          {
            status: response.status,
            requestId: parsedError.data.error.requestId,
            details: parsedError.data.error.details,
          },
        );
      }
      throw new AxiomPublisherError(
        "API_ERROR",
        "The Axiom API request failed.",
        { status: response.status, requestId },
      );
    }

    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      throw new AxiomPublisherError(
        "INVALID_RESPONSE",
        "The Axiom API response does not match the expected contract.",
        { status: response.status, requestId },
      );
    }
    return parsed.data;
  }
}
