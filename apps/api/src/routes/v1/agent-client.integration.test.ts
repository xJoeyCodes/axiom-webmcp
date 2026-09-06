import { Axiom } from "@axiom-webmcp/client";
import { AxiomPublisher, type AxiomManifest } from "@axiom-webmcp/sdk";
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

const atlasManifest: AxiomManifest = {
  version: "1",
  provider: {
    name: "Atlas Dining",
    domain: "atlasdining.example",
    canonicalUrl: "https://atlasdining.example",
    description:
      "Restaurant discovery and reservation infrastructure for independent dining rooms.",
  },
  capabilities: [
    {
      name: "check_availability",
      description:
        "Check available restaurant tables for a date, time, and party size.",
      inputSchema: {
        type: "object",
        properties: {
          restaurant_id: { type: "string" },
          date: { type: "string", format: "date" },
          party_size: { type: "integer", minimum: 1 },
        },
        required: ["restaurant_id", "date", "party_size"],
      },
      annotations: { readOnly: true, sideEffecting: false },
    },
    {
      name: "make_reservation",
      description:
        "Reserve a restaurant table for a confirmed guest and selected time.",
      inputSchema: {
        type: "object",
        properties: {
          restaurant_id: { type: "string" },
          time: { type: "string" },
          guest: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string", format: "email" },
            },
            required: ["name", "email"],
          },
        },
        required: ["restaurant_id", "time", "guest"],
      },
      annotations: {
        readOnly: false,
        sideEffecting: true,
        requiresConfirmation: true,
      },
    },
  ],
};

describe("agent client MVP integration", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it("publishes Atlas, discovers it by intent, and reads its capability contracts", async () => {
    app = await createApp({
      environment,
      registry: createTestRegistry(),
      logger: false,
    });
    const baseUrl = await app.listen({ host: "127.0.0.1", port: 0 });
    const publisher = new AxiomPublisher({ baseUrl });
    const client = new Axiom({ baseUrl });

    const publication = await publisher.publish(atlasManifest);
    expect(publication.indexing).toMatchObject({ ready: 2, failed: 0 });

    const discovery = await client.discover({
      intent: "reserve dinner",
      limit: 5,
    });
    expect(discovery.results[0]?.provider.slug).toBe("atlas-dining");
    expect(
      discovery.results[0]?.matchedCapabilities.some(
        (match) => match.capability.name === "make_reservation",
      ),
    ).toBe(true);

    const provider = await client.getProvider("atlas-dining");
    const capabilities = await client.getCapabilities("atlas-dining");
    expect(provider.name).toBe("Atlas Dining");
    expect(capabilities.map((capability) => capability.name)).toEqual([
      "check_availability",
      "make_reservation",
    ]);
  });
});
