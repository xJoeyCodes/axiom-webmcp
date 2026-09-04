import {
  ApplicationError,
  type Capability,
  type CapabilityRepository,
  type CapabilityStatus,
  type Provider,
  type ProviderListOptions,
  type ProviderPage,
  type ProviderRepository,
} from "@axiom/core";
import { beforeEach, describe, expect, it } from "vitest";

import { CapabilityService } from "./capability-service.js";
import { ProviderService } from "./provider-service.js";

class MemoryProviderRepository implements ProviderRepository {
  readonly records = new Map<string, Provider>();

  async findById(id: string) {
    return (
      [...this.records.values()].find((provider) => provider.id === id) ?? null
    );
  }

  async findBySlug(slug: string) {
    return this.records.get(slug) ?? null;
  }

  async findByDomain(domain: string) {
    return (
      [...this.records.values()].find(
        (provider) => provider.domain === domain,
      ) ?? null
    );
  }

  async list(options: ProviderListOptions): Promise<ProviderPage> {
    const matches = [...this.records.values()]
      .filter(
        (provider) => !options.status || provider.status === options.status,
      )
      .sort((left, right) => left.name.localeCompare(right.name));
    return {
      items: matches.slice(options.offset, options.offset + options.limit),
      total: matches.length,
    };
  }

