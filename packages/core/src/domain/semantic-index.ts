import type { Capability } from "./capability.js";
import type { Provider } from "./provider.js";

export type EmbeddingStatus = "pending" | "ready" | "failed";

export interface EmbeddingMetadata {
  readonly provider: string;
  readonly model: string;
  readonly dimensions: number;
  readonly version: string;
  readonly searchDocumentVersion: string;
}

export interface CapabilityIndexState extends EmbeddingMetadata {
  readonly capabilityId: string;
  readonly status: EmbeddingStatus;
  readonly fingerprint: string | null;
  readonly updatedAt: Date | null;
}

export interface IndexableCapability {
  readonly capability: Capability;
  readonly provider: Provider;
  readonly indexState: CapabilityIndexState;
}

export interface CapabilitySearchCandidate {
  readonly capability: Capability;
  readonly provider: Provider;
  readonly similarity: number;
}

export interface SaveCapabilityEmbeddingInput {
  readonly capabilityId: string;
  readonly embedding: readonly number[];
  readonly fingerprint: string;
  readonly metadata: EmbeddingMetadata;
  readonly updatedAt: Date;
}

export interface MarkCapabilityIndexInput {
  readonly capabilityId: string;
  readonly fingerprint: string;
  readonly metadata: EmbeddingMetadata;
  readonly updatedAt: Date;
}

export interface CapabilitySearchOptions {
  readonly limit: number;
  readonly minimumSimilarity: number;
}

export interface CapabilityIndexRepository {
  getState(capabilityId: string): Promise<CapabilityIndexState | null>;
  listIndexable(limit?: number): Promise<readonly IndexableCapability[]>;
  markPending(input: MarkCapabilityIndexInput): Promise<void>;
  markFailed(input: MarkCapabilityIndexInput): Promise<void>;
  saveEmbedding(input: SaveCapabilityEmbeddingInput): Promise<void>;
  searchByEmbedding(
    embedding: readonly number[],
    options: CapabilitySearchOptions,
  ): Promise<readonly CapabilitySearchCandidate[]>;
}
