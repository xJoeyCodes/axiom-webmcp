import {
  type CapabilityIndexRepository,
  type CapabilityIndexState,
  type CapabilitySearchCandidate,
  type CapabilitySearchOptions,
  type IndexableCapability,
  type MarkCapabilityIndexInput,
  type SaveCapabilityEmbeddingInput,
} from "@axiom/core";
import { and, asc, cosineDistance, eq, gte, sql } from "drizzle-orm";

import type { AxiomDatabase } from "../client.js";
import { mapCapabilityRow, mapProviderRow } from "../mappers.js";
import { capabilities, providers } from "../schema.js";

function stateFromRow(
  row: typeof capabilities.$inferSelect,
): CapabilityIndexState {
  return {
    capabilityId: row.id,
    status: row.embeddingStatus,
    fingerprint: row.embeddingFingerprint,
    provider: row.embeddingProvider ?? "",
    model: row.embeddingModel ?? "",
    dimensions: row.embeddingDimensions ?? 0,
    version: row.embeddingVersion ?? "",
    searchDocumentVersion: row.searchDocumentVersion ?? "",
    updatedAt: row.embeddingUpdatedAt,
  };
}

export class DrizzleCapabilityIndexRepository implements CapabilityIndexRepository {
  constructor(private readonly db: AxiomDatabase) {}

  async getState(capabilityId: string): Promise<CapabilityIndexState | null> {
    const [row] = await this.db
      .select()
      .from(capabilities)
      .where(eq(capabilities.id, capabilityId))
      .limit(1);
    return row ? stateFromRow(row) : null;
  }

  async listIndexable(limit = 10_000): Promise<readonly IndexableCapability[]> {
    const rows = await this.db
      .select({ capability: capabilities, provider: providers })
      .from(capabilities)
      .innerJoin(providers, eq(capabilities.providerId, providers.id))
      .where(
        and(eq(capabilities.status, "active"), eq(providers.status, "active")),
      )
      .orderBy(asc(providers.slug), asc(capabilities.name))
      .limit(limit);
    return rows.map((row) => ({
      capability: mapCapabilityRow(row.capability),
      provider: mapProviderRow(row.provider),
      indexState: stateFromRow(row.capability),
    }));
  }

  async markPending(input: MarkCapabilityIndexInput): Promise<void> {
    await this.db
      .update(capabilities)
      .set({
        embedding: null,
        embeddingStatus: "pending",
        embeddingProvider: input.metadata.provider,
        embeddingModel: input.metadata.model,
        embeddingDimensions: input.metadata.dimensions,
        embeddingVersion: input.metadata.version,
        searchDocumentVersion: input.metadata.searchDocumentVersion,
        embeddingFingerprint: input.fingerprint,
        embeddingUpdatedAt: input.updatedAt,
      })
      .where(eq(capabilities.id, input.capabilityId));
  }

  async markFailed(input: MarkCapabilityIndexInput): Promise<void> {
    await this.db
      .update(capabilities)
      .set({
        embedding: null,
        embeddingStatus: "failed",
        embeddingProvider: input.metadata.provider,
        embeddingModel: input.metadata.model,
        embeddingDimensions: input.metadata.dimensions,
        embeddingVersion: input.metadata.version,
        searchDocumentVersion: input.metadata.searchDocumentVersion,
        embeddingFingerprint: input.fingerprint,
        embeddingUpdatedAt: input.updatedAt,
      })
      .where(
        and(
          eq(capabilities.id, input.capabilityId),
          eq(capabilities.embeddingStatus, "pending"),
          eq(capabilities.embeddingFingerprint, input.fingerprint),
          eq(capabilities.embeddingUpdatedAt, input.updatedAt),
        ),
      );
  }

  async saveEmbedding(input: SaveCapabilityEmbeddingInput): Promise<void> {
    await this.db
      .update(capabilities)
      .set({
        embedding: [...input.embedding],
        embeddingStatus: "ready",
        embeddingProvider: input.metadata.provider,
        embeddingModel: input.metadata.model,
        embeddingDimensions: input.metadata.dimensions,
        embeddingVersion: input.metadata.version,
        searchDocumentVersion: input.metadata.searchDocumentVersion,
        embeddingFingerprint: input.fingerprint,
        embeddingUpdatedAt: input.updatedAt,
      })
      .where(
        and(
          eq(capabilities.id, input.capabilityId),
          eq(capabilities.embeddingStatus, "pending"),
          eq(capabilities.embeddingFingerprint, input.fingerprint),
          eq(capabilities.embeddingUpdatedAt, input.updatedAt),
        ),
      );
  }

  async searchByEmbedding(
    embedding: readonly number[],
    options: CapabilitySearchOptions,
  ): Promise<readonly CapabilitySearchCandidate[]> {
    const distance = cosineDistance(capabilities.embedding, [...embedding]);
    const similarity = sql<number>`1 - (${distance})`;
    const rows = await this.db
      .select({
        capability: capabilities,
        provider: providers,
        similarity,
      })
      .from(capabilities)
      .innerJoin(providers, eq(capabilities.providerId, providers.id))
      .where(
        and(
          eq(capabilities.embeddingStatus, "ready"),
          eq(capabilities.status, "active"),
          eq(providers.status, "active"),
          gte(similarity, options.minimumSimilarity),
        ),
      )
      .orderBy(asc(distance))
      .limit(options.limit);
    return rows.map((row) => ({
      capability: mapCapabilityRow(row.capability),
      provider: mapProviderRow(row.provider),
      similarity: Math.min(1, Math.max(0, Number(row.similarity))),
    }));
  }
}
