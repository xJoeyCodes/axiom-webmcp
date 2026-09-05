import { ApplicationError } from "@axiom/core";
import { DiscoveryService } from "@axiom/discovery";
import { northstarCommercePublication } from "@axiom/ingestion";
import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";

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

describe("discovery HTTP API", () => {
  let app: FastifyInstance | undefined;
  afterEach(async () => app?.close());

  it("validates intent and limits", async () => {
    app = await createApp({
      environment,
      registry: createTestRegistry(),
      logger: false,
    });
    const empty = await app.inject({
      method: "POST",
      url: "/v1/discover",
      payload: { intent: "" },
    });
    const limit = await app.inject({
      method: "POST",
      url: "/v1/discover",
      payload: { intent: "products", limit: 51 },
    });
    expect(empty.statusCode).toBe(400);
    expect(limit.statusCode).toBe(400);
  });

  it("returns a typed provider-grouped discovery response", async () => {
    app = await createApp({
      environment,
      registry: createTestRegistry(),
      logger: false,
    });
    await app.inject({
      method: "POST",
      url: "/v1/publish",
      payload: northstarCommercePublication,
    });
    const response = await app.inject({
      method: "POST",
      url: "/v1/discover",
      payload: { intent: "put an item in my shopping basket", limit: 10 },
    });
    const body = response.json();
    expect(response.statusCode).toBe(200);
    expect(body).toMatchObject({
      data: {
        query: { intent: "put an item in my shopping basket" },
        count: 1,
        results: [{ provider: { slug: "northstar-commerce" } }],
      },
    });
    expect(
      body.data.results[0].matchedCapabilities.some(
        (match: { capability: { name: string } }) =>
          match.capability.name === "add_to_cart",
      ),
    ).toBe(true);
  });

  it("returns an empty list when no indexed capability is relevant", async () => {
    app = await createApp({
      environment,
      registry: createTestRegistry(),
      logger: false,
    });
    const response = await app.inject({
      method: "POST",
      url: "/v1/discover",
      payload: { intent: "quantum banana" },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ data: { count: 0, results: [] } });
  });

  it("maps embedding provider failures to a controlled service error", async () => {
    const registry = createTestRegistry();
    registry.discoveryService = new DiscoveryService(
      {
        provider: "test",
        model: "unavailable",
        dimensions: 3,
        version: "1",
        embed: async () => {
          throw new ApplicationError(
            "SERVICE_UNAVAILABLE",
            "Embedding provider unavailable.",
          );
        },
        embedMany: async () => [],
      },
      registry.repositories.index,
    );
    app = await createApp({ environment, registry, logger: false });
    const response = await app.inject({
      method: "POST",
      url: "/v1/discover",
      payload: { intent: "reserve dinner" },
    });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({
      error: { code: "SERVICE_UNAVAILABLE" },
    });
  });
});