  async create(provider: Provider) {
    if (
      this.records.has(provider.slug) ||
      (await this.findByDomain(provider.domain))
    ) {
      throw new ApplicationError("CONFLICT", "Provider already exists.");
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

class MemoryCapabilityRepository implements CapabilityRepository {
  readonly records = new Map<string, Capability>();
  writes = 0;

  private key(providerId: string, name: string) {
    return `${providerId}:${name}`;
  }

  async findById(id: string) {
    return (
      [...this.records.values()].find((capability) => capability.id === id) ??
      null
    );
  }

  async findByProvider(providerId: string, status?: CapabilityStatus) {
    return [...this.records.values()]
      .filter(
        (capability) =>
          capability.providerId === providerId &&
          (!status || capability.status === status),
      )
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async findByProviderAndName(providerId: string, name: string) {
    return this.records.get(this.key(providerId, name)) ?? null;
  }

  async create(capability: Capability) {
    const key = this.key(capability.providerId, capability.name);
    if (this.records.has(key)) {
      throw new ApplicationError("CONFLICT", "Capability already exists.");
    }
    this.records.set(key, capability);
    this.writes += 1;
    return capability;
  }

  async upsert(capability: Capability) {
    this.records.set(
      this.key(capability.providerId, capability.name),
      capability,
    );
    this.writes += 1;
    return capability;
  }

  async deleteMissingForProvider(
    providerId: string,
    retainedNames: readonly string[],
  ) {
    let deleted = 0;
    for (const [key, capability] of this.records) {
      if (
        capability.providerId === providerId &&
        !retainedNames.includes(capability.name)
      ) {
        this.records.delete(key);
        deleted += 1;
      }
    }
    return deleted;
  }
}

const firstTimestamp = new Date("2026-09-03T10:00:00.000Z");
const nextTimestamp = new Date("2026-09-03T11:00:00.000Z");
const providerId = "11111111-1111-4111-8111-111111111111";
const capabilityId = "a1111111-1111-4111-8111-111111111111";

const providerInput = {
  name: "Atlas Dining",
  domain: "https://www.AtlasDining.example/path",
  canonicalUrl: "http://atlasdining.example/registry",
  description: "Restaurant discovery and reservations.",
};

const capabilityInput = {
  name: "make_reservation",
  description: "Reserve an available restaurant table.",
  inputSchema: {
    type: "object" as const,
    properties: { restaurant: { type: "string" as const } },
    required: ["restaurant"],
  },
  outputSchema: { type: "object" as const },
  annotations: { readOnly: false, requiresConfirmation: true },
  specVersion: "draft",
  source: "api" as const,
};

describe("ProviderService", () => {
  let repository: MemoryProviderRepository;
  let service: ProviderService;

  beforeEach(() => {
    repository = new MemoryProviderRepository();
    service = new ProviderService(repository, {
      createId: () => providerId,
      now: () => firstTimestamp,
    });
  });

  it("registers a normalized provider with safe server-owned defaults", async () => {
    const provider = await service.registerProvider(providerInput);

    expect(provider).toMatchObject({
      id: providerId,
      slug: "atlas-dining",
      domain: "atlasdining.example",
      canonicalUrl: "https://atlasdining.example",
      verificationStatus: "unverified",
      status: "active",
      lastIndexedAt: null,
    });
  });

  it("rejects duplicate normalized domains", async () => {
    await service.registerProvider(providerInput);

    await expect(
      service.registerProvider({
        ...providerInput,
        name: "Duplicate",
        domain: "atlasdining.example",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("retrieves and lists providers with pagination", async () => {
    await service.registerProvider(providerInput);

    await expect(service.getProvider("atlas-dining")).resolves.toMatchObject({
      name: "Atlas Dining",
    });
    await expect(
      service.listProviders({ limit: 10, offset: 0, status: "active" }),
    ).resolves.toMatchObject({ total: 1 });
  });

  it("updates only editable provider metadata", async () => {
    await service.registerProvider(providerInput);
    service = new ProviderService(repository, { now: () => nextTimestamp });

    const updated = await service.updateProvider("atlas-dining", {
      name: "Atlas Dining Network",
      description: "Updated description.",
    });

    expect(updated.name).toBe("Atlas Dining Network");
    expect(updated.domain).toBe("atlasdining.example");
    expect(updated.verificationStatus).toBe("unverified");
    expect(updated.updatedAt).toEqual(nextTimestamp);
  });
});

describe("CapabilityService", () => {
  let providers: MemoryProviderRepository;
  let capabilities: MemoryCapabilityRepository;
  let service: CapabilityService;

  beforeEach(async () => {
    providers = new MemoryProviderRepository();
    capabilities = new MemoryCapabilityRepository();
    const providerService = new ProviderService(providers, {
      createId: () => providerId,
      now: () => firstTimestamp,
    });
    await providerService.registerProvider(providerInput);
    service = new CapabilityService(providers, capabilities, {
      createId: () => capabilityId,
      now: () => firstTimestamp,
    });
  });

  it("registers a capability with a deterministic content hash", async () => {
    const capability = await service.registerCapability(
      "atlas-dining",
      capabilityInput,
    );

    expect(capability.contentHash).toMatch(/^[a-f\d]{64}$/u);
    expect(capability.status).toBe("active");
  });

  it("rejects duplicate capability registration", async () => {
    await service.registerCapability("atlas-dining", capabilityInput);
    await expect(
      service.registerCapability("atlas-dining", capabilityInput),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("gets and deterministically lists active capabilities", async () => {
    await service.registerCapability("atlas-dining", capabilityInput);

    await expect(
      service.getCapability("atlas-dining", "make_reservation"),
    ).resolves.toMatchObject({ name: "make_reservation" });
    await expect(
      service.listCapabilities("atlas-dining"),
    ).resolves.toHaveLength(1);
  });

  it("creates a missing capability through PUT semantics", async () => {
    await expect(
      service.upsertCapability(
        "atlas-dining",
        "make_reservation",
        capabilityInput,
      ),
    ).resolves.toMatchObject({ outcome: "created" });
  });

  it("does not write or change updatedAt when content is unchanged", async () => {
    const original = await service.registerCapability(
      "atlas-dining",
      capabilityInput,
    );
    service = new CapabilityService(providers, capabilities, {
      now: () => nextTimestamp,
    });

    const result = await service.upsertCapability(
      "atlas-dining",
      "make_reservation",
      capabilityInput,
    );

    expect(result.outcome).toBe("unchanged");
    expect(result.capability.updatedAt).toEqual(original.updatedAt);
    expect(capabilities.writes).toBe(1);
  });

  it("updates a changed capability and refreshes its hash", async () => {
    const original = await service.registerCapability(
      "atlas-dining",
      capabilityInput,
    );
    service = new CapabilityService(providers, capabilities, {
      now: () => nextTimestamp,
    });

    const result = await service.upsertCapability(
      "atlas-dining",
      "make_reservation",
      { ...capabilityInput, description: "Reserve and confirm a table." },
    );

    expect(result.outcome).toBe("updated");
    expect(result.capability.contentHash).not.toBe(original.contentHash);
    expect(result.capability.updatedAt).toEqual(nextTimestamp);
  });

  it("requires the body capability name to match the URL", async () => {
    await expect(
      service.upsertCapability("atlas-dining", "other_name", capabilityInput),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});
