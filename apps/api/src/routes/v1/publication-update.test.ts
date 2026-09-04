import { northstarCommercePublication } from "@axiom/ingestion";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

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

describe("publication update semantics", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createApp({
      environment,
      registry: createTestRegistry(),
      logger: false,
    });
  });

  afterAll(async () => app.close());

  it("persists only a changed capability while leaving the rest unchanged", async () => {
    await app.inject({
      method: "POST",
      url: "/v1/publish",
      payload: northstarCommercePublication,
    });
    const description =
      "Search and rank the product catalog with structured filters.";
    const changed = {
      ...northstarCommercePublication,
      capabilities: northstarCommercePublication.capabilities.map(
        (capability) =>
          capability.name === "search_products"
            ? { ...capability, description }
            : capability,
      ),
    };
    const published = await app.inject({
      method: "POST",
      url: "/v1/publish",
      payload: changed,
    });
    const capability = await app.inject({
      method: "GET",
      url: "/v1/providers/northstar-commerce/capabilities/search_products",
    });

    expect(published.json()).toMatchObject({
      data: { summary: { create: 0, update: 1, unchanged: 3 } },
    });
    expect(capability.json()).toMatchObject({ data: { description } });
  });

  it("rejects duplicate capability names before writing", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/publish",
      payload: {
        ...northstarCommercePublication,
        provider: {
          ...northstarCommercePublication.provider,
          domain: "duplicate-capabilities.example",
          canonicalUrl: "https://duplicate-capabilities.example",
        },
        capabilities: [
          northstarCommercePublication.capabilities[0],
          northstarCommercePublication.capabilities[0],
        ],
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
  });
});
