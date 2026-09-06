import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { northstarCommercePublication } from "@axiom/ingestion";

import { createApp } from "../../app.js";
import type { Environment } from "../../config/environment.js";
import { createTestRegistry } from "../../test/create-test-registry.js";

const environment: Environment = {
  NODE_ENV: "test",
  API_HOST: "127.0.0.1",
  PORT: 4_000,
  DATABASE_URL: "postgresql://axiom:axiom@localhost:5432/axiom_test",
  LOG_LEVEL: "silent",
  CORS_ORIGINS: ["http://localhost:3000"],
};

describe("publication HTTP API", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createApp({
      environment,
      registry: createTestRegistry(),
      logger: false,
    });
  });

  afterAll(async () => app.close());

  it("rejects structurally invalid publications", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/inspect",
      payload: { source: "api", provider: {}, capabilities: [] },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("previews without persistence, publishes, then reports unchanged", async () => {
    const preview = await app.inject({
      method: "POST",
      url: "/v1/inspect",
      payload: northstarCommercePublication,
    });
    const absent = await app.inject({
      method: "GET",
      url: "/v1/providers/northstar-commerce",
    });
    const published = await app.inject({
      method: "POST",
      url: "/v1/publish",
      payload: northstarCommercePublication,
    });
    const repeated = await app.inject({
      method: "POST",
      url: "/v1/inspect",
      payload: northstarCommercePublication,
    });

    expect(preview.statusCode).toBe(200);
    expect(preview.json()).toMatchObject({
      data: { plan: { summary: { create: 4, unchanged: 0 } } },
    });
    expect(absent.statusCode).toBe(404);
    expect(published.statusCode).toBe(200);
    expect(published.json()).toMatchObject({
      data: {
        provider: { slug: "northstar-commerce" },
        summary: { create: 4 },
      },
    });
    expect(repeated.json()).toMatchObject({
      data: { plan: { summary: { create: 0, unchanged: 4 } } },
    });
  });

  it("accepts the Axiom manifest envelope", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/inspect",
      payload: {
        source: "manifest",
        manifest: {
          version: "1",
          provider: {
            name: "Manifest Provider",
            domain: "manifest-provider.example",
            canonicalUrl: "https://manifest-provider.example",
            description:
              "A provider submitted through the Axiom manifest format.",
          },
          capabilities: [
            {
              name: "lookup_item",
              description: "Look up a catalog item by its stable identifier.",
              inputSchema: { type: "object" },
              outputSchema: { type: "object" },
              annotations: { readOnly: true },
            },
          ],
        },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: { plan: { provider: { action: "create" } } },
    });
  });
});
