import {
  ApplicationError,
  type CapabilityIndexRepository,
  type EmbeddingProvider,
} from "@axiom/core";

import { rankAndGroupCandidates, type RankedProvider } from "./ranking.js";
import { createIndexFingerprint } from "./index-fingerprint.js";
import { SEARCH_DOCUMENT_VERSION } from "./search-document.js";

export interface DiscoverCapabilitiesInput {
  readonly intent: string;
  readonly limit: number;
  readonly minimumScore?: number | undefined;
}

export interface DiscoveryServiceResult {
  readonly intent: string;
  readonly results: readonly RankedProvider[];
  readonly candidateCount: number;
}

function normalizeIntent(intent: string): string {
  return intent.trim().replace(/\s+/gu, " ");
}

export class DiscoveryService {
  constructor(
    private readonly embeddings: EmbeddingProvider,
    private readonly search: CapabilityIndexRepository,
  ) {}

  async discover(
    input: DiscoverCapabilitiesInput,
  ): Promise<DiscoveryServiceResult> {
    const intent = normalizeIntent(input.intent);
    if (!intent) {
      throw new ApplicationError(
        "VALIDATION_ERROR",
        "Discovery intent cannot be empty.",
      );
    }
    const embedding = await this.embeddings.embed(intent);
    if (
      embedding.length !== this.embeddings.dimensions ||
      !embedding.every((value) => Number.isFinite(value))
    ) {
      throw new ApplicationError(
        "SERVICE_UNAVAILABLE",
        "The embedding provider returned an invalid vector.",
      );
    }
    const minimumScore = input.minimumScore ?? 0.2;
    const candidates = await this.search.searchByEmbedding(embedding, {
      limit: Math.min(100, Math.max(20, input.limit * 5)),
      minimumSimilarity: Math.max(0, minimumScore - 0.15),
    });
    // Recheck metadata PATCHes and index version changes before routing agents.
    const current = await Promise.all(
      candidates.map(async (candidate) => {
        const state = await this.search.getState(candidate.capability.id);
        const fingerprint = createIndexFingerprint(
          candidate.provider,
          candidate.capability,
          {
            provider: this.embeddings.provider,
            model: this.embeddings.model,
            dimensions: this.embeddings.dimensions,
            version: this.embeddings.version,
            searchDocumentVersion: SEARCH_DOCUMENT_VERSION,
          },
        );
        return state?.status === "ready" && state.fingerprint === fingerprint;
      }),
    );
    return {
      intent,
      candidateCount: candidates.length,
      results: rankAndGroupCandidates(
        intent,
        candidates.filter((_, index) => current[index]),
        input.limit,
        minimumScore,
      ),
    };
  }
}
