import type { Capability, CapabilityStatus } from "../domain/capability.js";

export interface CapabilityRepository {
  findById(id: string): Promise<Capability | null>;
  findByProvider(
    providerId: string,
    status?: CapabilityStatus,
  ): Promise<readonly Capability[]>;
  findByProviderAndName(
    providerId: string,
    name: string,
  ): Promise<Capability | null>;
  create(capability: Capability): Promise<Capability>;
  upsert(capability: Capability): Promise<Capability>;
  deleteMissingForProvider(
    providerId: string,
    retainedNames: readonly string[],
  ): Promise<number>;
}
