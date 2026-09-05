import { describe, expect, it } from "vitest";

import {
  apiPublicationRequestSchema,
  axiomManifestSchema,
  discoveryRequestSchema,
  errorResponseSchema,
  manifestPublicationRequestSchema,
} from "./index.js";

const provider = {
  name: "Atlas Dining",
  domain: "atlas.example",
  canonicalUrl: "https://atlas.example",
  description: "Restaurant discovery and reservation services.",
};

const capability = {
  name: "search_restaurants",
  description: "Search available restaurants by location and cuisine.",
  inputSchema: { type: "object" },
};

describe("transport contracts", () => {
  it("normalizes and validates a discovery intent", () => {
    expect(
      discoveryRequestSchema.parse({ intent: "  reserve dinner  " }),
    ).toEqual({ intent: "reserve dinner", limit: 10 });
    expect(
      discoveryRequestSchema.safeParse({ intent: "", limit: 10 }).success,
    ).toBe(false);
  });

  it("validates API publication requests with merge semantics", () => {
    expect(
      apiPublicationRequestSchema.parse({
        source: "api",
        provider,
        capabilities: [capability],
      }),
    ).toMatchObject({ source: "api", mode: "merge" });
  });

  it("accepts the documented Axiom manifest format", () => {
    expect(
      manifestPublicationRequestSchema.parse({
        source: "manifest",
        manifest: { version: "1", provider, capabilities: [capability] },
      }),
    ).toMatchObject({ source: "manifest", mode: "merge" });
  });

  it("rejects unsupported manifest versions", () => {
    expect(
      axiomManifestSchema.safeParse({
        version: "2",
        provider,
        capabilities: [capability],
      }).success,
    ).toBe(false);
  });

  it("keeps error responses stable", () => {
    expect(
      errorResponseSchema.parse({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Embedding provider unavailable.",
          requestId: "request-1",
        },
      }),
    ).toMatchObject({ error: { code: "SERVICE_UNAVAILABLE" } });
  });
});
