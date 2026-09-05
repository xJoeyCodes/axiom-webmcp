import {
  type CapabilityIndexRepository,
  type CapabilityRepository,
  type EmbeddingMetadata,
  type EmbeddingProvider,
  type ProviderRepository,
} from "@axiom/core";

import { createIndexFingerprint } from "./index-fingerprint.js";
import { CapabilitySearchDocumentBuilder } from "./search-document.js";

export type CapabilityIndexingOutcome = "ready" | "failed" | "unchanged";

export interface CapabilityIndexingResult {
  readonly capabilityId: string;
  readonly outcome: CapabilityIndexingOutcome;
}

export interface CapabilityIndexingSummary {
  readonly ready: number;
  readonly failed: number;
  readonly unchanged: number;
}

interface PreparedCapability {
  readonly capabilityId: string;
  readonly document: string;
  readonly fingerprint: string;
}

function isValidEmbedding(
  embedding: readonly number[],
  dimensions: number,
): boolean {
  return (
    embedding.length === dimensions &&
    embedding.every((value) => Number.isFinite(value))
  );
}

export class CapabilityIndexingService {
  private readonly metadata: EmbeddingMetadata;

  constructor(
    private readonly providers: ProviderRepository,
    private readonly capabilities: CapabilityRepository,
    private readonly index: CapabilityIndexRepository,
    private readonly embeddings: EmbeddingProvider,
    private readonly documents = new CapabilitySearchDocumentBuilder(),
    private readonly now: () => Date = () => new Date(),
  ) {
    this.metadata = {
      provider: embeddings.provider,
      model: embeddings.model,
      dimensions: embeddings.dimensions,
      version: embeddings.version,
      searchDocumentVersion: documents.version,
    };
  }

  async indexCapabilities(
    capabilityIds: readonly string[],
  ): Promise<CapabilityIndexingSummary> {
    const uniqueIds = [...new Set(capabilityIds)];
    // Keep rebuilds within the same modest batch size as small publications.
    if (uniqueIds.length > 32) {
      const total = { ready: 0, failed: 0, unchanged: 0 };
      for (let offset = 0; offset < uniqueIds.length; offset += 32) {
        const batch = await this.indexCapabilities(
          uniqueIds.slice(offset, offset + 32),
        );
        total.ready += batch.ready;
        total.failed += batch.failed;
        total.unchanged += batch.unchanged;
      }
      return total;
    }
    const results: CapabilityIndexingResult[] = [];
    const prepared: PreparedCapability[] = [];

    for (const capabilityId of uniqueIds) {
      const capability = await this.capabilities.findById(capabilityId);
      if (!capability || capability.status !== "active") {
        results.push({ capabilityId, outcome: "failed" });
        continue;
      }
      const provider = await this.providers.findById(capability.providerId);
      if (!provider || provider.status !== "active") {
        results.push({ capabilityId, outcome: "failed" });
        continue;
      }
      const fingerprint = createIndexFingerprint(
        provider,
        capability,
        this.metadata,
      );
      const state = await this.index.getState(capabilityId);
      if (state?.status === "ready" && state.fingerprint === fingerprint) {
        results.push({ capabilityId, outcome: "unchanged" });
        continue;
      }
      prepared.push({
        capabilityId,
        fingerprint,
        document: this.documents.build(provider, capability),
      });
    }

    const timestamp = this.now();
    for (const item of prepared) {
      await this.index.markPending({
        capabilityId: item.capabilityId,
        fingerprint: item.fingerprint,
        metadata: this.metadata,
        updatedAt: timestamp,
      });
    }

    if (prepared.length > 0) {
      try {
        const vectors = await this.embeddings.embedMany(
          prepared.map((item) => item.document),
        );
        if (vectors.length !== prepared.length) {
          throw new Error("Embedding batch length mismatch.");
        }
        for (const [index, item] of prepared.entries()) {
          const embedding = vectors[index];
          if (
            !embedding ||
            !isValidEmbedding(embedding, this.embeddings.dimensions)
          ) {
            throw new Error("Embedding dimension mismatch.");
          }
          await this.index.saveEmbedding({
            capabilityId: item.capabilityId,
            embedding,
            fingerprint: item.fingerprint,
            metadata: this.metadata,
            updatedAt: timestamp,
          });
          results.push({ capabilityId: item.capabilityId, outcome: "ready" });
        }
      } catch {
        const alreadyReady = new Set(
          results
            .filter((result) => result.outcome === "ready")
            .map((result) => result.capabilityId),
        );
        for (const item of prepared) {
          if (alreadyReady.has(item.capabilityId)) continue;
          await this.index.markFailed({
            capabilityId: item.capabilityId,
            fingerprint: item.fingerprint,
            metadata: this.metadata,
            updatedAt: timestamp,
          });
          results.push({ capabilityId: item.capabilityId, outcome: "failed" });
        }
      }
    }

    const count = (outcome: CapabilityIndexingOutcome) =>
      results.filter((result) => result.outcome === outcome).length;
    return {
      ready: count("ready"),
      failed: count("failed"),
      unchanged: count("unchanged"),
    };
  }

  async rebuild(limit?: number): Promise<CapabilityIndexingSummary> {
    const records = await this.index.listIndexable(limit);
    return this.indexCapabilities(
      records.map((record) => record.capability.id),
    );
  }
}
