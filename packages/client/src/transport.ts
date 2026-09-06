import type { z } from "zod";
import { errorResponseSchema } from "../../contracts/src/common.js";
import { AxiomError } from "./error.js";
import type { AxiomOptions } from "./types.js";

export function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AxiomError("VALIDATION_ERROR", "The Axiom request is invalid.", {
      details: {
        issues: result.error.issues.map((issue) => ({
          path: issue.path.map(String),
          message: issue.message,
        })),
      },
    });
  }
  return result.data;
}

export class Transport {
  private readonly baseUrl: string;
  private readonly fetchImplementation: typeof globalThis.fetch;
  private readonly headers: Headers;
  private readonly timeoutMs: number;

  constructor(options: AxiomOptions) {
    try {
      const url = new URL(options.baseUrl);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash
      )
        throw new Error();
      this.baseUrl = url.href.replace(/\/+$/u, "");
    } catch {
      throw new AxiomError(
        "CONFIGURATION_ERROR",
        "baseUrl must be an absolute HTTP(S) URL without credentials, query, or fragment.",
      );
    }
    const fetchImplementation = options.fetch ?? globalThis.fetch;
    if (typeof fetchImplementation !== "function") {
      throw new AxiomError(
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
      throw new AxiomError(
        "CONFIGURATION_ERROR",
        "timeoutMs must be a positive integer no greater than 2147483647.",
      );
    }
    try {
      this.headers = new Headers(options.headers);
      this.headers.set("Accept", "application/json");
      this.headers.set("Content-Type", "application/json");
    } catch {
      throw new AxiomError(
        "CONFIGURATION_ERROR",
        "Custom headers are invalid.",
      );
    }
  }

  async request<T>(
    path: string,
    schema: z.ZodType<T>,
    body?: unknown,
  ): Promise<T> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new AxiomError("TIMEOUT", "The Axiom request timed out."));
        controller.abort();
      }, this.timeoutMs);
    });
    try {
      return await Promise.race([
        this.execute(path, schema, controller.signal, body),
        deadline,
      ]);
    } catch (error) {
      if (error instanceof AxiomError) throw error;
      throw new AxiomError("NETWORK_ERROR", "Could not reach the Axiom API.");
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  }

  private async execute<T>(
    path: string,
    schema: z.ZodType<T>,
    signal: AbortSignal,
    body?: unknown,
  ): Promise<T> {
    const response = await this.fetchImplementation(`${this.baseUrl}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: new Headers(this.headers),
      signal,
      redirect: "error",
      credentials: "omit",
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const requestId = response.headers.get("x-request-id") ?? undefined;
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new AxiomError(
        response.ok ? "INVALID_RESPONSE" : "API_ERROR",
        response.ok
          ? "The Axiom API returned invalid JSON."
          : "The Axiom API request failed.",
        { status: response.status, requestId },
      );
    }
    if (!response.ok) {
      const error = errorResponseSchema.safeParse(payload);
      if (error.success) {
        throw new AxiomError(error.data.error.code, error.data.error.message, {
          status: response.status,
          requestId: error.data.error.requestId,
          details: error.data.error.details,
        });
      }
      throw new AxiomError("API_ERROR", "The Axiom API request failed.", {
        status: response.status,
        requestId,
      });
    }
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      throw new AxiomError(
        "INVALID_RESPONSE",
        "The Axiom API response does not match the expected contract.",
        { status: response.status, requestId },
      );
    }
    return parsed.data;
  }
}
