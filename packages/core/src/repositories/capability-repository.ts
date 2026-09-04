import type { Capability, CapabilityStatus } from "../domain/capability.js";
import type { JsonValue } from "../domain/json.js";

export interface CapabilityPersistenceOptions {
  readonly rawContract?: JsonValue;
}

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
  create(
    capability: Capability,
    options?: CapabilityPersistenceOptions,
  ): Promise<Capability>;
  upsert(
    capability: Capability,
    options?: CapabilityPersistenceOptions,
  ): Promise<Capability>;
  deleteMissingForProvider(
    providerId: string,
    retainedNames: readonly string[],
  ): Promise<number>;
}
