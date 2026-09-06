import { randomUUID } from "node:crypto";

import {
  createCapabilityContentHash,
  type Capability,
  type EmbeddingMetadata,
  type Provider,
} from "@axiom/core";
import { eq } from "drizzle-orm";
import { expect, it } from "vitest";

import { createDatabase } from "./client.js";
import { DrizzleCapabilityIndexRepository } from "./repositories/drizzle-capability-index-repository.js";
import { DrizzleCapabilityRepository } from "./repositories/drizzle-capability-repository.js";
import { DrizzleProviderRepository } from "./repositories/drizzle-provider-repository.js";
import { capabilities, providers } from "./schema.js";

// Opt-in only: use a dedicated database with the checked-in migrations applied.
const databaseUrl = process.env.AXIOM_TEST_DATABASE_URL;

it.skipIf(!databaseUrl)(
  "persists cosine vectors, excludes unavailable records, and rejects superseded indexing writes",
  async () => {
    const database = createDatabase(databaseUrl!);
    const providerId = randomUUID();
    const timestamp = new Date();
    const metadata: EmbeddingMetadata = {
      provider: "test",
      model: "test-1024",
      dimensions: 1024,
      version: "1",
      searchDocumentVersion: "1",
    };
    const owner: Provider = {
      id: providerId,
      slug: `vector-test-${providerId}`,
      name: "Vector repository test",
      domain: `${providerId}.example`,
      canonicalUrl: `https://${providerId}.example`,
      description: "Integration test fixture",
      status: "active",
      verificationStatus: "unverified",
      lastIndexedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const vector = (first: number, second: number) => [
      first,
      second,
      ...Array<number>(1022).fill(0),
    ];
    const capabilityRepository = new DrizzleCapabilityRepository(database.db);
    const index = new DrizzleCapabilityIndexRepository(database.db);
    const tools: Capability[] = [
      "closest",
      "further",
      "pending",
      "disabled",
    ].map((name) => {
      const contract = {
        name,
        description: "Test capability",
        inputSchema: { type: "object" as const },
        outputSchema: null,
        annotations: {},
      };
      return {
        ...contract,
        id: randomUUID(),
        providerId,
        source: "api",
        specVersion: null,
        status: "active",
        contentHash: createCapabilityContentHash(contract),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    });

    try {
      await new DrizzleProviderRepository(database.db).create(owner);
      for (const tool of tools) await capabilityRepository.create(tool);
      for (const [position, tool] of tools.entries()) {
        if (tool.name === "pending") continue;
        const input = {
          capabilityId: tool.id,
          fingerprint: tool.contentHash,
          metadata,
          updatedAt: timestamp,
        };
        await index.markPending(input);
        await index.saveEmbedding({
          ...input,
          embedding: position === 1 ? vector(0.6, 0.8) : vector(1, 0),
        });
      }
      await database.db
        .update(capabilities)
        .set({ status: "disabled" })
        .where(eq(capabilities.id, tools[3]!.id));
      const matches = (
        await index.searchByEmbedding(vector(1, 0), {
          limit: 100,
          minimumSimilarity: 0,
        })
      ).filter((match) => match.provider.id === providerId);
      expect(matches.map((match) => match.capability.name)).toEqual([
        "closest",
        "further",
      ]);
      expect(matches[0]!.similarity).toBeCloseTo(1);
      expect(matches[1]!.similarity).toBeCloseTo(0.6);

      const first = tools[0]!;
      const oldAttempt = {
        capabilityId: first.id,
        fingerprint: first.contentHash,
        metadata,
        updatedAt: timestamp,
      };
      const newAttempt = {
        ...oldAttempt,
        fingerprint: "b".repeat(64),
        updatedAt: new Date(timestamp.getTime() + 1),
      };
      await index.markPending(newAttempt);
      await index.saveEmbedding({ ...oldAttempt, embedding: vector(1, 0) });
      await index.markFailed(oldAttempt);
      expect(await index.getState(first.id)).toMatchObject({
        status: "pending",
        fingerprint: newAttempt.fingerprint,
      });
      await index.saveEmbedding({ ...newAttempt, embedding: vector(1, 0) });
      expect(await index.getState(first.id)).toMatchObject({ status: "ready" });

      await capabilityRepository.upsert({
        ...first,
        description: "Changed contract",
        contentHash: "c".repeat(64),
      });
      expect(await index.getState(first.id)).toMatchObject({
        status: "pending",
        fingerprint: null,
      });
      await database.db
        .update(providers)
        .set({ status: "archived" })
        .where(eq(providers.id, providerId));
      expect(
        (
          await index.searchByEmbedding(vector(1, 0), {
            limit: 100,
            minimumSimilarity: 0,
          })
        ).some((match) => match.provider.id === providerId),
      ).toBe(false);
    } finally {
      // Delete only this test's generated provider; its capabilities cascade.
      await database.db.delete(providers).where(eq(providers.id, providerId));
      await database.client.end({ timeout: 5 });
    }
  },
  30_000,
);
