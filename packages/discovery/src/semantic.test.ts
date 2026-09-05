import {
  ApplicationError,
  createCapabilityContentHash,
  type Capability,
  type CapabilityIndexRepository,
  type CapabilityIndexState,
  type CapabilityRepository,
  type CapabilitySearchCandidate,
  type CapabilitySearchOptions,
  type CapabilityStatus,
  type EmbeddingProvider,
  type IndexableCapability,
  type MarkCapabilityIndexInput,
  type Provider,
  type ProviderListOptions,
  type ProviderRepository,
  type SaveCapabilityEmbeddingInput,
} from "@axiom/core";
import { beforeEach, describe, expect, it } from "vitest";

import { DiscoveryService } from "./discovery-service.js";
import { FakeEmbeddingProvider } from "./embedding/fake-embedding-provider.js";
import { createIndexFingerprint } from "./index-fingerprint.js";
import { CapabilityIndexingService } from "./indexing-service.js";
import { rankAndGroupCandidates } from "./ranking.js";
import {
  CapabilitySearchDocumentBuilder,
  SEARCH_DOCUMENT_VERSION,
} from "./search-document.js";

const now = new Date("2026-09-04T10:00:00.000Z");

function provider(
  id: string,
  slug: string,
  name: string,
  description: string,
  verified = true,
): Provider {
  return {
    id,
    slug,
    name,
    domain: `${slug}.example`,
    canonicalUrl: `https://${slug}.example`,
    description,
    verificationStatus: verified ? "verified" : "unverified",
    status: "active",
    lastIndexedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function capability(
  id: string,
  providerId: string,
  name: string,
  description: string,
  inputs: Record<string, { type: "string"; description?: string }>,
): Capability {
  const contract = {
    name,
    description,
    inputSchema: { type: "object" as const, properties: inputs },
    outputSchema: { type: "object" as const },
    annotations: {
      readOnly:
        !name.startsWith("make_") &&
        !name.startsWith("reserve_") &&
        name !== "add_to_cart",
    },
  };
  return {
    id,
    providerId,
    ...contract,
    specVersion: "draft",
    source: "api",
    status: "active",
    contentHash: createCapabilityContentHash(contract),
    createdAt: now,
    updatedAt: now,
  };
}

class Providers implements ProviderRepository {
  readonly records = new Map<string, Provider>();
  async findById(id: string) {
    return [...this.records.values()].find((item) => item.id === id) ?? null;
  }
  async findBySlug(slug: string) {
    return this.records.get(slug) ?? null;
  }
  async findByDomain(domain: string) {
    return (
      [...this.records.values()].find((item) => item.domain === domain) ?? null
    );
  }
  async list(options: ProviderListOptions) {
    const values = [...this.records.values()];
    return {
      items: values.slice(options.offset, options.offset + options.limit),
      total: values.length,
    };
  }
  async create(item: Provider) {
    this.records.set(item.slug, item);
    return item;
  }
  async update(item: Provider) {
    this.records.set(item.slug, item);
    return item;
  }
  async upsert(item: Provider) {
    this.records.set(item.slug, item);
    return item;
  }
}

class Capabilities implements CapabilityRepository {
  readonly records = new Map<string, Capability>();
  async findById(id: string) {
    return this.records.get(id) ?? null;
  }
  async findByProvider(providerId: string, status?: CapabilityStatus) {
    return [...this.records.values()].filter(
      (item) =>
        item.providerId === providerId && (!status || item.status === status),
    );
  }
  async findByProviderAndName(providerId: string, name: string) {
    return (
      [...this.records.values()].find(
        (item) => item.providerId === providerId && item.name === name,
      ) ?? null
    );
  }
  async create(item: Capability) {
    this.records.set(item.id, item);
    return item;
  }
  async upsert(item: Capability) {
    this.records.set(item.id, item);
    return item;
  }
  async deleteMissingForProvider() {
    return 0;
  }
}

interface StoredIndex {
  state: CapabilityIndexState;
  embedding: readonly number[] | null;
}

function cosine(left: readonly number[], right: readonly number[]): number {
  let dot = 0;
  let aMagnitude = 0;
  let bMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    dot += a * b;
    aMagnitude += a * a;
    bMagnitude += b * b;
  }
  const divisor = Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude);
  return divisor === 0 ? 0 : dot / divisor;
}

