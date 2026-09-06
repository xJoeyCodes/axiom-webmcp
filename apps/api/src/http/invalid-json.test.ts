import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { createApp } from "../app.js";
import type { Environment } from "../config/environment.js";
import { createTestRegistry } from "../test/create-test-registry.js";

const environment: Environment = {
  NODE_ENV: "test",
  API_HOST: "127.0.0.1",
  PORT: 4_000,
  DATABASE_URL: "postgresql://axiom:axiom@localhost:5432/axiom_test",
  LOG_LEVEL: "silent",
  CORS_ORIGINS: ["http://localhost:3000"],
};

describe("invalid JSON handling", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createApp({
      environment,
      registry: createTestRegistry(),
      logger: false,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns a safe validation response for malformed JSON", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/providers",
      headers: { "content-type": "application/json" },
      payload: '{"name":',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: { code: "VALIDATION_ERROR", message: "The request is invalid." },
    });
  });
});
