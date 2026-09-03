import type { Capability } from "../domain/capability.js";

export interface CapabilityRepository {
  findById(id: string): Promise<Capability | null>;
  findByProvider(providerId: string): Promise<readonly Capability[]>;
  findByProviderAndName(
    providerId: string,
    name: string,
  ): Promise<Capability | null>;
  upsert(capability: Capability): Promise<Capability>;
  deleteMissingForProvider(
    providerId: string,
    retainedNames: readonly string[],
  ): Promise<number>;
}