class SearchIndex implements CapabilityIndexRepository {
  readonly records = new Map<string, StoredIndex>();
  constructor(
    private readonly providers: Providers,
    private readonly capabilities: Capabilities,
  ) {}
  async getState(id: string) {
    return this.records.get(id)?.state ?? null;
  }
  async listIndexable(limit = 100): Promise<readonly IndexableCapability[]> {
    const result: IndexableCapability[] = [];
    for (const item of this.capabilities.records.values()) {
      const owner = await this.providers.findById(item.providerId);
      if (!owner || item.status !== "active" || owner.status !== "active")
        continue;
      result.push({
        capability: item,
        provider: owner,
        indexState: this.records.get(item.id)?.state ?? {
          capabilityId: item.id,
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
    return result.slice(0, limit);
  }
  async markPending(input: MarkCapabilityIndexInput) {
    this.setState(input, "pending", null);
  }
  async markFailed(input: MarkCapabilityIndexInput) {
    this.setState(input, "failed", null);
  }
  async saveEmbedding(input: SaveCapabilityEmbeddingInput) {
    this.setState(input, "ready", input.embedding);
  }
  private setState(
    input: MarkCapabilityIndexInput,
    status: CapabilityIndexState["status"],
    embedding: readonly number[] | null,
  ) {
    this.records.set(input.capabilityId, {
      state: {
        capabilityId: input.capabilityId,
        status,
        fingerprint: input.fingerprint,
        ...input.metadata,
        updatedAt: input.updatedAt,
      },
      embedding,
    });
  }
  async searchByEmbedding(
    embedding: readonly number[],
    options: CapabilitySearchOptions,
  ): Promise<readonly CapabilitySearchCandidate[]> {
    const candidates: CapabilitySearchCandidate[] = [];
    for (const [id, stored] of this.records) {
      if (stored.state.status !== "ready" || !stored.embedding) continue;
      const item = await this.capabilities.findById(id);
      if (!item || item.status !== "active") continue;
      const owner = await this.providers.findById(item.providerId);
      if (!owner || owner.status !== "active") continue;
      const similarity = cosine(embedding, stored.embedding);
      if (similarity >= options.minimumSimilarity) {
        candidates.push({ capability: item, provider: owner, similarity });
      }
    }
    return candidates
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, options.limit);
  }
}

function createFixture() {
  const providers = new Providers();
  const capabilities = new Capabilities();
  const fixtures = [
    provider(
      "11111111-1111-4111-8111-111111111111",
      "atlas-dining",
      "Atlas Dining",
      "Restaurant discovery, table availability, and dining reservations.",
    ),
    provider(
      "22222222-2222-4222-8222-222222222222",
      "orbit-travel",
      "Orbit Travel",
      "Flight search, airfare comparison, and plane reservations.",
    ),
    provider(
      "33333333-3333-4333-8333-333333333333",
      "pulse-events",
      "Pulse Events",
      "Concert, event, venue, and ticket discovery.",
    ),
    provider(
      "44444444-4444-4444-8444-444444444444",
      "northstar-commerce",
      "Northstar Commerce",
      "Product catalog and shopping cart operations.",
      false,
    ),
  ];
  fixtures.forEach((item) => providers.records.set(item.slug, item));
  const tools = [
    capability(
      "a1111111-1111-4111-8111-111111111111",
      fixtures[0]!.id,
      "make_reservation",
      "Reserve a restaurant table for dinner.",
      { restaurant: { type: "string" }, date: { type: "string" } },
    ),
    capability(
      "a2222222-2222-4222-8222-222222222222",
      fixtures[0]!.id,
      "check_availability",
      "Check if a restaurant has an available table.",
      { restaurant: { type: "string" } },
    ),
    capability(
      "b1111111-1111-4111-8111-111111111111",
      fixtures[1]!.id,
      "search_flights",
      "Find airline flights between airports.",
      { origin: { type: "string" }, destination: { type: "string" } },
    ),
    capability(
      "b2222222-2222-4222-8222-222222222222",
      fixtures[1]!.id,
      "compare_flights",
      "Compare plane tickets and airfare.",
      { flights: { type: "string" } },
    ),
    capability(
      "c1111111-1111-4111-8111-111111111111",
      fixtures[2]!.id,
      "search_events",
      "Find concerts and events to attend.",
      { location: { type: "string" } },
    ),
    capability(
      "c2222222-2222-4222-8222-222222222222",
      fixtures[2]!.id,
      "reserve_ticket",
      "Reserve tickets for a concert or event.",
      { event: { type: "string" } },
    ),
    capability(
      "d1111111-1111-4111-8111-111111111111",
      fixtures[3]!.id,
      "search_products",
      "Search products in the shopping catalog.",
      { query: { type: "string" } },
    ),
    capability(
      "d2222222-2222-4222-8222-222222222222",
      fixtures[3]!.id,
      "add_to_cart",
      "Put an item into a shopping basket.",
      { product: { type: "string", description: "Product item identifier." } },
    ),
  ];
  tools.forEach((item) => capabilities.records.set(item.id, item));
  return { providers, capabilities, fixtures, tools };
}

describe("semantic search documents and fingerprints", () => {
  it("builds deterministic semantic text without IDs, hashes, or raw schema noise", () => {
    const fixture = createFixture();
    const builder = new CapabilitySearchDocumentBuilder();
    const document = builder.build(fixture.fixtures[3]!, fixture.tools[7]!);
    expect(builder.build(fixture.fixtures[3]!, fixture.tools[7]!)).toBe(
      document,
    );
    expect(document).toContain(
      "Inputs: product; product: Product item identifier.",
    );
    expect(document).not.toContain(fixture.tools[7]!.id);
    expect(document).not.toContain("contentHash");
    expect(document).not.toContain('"type":"object"');
  });

  it("keeps documents stable across schema property ordering and bounds document length", () => {
    const fixture = createFixture();
    const builder = new CapabilitySearchDocumentBuilder();
    const tool = fixture.tools[0]!;
    const left = {
      ...tool,
      inputSchema: {
        type: "object" as const,
        properties: {
          z: { type: "string" as const },
          a: { type: "string" as const },
        },
      },
    };
    const right = {
      ...left,
      inputSchema: {
        ...left.inputSchema,
        properties: {
          a: { type: "string" as const },
          z: { type: "string" as const },
        },
      },
    };
    expect(builder.build(fixture.fixtures[0]!, left)).toBe(
      builder.build(fixture.fixtures[0]!, right),
    );
    expect(
      builder.build(fixture.fixtures[0]!, {
        ...tool,
        description: "x".repeat(20_000),
      }).length,
    ).toBeLessThanOrEqual(6_000);
  });

  it("changes fingerprints only when semantic inputs or index configuration change", () => {
    const fixture = createFixture();
    const metadata = {
      provider: "fake",
      model: "model-a",
      dimensions: 1_024,
      version: "1",
      searchDocumentVersion: SEARCH_DOCUMENT_VERSION,
    };
    const base = createIndexFingerprint(
      fixture.fixtures[0]!,
      fixture.tools[0]!,
      metadata,
    );
    expect(
      createIndexFingerprint(fixture.fixtures[0]!, fixture.tools[0]!, metadata),
    ).toBe(base);
    expect(
      createIndexFingerprint(
        fixture.fixtures[0]!,
        { ...fixture.tools[0]!, contentHash: "b".repeat(64) },
        metadata,
      ),
    ).not.toBe(base);
    expect(
      createIndexFingerprint(fixture.fixtures[0]!, fixture.tools[0]!, {
        ...metadata,
        model: "model-b",
      }),
    ).not.toBe(base);
    expect(
      createIndexFingerprint(fixture.fixtures[0]!, fixture.tools[0]!, {
        ...metadata,
        searchDocumentVersion: "2",
      }),
    ).not.toBe(base);
  });
});

describe("capability indexing and discovery", () => {
  let fixture: ReturnType<typeof createFixture>;
  let index: SearchIndex;
  let embeddings: FakeEmbeddingProvider;
  let indexing: CapabilityIndexingService;

  beforeEach(() => {
    fixture = createFixture();
    index = new SearchIndex(fixture.providers, fixture.capabilities);
    embeddings = new FakeEmbeddingProvider();
    indexing = new CapabilityIndexingService(
      fixture.providers,
      fixture.capabilities,
      index,
      embeddings,
      undefined,
      () => now,
    );
  });

  it("indexes in a batch, skips ready fingerprints, and excludes non-ready records", async () => {
    const first = await indexing.indexCapabilities(
      fixture.tools.map((item) => item.id),
    );
    const second = await indexing.indexCapabilities(
      fixture.tools.map((item) => item.id),
    );
    expect(first).toEqual({ ready: 8, failed: 0, unchanged: 0 });
    expect(second).toEqual({ ready: 0, failed: 0, unchanged: 8 });
    expect(
      (
        await index.searchByEmbedding(await embeddings.embed("dinner"), {
          limit: 10,
          minimumSimilarity: 0,
        })
      ).length,
    ).toBe(8);
    await index.markFailed({
      capabilityId: fixture.tools[0]!.id,
      fingerprint: "a".repeat(64),
      metadata: {
        provider: embeddings.provider,
        model: embeddings.model,
        dimensions: embeddings.dimensions,
        version: embeddings.version,
        searchDocumentVersion: SEARCH_DOCUMENT_VERSION,
      },
      updatedAt: now,
    });
    expect(
      (
        await index.searchByEmbedding(await embeddings.embed("dinner"), {
          limit: 10,
          minimumSimilarity: 0,
        })
      ).length,
    ).toBe(7);
  });

  it("excludes stale provider metadata until rebuilding and rejects a different index model", async () => {
    await indexing.rebuild();
    const owner = fixture.fixtures[0]!;
    fixture.providers.records.set(owner.slug, {
      ...owner,
      description: "Updated restaurant reservations and dining.",
    });
    const discovery = new DiscoveryService(embeddings, index);
    expect(
      (await discovery.discover({ intent: "dinner", limit: 4 })).results.some(
        (result) => result.provider.id === owner.id,
      ),
    ).toBe(false);
    const rebuilt = await indexing.rebuild();
    expect(rebuilt).toEqual({ ready: 2, failed: 0, unchanged: 6 });
    expect(
      (await discovery.discover({ intent: "dinner", limit: 4 })).results[0]
        ?.provider.id,
    ).toBe(owner.id);
    const mismatched: EmbeddingProvider = {
      provider: embeddings.provider,
      model: "changed-model",
      dimensions: embeddings.dimensions,
      version: embeddings.version,
      embed: (text) => embeddings.embed(text),
      embedMany: (texts) => embeddings.embedMany(texts),
    };
    expect(
      (
        await new DiscoveryService(mismatched, index).discover({
          intent: "dinner",
          limit: 4,
        })
      ).results,
    ).toEqual([]);
  });

  it("reindexes changed capability content without regenerating unrelated embeddings", async () => {
    await indexing.rebuild();
    const tool = fixture.tools[0]!;
    const changed = {
      ...tool,
      description: "Reserve an outdoor restaurant table.",
    };
    fixture.capabilities.records.set(tool.id, {
      ...changed,
      contentHash: createCapabilityContentHash(changed),
    });
    expect(await indexing.rebuild()).toEqual({
      ready: 1,
      failed: 0,
      unchanged: 7,
    });
  });

  it("marks indexing failed for provider errors and incorrect dimensions", async () => {
    const failing: EmbeddingProvider = {
      provider: "test",
      model: "failure",
      dimensions: 3,
      version: "1",
      embed: async () => {
        throw new ApplicationError("SERVICE_UNAVAILABLE", "Unavailable");
      },
      embedMany: async () => {
        throw new ApplicationError("SERVICE_UNAVAILABLE", "Unavailable");
      },
    };
    const wrongDimensions: EmbeddingProvider = {
      ...failing,
      model: "wrong-dimensions",
      embed: async () => [1, 0],
      embedMany: async (texts) => texts.map(() => [1, 0]),
    };
    const failed = await new CapabilityIndexingService(
      fixture.providers,
      fixture.capabilities,
      index,
      failing,
    ).indexCapabilities([fixture.tools[0]!.id]);
    const invalid = await new CapabilityIndexingService(
      fixture.providers,
      fixture.capabilities,
      index,
      wrongDimensions,
    ).indexCapabilities([fixture.tools[1]!.id]);
    expect(failed.failed).toBe(1);
    expect(invalid.failed).toBe(1);
    expect((await index.getState(fixture.tools[0]!.id))?.status).toBe("failed");
  });

  it.each([
    ["reserve dinner", "atlas-dining"],
    ["book a restaurant", "atlas-dining"],
    ["find flights", "orbit-travel"],
    ["compare plane tickets", "orbit-travel"],
    ["buy concert tickets", "pulse-events"],
    ["find something to attend", "pulse-events"],
    ["search products", "northstar-commerce"],
    ["put an item in my shopping basket", "northstar-commerce"],
  ])("ranks %s with %s first", async (intent, expectedProvider) => {
    await indexing.indexCapabilities(fixture.tools.map((item) => item.id));
    const result = await new DiscoveryService(embeddings, index).discover({
      intent,
      limit: 4,
    });
    expect(result.results[0]?.provider.slug).toBe(expectedProvider);
  });

  it("returns no results for unrelated intent and propagates embedding failures", async () => {
    await indexing.indexCapabilities(fixture.tools.map((item) => item.id));
    const discovery = new DiscoveryService(embeddings, index);
    expect(
      (await discovery.discover({ intent: "quantum banana", limit: 4 }))
        .results,
    ).toEqual([]);
    const unavailable = new DiscoveryService(
      {
        provider: "test",
        model: "failure",
        dimensions: 3,
        version: "1",
        embed: async () => {
          throw new ApplicationError("SERVICE_UNAVAILABLE", "Unavailable");
        },
        embedMany: async () => [],
      },
      index,
    );
    await expect(
      unavailable.discover({ intent: "dinner", limit: 4 }),
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });
});

describe("ranking", () => {
  it("keeps semantic relevance dominant while applying modest lexical and verification boosts", () => {
    const fixture = createFixture();
    const candidates: CapabilitySearchCandidate[] = [
      {
        provider: fixture.fixtures[0]!,
        capability: fixture.tools[0]!,
        similarity: 0.8,
      },
      {
        provider: fixture.fixtures[3]!,
        capability: fixture.tools[6]!,
        similarity: 0.95,
      },
    ];
    const ranked = rankAndGroupCandidates(
      "make reservation",
      candidates,
      10,
      0,
    );
    expect(ranked[0]?.provider.slug).toBe("northstar-commerce");
    expect(ranked).toHaveLength(2);
  });
});
