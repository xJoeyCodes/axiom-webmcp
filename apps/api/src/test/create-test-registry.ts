import {
  ApplicationError,
  type Capability,
  type CapabilityRepository,
  type CapabilityStatus,
  type Provider,
  type ProviderListOptions,
  type ProviderRepository,
} from "@axiom/core";
import { CapabilityService, ProviderService } from "@axiom/registry";

class MemoryProviderRepository implements ProviderRepository {
  private readonly records = new Map<string, Provider>();

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

  async list(options: ProviderListOptions) {
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
  private readonly records = new Map<string, Capability>();

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
    return capability;
  }

  async upsert(capability: Capability) {
    this.records.set(
      this.key(capability.providerId, capability.name),
      capability,
    );
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

export function createTestRegistry() {
  const providerRepository = new MemoryProviderRepository();
  const capabilityRepository = new MemoryCapabilityRepository();
  return {
    providerService: new ProviderService(providerRepository),
    capabilityService: new CapabilityService(
      providerRepository,
      capabilityRepository,
    ),
  };
}
