import type { CapabilityRepository } from "./capability-repository.js";
import type { ProviderRepository } from "./provider-repository.js";

export interface RegistryRepositories {
  readonly providers: ProviderRepository;
  readonly capabilities: CapabilityRepository;
}

export interface RegistryUnitOfWork {
  execute<T>(
    operation: (repositories: RegistryRepositories) => Promise<T>,
  ): Promise<T>;
}
