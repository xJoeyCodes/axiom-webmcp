import {
  ApplicationError,
  type Capability,
  type CapabilityPersistenceOptions,
  type CapabilityRepository,
  type CapabilityStatus,
  type Provider,
  type ProviderListOptions,
  type ProviderRepository,
  type RegistryRepositories,
  type RegistryUnitOfWork,
} from "@axiom/core";
import { beforeEach, describe, expect, it } from "vitest";

import { ApiContractAdapter } from "./adapters/api-contract-adapter.js";
import { ManifestAdapter } from "./adapters/manifest-adapter.js";
import { createPublicationPlan } from "./diff/publication-diff.js";
import { northstarCommercePublication } from "./fixtures/northstar-commerce.js";
import { PublicationInspectionService } from "./services/publication-inspection-service.js";
import { PublicationService } from "./services/publication-service.js";

class MemoryProviders implements ProviderRepository {
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
    const items = [...this.records.values()].slice(
      options.offset,
      options.offset + options.limit,
    );
    return { items, total: this.records.size };
  }
  async create(provider: Provider) {
    if (await this.findByDomain(provider.domain)) {
      throw new ApplicationError("CONFLICT", "Provider exists.");
    }
    this.records.set(provider.slug, provider);
    return provider;
  }
  async update(provider: Provider) {
    this.records.set(provider.slug, provider);
    return provider;
  }
  async upsert(provider: Provider) {
    this.records.set(provider.slug, provider);
    return provider;
  }
}

class MemoryCapabilities implements CapabilityRepository {
  readonly records = new Map<string, Capability>();
  readonly rawContracts = new Map<string, unknown>();
  failOnName: string | null = null;

  key(providerId: string, name: string) {
    return `${providerId}:${name}`;
  }
  async findById(id: string) {
    return [...this.records.values()].find((item) => item.id === id) ?? null;
  }
  async findByProvider(providerId: string, status?: CapabilityStatus) {
    return [...this.records.values()]
      .filter(
        (item) =>
          item.providerId === providerId && (!status || item.status === status),
      )
      .sort((left, right) => left.name.localeCompare(right.name));
  }
  async findByProviderAndName(providerId: string, name: string) {
    return this.records.get(this.key(providerId, name)) ?? null;
  }
  async create(capability: Capability, options?: CapabilityPersistenceOptions) {
    if (capability.name === this.failOnName) throw new Error("write failed");
    const key = this.key(capability.providerId, capability.name);
    if (this.records.has(key)) {
      throw new ApplicationError("CONFLICT", "Capability exists.");
    }
    this.records.set(key, capability);
    if (options?.rawContract !== undefined)
      this.rawContracts.set(key, options.rawContract);
    return capability;
  }
  async upsert(capability: Capability, options?: CapabilityPersistenceOptions) {
    if (capability.name === this.failOnName) throw new Error("write failed");
    const key = this.key(capability.providerId, capability.name);
    this.records.set(key, capability);
    if (options?.rawContract !== undefined)
      this.rawContracts.set(key, options.rawContract);
    return capability;
  }
  async deleteMissingForProvider(
    providerId: string,
    retainedNames: readonly string[],
  ) {
    let count = 0;
    for (const [key, item] of this.records) {
      if (
        item.providerId === providerId &&
        !retainedNames.includes(item.name)
      ) {
        this.records.delete(key);
        count += 1;
      }
    }
    return count;
  }
}

class MemoryUnitOfWork implements RegistryUnitOfWork {
  constructor(
    private readonly providers: MemoryProviders,
    private readonly capabilities: MemoryCapabilities,
  ) {}

  async execute<T>(
    operation: (repositories: RegistryRepositories) => Promise<T>,
  ): Promise<T> {
    const providers = new Map(this.providers.records);
    const capabilities = new Map(this.capabilities.records);
    const rawContracts = new Map(this.capabilities.rawContracts);
    try {
      return await operation({
        providers: this.providers,
        capabilities: this.capabilities,
      });
    } catch (error) {
      this.providers.records.clear();
      this.capabilities.records.clear();
      this.capabilities.rawContracts.clear();
      providers.forEach((value, key) => this.providers.records.set(key, value));
      capabilities.forEach((value, key) =>
        this.capabilities.records.set(key, value),
      );
      rawContracts.forEach((value, key) =>
        this.capabilities.rawContracts.set(key, value),
      );
      throw error;
    }
  }
}

