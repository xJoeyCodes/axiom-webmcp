import {
  ApplicationError,
  type Capability,
  type CapabilityPersistenceOptions,
  type CapabilityRepository,
  type CapabilityStatus,
  type Provider,
  type ProviderListOptions,
  type ProviderRepository,
  type RegistryUnitOfWork,
} from "@axiom/core";
import {
  ApiContractAdapter,
  ManifestAdapter,
  PublicationInspectionService,
  PublicationService,
} from "@axiom/ingestion";
import { CapabilityService, ProviderService } from "@axiom/registry";

export class MemoryProviderRepository implements ProviderRepository {
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

export class MemoryCapabilityRepository implements CapabilityRepository {
  readonly records = new Map<string, Capability>();
  readonly rawContracts = new Map<string, unknown>();

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

  async create(capability: Capability, options?: CapabilityPersistenceOptions) {
    const key = this.key(capability.providerId, capability.name);
    if (this.records.has(key)) {
      throw new ApplicationError("CONFLICT", "Capability already exists.");
    }
    this.records.set(key, capability);
    if (options?.rawContract !== undefined) {
      this.rawContracts.set(key, options.rawContract);
    }
    return capability;
  }

  async upsert(capability: Capability, options?: CapabilityPersistenceOptions) {
    const key = this.key(capability.providerId, capability.name);
    this.records.set(key, capability);
    if (options?.rawContract !== undefined) {
      this.rawContracts.set(key, options.rawContract);
    }
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
        this.rawContracts.delete(key);
        deleted += 1;
      }
    }
    return deleted;
  }
}

class MemoryRegistryUnitOfWork implements RegistryUnitOfWork {
  constructor(
    private readonly providers: MemoryProviderRepository,
    private readonly capabilities: MemoryCapabilityRepository,
  ) {}

  async execute<T>(
    operation: Parameters<RegistryUnitOfWork["execute"]>[0],
  ): Promise<T> {
    const providerSnapshot = new Map(this.providers.records);
    const capabilitySnapshot = new Map(this.capabilities.records);
    const rawSnapshot = new Map(this.capabilities.rawContracts);
    try {
      return (await operation({
        providers: this.providers,
        capabilities: this.capabilities,
      })) as T;
    } catch (error) {
      this.providers.records.clear();
      this.capabilities.records.clear();
      this.capabilities.rawContracts.clear();
      for (const entry of providerSnapshot)
        this.providers.records.set(...entry);
      for (const entry of capabilitySnapshot)
        this.capabilities.records.set(...entry);
      for (const entry of rawSnapshot)
        this.capabilities.rawContracts.set(...entry);
      throw error;
    }
  }
}

export function createTestRegistry() {
  const providerRepository = new MemoryProviderRepository();
  const capabilityRepository = new MemoryCapabilityRepository();
  const inspectionService = new PublicationInspectionService(
    [new ApiContractAdapter(), new ManifestAdapter()],
    providerRepository,
    capabilityRepository,
  );
  return {
    providerService: new ProviderService(providerRepository),
    capabilityService: new CapabilityService(
      providerRepository,
      capabilityRepository,
    ),
    inspectionService,
    publicationService: new PublicationService(
      inspectionService,
      new MemoryRegistryUnitOfWork(providerRepository, capabilityRepository),
    ),
    repositories: {
      providers: providerRepository,
      capabilities: capabilityRepository,
    },
  };
}
