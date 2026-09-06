import {
  northstarCommercePublication,
  PublicationService,
} from "@axiom/ingestion";
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

describe("publication indexing integration", () => {
  let app: FastifyInstance | undefined;
  afterEach(async () => app?.close());

  it("indexes created capabilities and skips an identical publication", async () => {
    app = await createApp({
      environment,
      registry: createTestRegistry(),
      logger: false,
    });
    const first = await app.inject({
      method: "POST",
      url: "/v1/publish",
      payload: northstarCommercePublication,
    });
    const second = await app.inject({
      method: "POST",
      url: "/v1/publish",
      payload: northstarCommercePublication,
    });
    expect(first.json()).toMatchObject({
      data: { indexing: { ready: 4, failed: 0, unchanged: 0, pending: 0 } },
    });
    expect(second.json()).toMatchObject({
      data: { indexing: { ready: 0, failed: 0, unchanged: 4, pending: 0 } },
    });
  });

  it("keeps registry publication committed when indexing fails", async () => {
    const registry = createTestRegistry();
    registry.publicationService = new PublicationService(
      registry.inspectionService,
      {
        execute: (operation) =>
          operation({
            providers: registry.repositories.providers,
            capabilities: registry.repositories.capabilities,
          }),
      },
      {
        indexCapabilities: async (ids) => ({
          ready: 0,
          failed: ids.length,
          unchanged: 0,
        }),
      },
    );
    app = await createApp({ environment, registry, logger: false });
    const published = await app.inject({
      method: "POST",
      url: "/v1/publish",
      payload: northstarCommercePublication,
    });
    const provider = await app.inject({
      method: "GET",
      url: "/v1/providers/northstar-commerce",
    });
    expect(published.json()).toMatchObject({
      data: { indexing: { failed: 4 }, summary: { create: 4 } },
    });
    expect(provider.statusCode).toBe(200);
  });
});