describe("publication pipeline", () => {
  let providers: MemoryProviders;
  let capabilities: MemoryCapabilities;
  let inspection: PublicationInspectionService;
  let publishing: PublicationService;

  beforeEach(() => {
    providers = new MemoryProviders();
    capabilities = new MemoryCapabilities();
    inspection = new PublicationInspectionService(
      [new ApiContractAdapter(), new ManifestAdapter()],
      providers,
      capabilities,
    );
    publishing = new PublicationService(
      inspection,
      new MemoryUnitOfWork(providers, capabilities),
    );
  });

  it("normalizes domains and hashes reordered schemas identically", () => {
    const adapter = new ApiContractAdapter();
    const first = adapter.ingest(northstarCommercePublication);
    const reordered = adapter.ingest({
      ...northstarCommercePublication,
      provider: {
        ...northstarCommercePublication.provider,
        domain: "https://www.NORTHSTAR-COMMERCE.example/path",
      },
      capabilities: [
        {
          ...northstarCommercePublication.capabilities[0],
          inputSchema: {
            properties: {
              category: { type: "string" },
              query: { type: "string" },
            },
            type: "object",
            required: ["query"],
          },
        },
        ...northstarCommercePublication.capabilities.slice(1),
      ],
    });

    expect(reordered.provider.domain).toBe("northstar-commerce.example");
    expect(reordered.capabilities[0]?.contentHash).toBe(
      first.capabilities[0]?.contentHash,
    );
    expect(reordered.capabilities[0]?.inputSchema).toMatchObject({
      properties: { category: { type: "string" } },
    });
  });

  it("rejects duplicate names and reports useful non-blocking warnings", async () => {
    await expect(
      inspection.inspect({
        ...northstarCommercePublication,
        capabilities: [
          northstarCommercePublication.capabilities[0],
          northstarCommercePublication.capabilities[0],
        ],
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    const result = await inspection.inspect({
      ...northstarCommercePublication,
      capabilities: [
        {
          name: "quick_action",
          description: "Short.",
          inputSchema: { type: "object" },
          annotations: { readOnly: false },
        },
      ],
    });
    expect(result.warnings.map((warning) => warning.code)).toEqual([
      "SHORT_DESCRIPTION",
      "MISSING_OUTPUT_SCHEMA",
      "MUTATION_ANNOTATIONS_MISSING",
    ]);
  });

  it("inspects without persistence and plans a new provider deterministically", async () => {
    const result = await inspection.inspect(northstarCommercePublication);
    expect(result.plan.providerAction).toBe("create");
    expect(result.plan.summary).toEqual({
      total: 4,
      create: 4,
      update: 0,
      unchanged: 0,
      remove: 0,
    });
    expect(providers.records.size).toBe(0);
    expect(capabilities.records.size).toBe(0);
  });

  it("publishes atomically and is idempotent on repeat", async () => {
    const first = await publishing.publish(northstarCommercePublication);
    const second = await publishing.publish(northstarCommercePublication);

    expect(first.plan.summary.create).toBe(4);
    expect(second.plan.summary.unchanged).toBe(4);
    expect(providers.records.size).toBe(1);
    expect(capabilities.records.size).toBe(4);
    expect(capabilities.rawContracts.size).toBe(4);
  });

  it("plans one update and one create while retaining omitted capabilities in merge mode", async () => {
    const first = await publishing.publish(northstarCommercePublication);
    const existing = await capabilities.findByProvider(first.provider.id);
    const incoming = inspection.normalize({
      ...northstarCommercePublication,
      capabilities: [
        {
          ...northstarCommercePublication.capabilities[0],
          description:
            "Search and rank the product catalog using structured filters.",
        },
        {
          name: "compare_products",
          description:
            "Compare selected products using current catalog attributes.",
          inputSchema: { type: "object" },
          outputSchema: { type: "object" },
          annotations: { readOnly: true },
        },
      ],
    });
    const plan = createPublicationPlan(incoming, first.provider, existing);

    expect(plan.summary).toMatchObject({ create: 1, update: 1, remove: 0 });
    await publishing.publish({
      ...northstarCommercePublication,
      capabilities: [
        {
          ...northstarCommercePublication.capabilities[0],
          description:
            "Search and rank the product catalog using structured filters.",
        },
        {
          name: "compare_products",
          description:
            "Compare selected products using current catalog attributes.",
          inputSchema: { type: "object" },
          outputSchema: { type: "object" },
          annotations: { readOnly: true },
        },
      ],
    });
    expect(await capabilities.findByProvider(first.provider.id)).toHaveLength(
      5,
    );
  });

  it("rolls back provider and capability writes when a write fails", async () => {
    capabilities.failOnName = "get_product";
    await expect(
      publishing.publish(northstarCommercePublication),
    ).rejects.toThrow("write failed");
    expect(providers.records.size).toBe(0);
    expect(capabilities.records.size).toBe(0);
  });
});
