import { randomUUID } from "node:crypto";

import {
  ApplicationError,
  createCapabilityContentHash,
  normalizeCapabilityName,
  type Capability,
  type CapabilityAnnotations,
  type CapabilityRepository,
  type CapabilitySchema,
  type CapabilitySource,
  type JsonValue,
  type ProviderRepository,
} from "@axiom/core";

import type { RegistryServiceOptions } from "./provider-service.js";

export interface WriteCapabilityInput {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: CapabilitySchema;
  readonly outputSchema?: CapabilitySchema | null;
  readonly annotations?: CapabilityAnnotations;
  readonly specVersion?: string | null;
  readonly source: CapabilitySource;
  /** Trusted source contract retained for migrations/debugging; never returned by default. */
  readonly rawContract?: JsonValue;
}

export type CapabilityUpsertOutcome = "created" | "updated" | "unchanged";

export interface CapabilityUpsertResult {
  readonly capability: Capability;
  readonly outcome: CapabilityUpsertOutcome;
}

export class CapabilityService {
  private readonly createId: () => string;
  private readonly now: () => Date;

  constructor(
    private readonly providers: ProviderRepository,
    private readonly capabilities: CapabilityRepository,
    options: RegistryServiceOptions = {},
  ) {
    this.createId = options.createId ?? randomUUID;
    this.now = options.now ?? (() => new Date());
  }

  async registerCapability(
    providerSlug: string,
    input: WriteCapabilityInput,
  ): Promise<Capability> {
    const provider = await this.requireProvider(providerSlug);
    const normalized = this.normalizeInput(input);

    if (
      await this.capabilities.findByProviderAndName(
        provider.id,
        normalized.name,
      )
    ) {
      throw new ApplicationError(
        "CONFLICT",
        `Capability ${normalized.name} is already registered for ${provider.slug}.`,
      );
    }

    const timestamp = this.now();
    return this.capabilities.create(
      this.createCapability(provider.id, normalized, timestamp),
      input.rawContract === undefined
        ? undefined
        : { rawContract: input.rawContract },
    );
  }

  async getCapability(
    providerSlug: string,
    capabilityName: string,
  ): Promise<Capability> {
    const provider = await this.requireProvider(providerSlug);
    const name = normalizeCapabilityName(capabilityName);
    const capability = await this.capabilities.findByProviderAndName(
      provider.id,
      name,
    );

    if (!capability) {
      throw new ApplicationError(
        "NOT_FOUND",
        `Capability ${name} was not found for ${provider.slug}.`,
      );
    }
    return capability;
  }

  async listCapabilities(providerSlug: string): Promise<readonly Capability[]> {
    const provider = await this.requireProvider(providerSlug);
    return this.capabilities.findByProvider(provider.id, "active");
  }

  async upsertCapability(
    providerSlug: string,
    capabilityName: string,
    input: WriteCapabilityInput,
  ): Promise<CapabilityUpsertResult> {
    const provider = await this.requireProvider(providerSlug);
    const pathName = normalizeCapabilityName(capabilityName);
    const normalized = this.normalizeInput(input);

    if (pathName !== normalized.name) {
      throw new ApplicationError(
        "VALIDATION_ERROR",
        "The capability name in the request body must match the URL.",
      );
    }

    const existing = await this.capabilities.findByProviderAndName(
      provider.id,
      pathName,
    );
    const persistenceOptions =
      input.rawContract === undefined
        ? undefined
        : { rawContract: input.rawContract };
    if (!existing) {
      const timestamp = this.now();
      const capability = await this.capabilities.create(
        this.createCapability(provider.id, normalized, timestamp),
        persistenceOptions,
      );
      return { capability, outcome: "created" };
    }

    const contentHash = this.hashInput(normalized);
    const unchanged =
      existing.contentHash === contentHash &&
      existing.specVersion === normalized.specVersion &&
      existing.source === normalized.source &&
      existing.status === "active";
    if (unchanged) {
      return { capability: existing, outcome: "unchanged" };
    }

    const capability = await this.capabilities.upsert(
      {
        ...existing,
        description: normalized.description,
        inputSchema: normalized.inputSchema,
        outputSchema: normalized.outputSchema,
        annotations: normalized.annotations,
        specVersion: normalized.specVersion,
        source: normalized.source,
        status: "active",
        contentHash,
        updatedAt: this.now(),
      },
      persistenceOptions,
    );
    return { capability, outcome: "updated" };
  }

  private async requireProvider(slug: string) {
    const provider = await this.providers.findBySlug(slug);
    if (!provider) {
      throw new ApplicationError(
        "NOT_FOUND",
        `Provider ${slug} was not found.`,
      );
    }
    return provider;
  }

  private normalizeInput(input: WriteCapabilityInput) {
    return {
      name: normalizeCapabilityName(input.name),
      description: input.description.trim(),
      inputSchema: input.inputSchema,
      outputSchema: input.outputSchema ?? null,
      annotations: input.annotations ?? {},
      specVersion: input.specVersion?.trim() || null,
      source: input.source,
    };
  }

  private hashInput(
    input: ReturnType<CapabilityService["normalizeInput"]>,
  ): string {
    return createCapabilityContentHash(input);
  }

  private createCapability(
    providerId: string,
    input: ReturnType<CapabilityService["normalizeInput"]>,
    timestamp: Date,
  ): Capability {
    return {
      id: this.createId(),
      providerId,
      ...input,
      status: "active",
      contentHash: this.hashInput(input),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }
}
