import {
  type CapabilityIndexRepository,
  type CapabilityIndexState,
  type CapabilityRepository,
  type CapabilitySearchCandidate,
  type CapabilitySearchOptions,
  type IndexableCapability,
  type MarkCapabilityIndexInput,
  type ProviderRepository,
  type SaveCapabilityEmbeddingInput,
} from "@axiom/core";

interface StoredIndex {
  state: CapabilityIndexState;
  embedding: readonly number[] | null;
}

function cosine(left: readonly number[], right: readonly number[]): number {
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    dot += a * b;
    leftMagnitude += a * a;
    rightMagnitude += b * b;
  }
  const divisor = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return divisor === 0 ? 0 : dot / divisor;
}

export class MemoryCapabilityIndexRepository implements CapabilityIndexRepository {
  readonly records = new Map<string, StoredIndex>();

  constructor(
    private readonly providers: ProviderRepository,
    private readonly capabilities: CapabilityRepository,
  ) {}

  async getState(capabilityId: string) {
    return this.records.get(capabilityId)?.state ?? null;
  }

  async listIndexable(limit = 10_000): Promise<readonly IndexableCapability[]> {
    const page = await this.providers.list({ limit, offset: 0 });
    const result: IndexableCapability[] = [];
    for (const provider of page.items) {
      const capabilities = await this.capabilities.findByProvider(
        provider.id,
        "active",
      );
      for (const capability of capabilities) {
        result.push({
          provider,
          capability,
          indexState: this.records.get(capability.id)?.state ?? {
            capabilityId: capability.id,
            status: "pending",
            fingerprint: null,
            provider: "",
            model: "",
            dimensions: 0,
            version: "",
            searchDocumentVersion: "",
            updatedAt: null,
          },
        });
      }
    }
    return result.slice(0, limit);
  }

  async markPending(input: MarkCapabilityIndexInput): Promise<void> {
    this.records.set(input.capabilityId, {
      state: {
        capabilityId: input.capabilityId,
        status: "pending",
        fingerprint: input.fingerprint,
        ...input.metadata,
        updatedAt: input.updatedAt,
      },
      embedding: null,
    });
  }

  async markFailed(input: MarkCapabilityIndexInput): Promise<void> {
    this.records.set(input.capabilityId, {
      state: {
        capabilityId: input.capabilityId,
        status: "failed",
        fingerprint: input.fingerprint,
        ...input.metadata,
        updatedAt: input.updatedAt,
      },
      embedding: null,
    });
  }

  async saveEmbedding(input: SaveCapabilityEmbeddingInput): Promise<void> {
    this.records.set(input.capabilityId, {
      state: {
        capabilityId: input.capabilityId,
        status: "ready",
        fingerprint: input.fingerprint,
        ...input.metadata,
        updatedAt: input.updatedAt,
      },
      embedding: input.embedding,
    });
  }

  async searchByEmbedding(
    embedding: readonly number[],
    options: CapabilitySearchOptions,
  ): Promise<readonly CapabilitySearchCandidate[]> {
    const candidates: CapabilitySearchCandidate[] = [];
    for (const [capabilityId, record] of this.records) {
      if (record.state.status !== "ready" || !record.embedding) continue;
      const capability = await this.capabilities.findById(capabilityId);
      if (!capability || capability.status !== "active") continue;
      const provider = await this.providers.findById(capability.providerId);
      if (!provider || provider.status !== "active") continue;
      const similarity = cosine(embedding, record.embedding);
      if (similarity >= options.minimumSimilarity) {
        candidates.push({ provider, capability, similarity });
      }
    }
    return candidates
      .sort(
        (left, right) =>
          right.similarity - left.similarity ||
          left.capability.name.localeCompare(right.capability.name),
      )
      .slice(0, options.limit);
  }
}
