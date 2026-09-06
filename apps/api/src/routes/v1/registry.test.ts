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

const providerBody = {
  name: "Atlas Dining",
  domain: "https://www.AtlasDining.example/path",
  canonicalUrl: "http://atlasdining.example/registry",
  description: "Restaurant discovery and reservation services.",
};

const capabilityBody = {
  name: "make_reservation",
  description: "Reserve an available restaurant table.",
  inputSchema: {
    type: "object",
    properties: { restaurant: { type: "string" } },
    required: ["restaurant"],
  },
  outputSchema: { type: "object" },
  annotations: { readOnly: false, requiresConfirmation: true },
  specVersion: "draft",
  source: "api",
};

describe("registry HTTP API", () => {
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

  it("rejects invalid provider bodies and protected mass assignment", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/providers",
      payload: { ...providerBody, verificationStatus: "verified" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("registers and normalizes a provider", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/providers",
      payload: providerBody,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      data: {
        slug: "atlas-dining",
        domain: "atlasdining.example",
        canonicalUrl: "https://atlasdining.example",
        verificationStatus: "unverified",
        status: "active",
      },
    });
  });

  it("returns a conflict for the same normalized domain", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/providers",
      payload: {
        ...providerBody,
        name: "Duplicate Atlas",
        domain: "atlasdining.example",
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ error: { code: "CONFLICT" } });
  });

  it("lists, retrieves, and safely updates provider metadata", async () => {
    const list = await app.inject({
      method: "GET",
      url: "/v1/providers?limit=10&offset=0&status=active",
    });
    const detail = await app.inject({
      method: "GET",
      url: "/v1/providers/atlas-dining",
    });
    const updated = await app.inject({
      method: "PATCH",
      url: "/v1/providers/atlas-dining",
      payload: { description: "Updated registry description." },
    });

    expect(list.json()).toMatchObject({ pagination: { total: 1 } });
    expect(detail.json()).toMatchObject({ meta: { capabilityCount: 0 } });
    expect(updated.json()).toMatchObject({
      data: {
        domain: "atlasdining.example",
        description: "Updated registry description.",
        verificationStatus: "unverified",
      },
    });
  });

  it("returns a consistent missing-provider error", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/providers/missing-provider",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: { code: "NOT_FOUND" } });
  });

  it("registers a capability and rejects duplicate POST registration", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/v1/providers/atlas-dining/capabilities",
      payload: capabilityBody,
    });
    const duplicate = await app.inject({
      method: "POST",
      url: "/v1/providers/atlas-dining/capabilities",
      payload: capabilityBody,
    });

    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({
      data: { name: "make_reservation", status: "active" },
    });
    expect(duplicate.statusCode).toBe(409);
  });

  it("lists and retrieves capabilities", async () => {
    const list = await app.inject({
      method: "GET",
      url: "/v1/providers/atlas-dining/capabilities",
    });
    const detail = await app.inject({
      method: "GET",
      url: "/v1/providers/atlas-dining/capabilities/make_reservation",
    });

    expect(list.json()).toMatchObject({
      data: [{ name: "make_reservation" }],
    });
    expect(detail.json()).toMatchObject({
      data: { name: "make_reservation" },
    });
  });

  it("reports unchanged and updated capability PUT outcomes", async () => {
    const unchanged = await app.inject({
      method: "PUT",
      url: "/v1/providers/atlas-dining/capabilities/make_reservation",
      payload: capabilityBody,
    });
    const updated = await app.inject({
      method: "PUT",
      url: "/v1/providers/atlas-dining/capabilities/make_reservation",
      payload: {
        ...capabilityBody,
        description: "Reserve and confirm a table.",
      },
    });

    expect(unchanged.statusCode).toBe(200);
    expect(unchanged.json()).toMatchObject({ meta: { outcome: "unchanged" } });
    expect(updated.statusCode).toBe(200);
    expect(updated.json()).toMatchObject({ meta: { outcome: "updated" } });
  });

  it("creates a missing capability through PUT", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/v1/providers/atlas-dining/capabilities/check_availability",
      payload: {
        ...capabilityBody,
        name: "check_availability",
        description: "Check table availability.",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ meta: { outcome: "created" } });
  });
});
