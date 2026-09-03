import { describe, expect, it } from "vitest";

import {
  discoveryRequestSchema,
  errorResponseSchema,
  inspectionRequestSchema,
  publishRequestSchema,
} from "./index.js";

describe("transport contracts", () => {
  it("normalizes and validates a discovery request", () => {
    expect(
      discoveryRequestSchema.parse({ query: "  reserve dinner  " }),
    ).toEqual({
      query: "reserve dinner",
      limit: 10,
    });
  });

  it("rejects empty discovery intent and non-HTTP inspection input", () => {
    expect(discoveryRequestSchema.safeParse({ query: " " }).success).toBe(
      false,
    );
    expect(
      inspectionRequestSchema.safeParse({ url: "not-a-url" }).success,
    ).toBe(false);
  });

  it("validates publish contact email when supplied", () => {
    expect(
      publishRequestSchema.safeParse({
        url: "https://example.com",
        contactEmail: "invalid",
      }).success,
    ).toBe(false);
  });

  it("keeps error responses stable", () => {
    expect(
      errorResponseSchema.parse({
        error: {
          code: "NOT_FOUND",
          message: "Provider not found.",
          requestId: "request-1",
        },
      }),
    ).toMatchObject({ error: { code: "NOT_FOUND" } });
  });
});
