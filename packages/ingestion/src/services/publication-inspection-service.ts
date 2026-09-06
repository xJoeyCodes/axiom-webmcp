import type { CapabilityRepository, ProviderRepository } from "@axiom/core";

import type { CapabilitySourceAdapter } from "../adapters/capability-source-adapter.js";
import { createPublicationPlan } from "../diff/publication-diff.js";
import type { NormalizedPublication, PublicationInspection } from "../types.js";
import { validatePublication } from "../validate/publication-validator.js";

export class PublicationInspectionService {
  private readonly adapters: Map<string, CapabilitySourceAdapter>;

  constructor(
    adapters: readonly CapabilitySourceAdapter[],
    private readonly providers: ProviderRepository,
    private readonly capabilities: CapabilityRepository,
  ) {
    this.adapters = new Map(
      adapters.map((adapter) => [adapter.source, adapter]),
    );
  }

  normalize(input: unknown): NormalizedPublication {
    const source =
      typeof input === "object" && input !== null && "source" in input
        ? input.source
        : undefined;
    const adapter =
      typeof source === "string" ? this.adapters.get(source) : null;
    if (!adapter) {
      return this.adapters.get("api")!.ingest(input);
    }
    return adapter.ingest(input);
  }

  async inspect(input: unknown): Promise<PublicationInspection> {
    const publication = this.normalize(input);
    return this.inspectNormalized(publication);
  }

  async inspectNormalized(
    publication: NormalizedPublication,
  ): Promise<PublicationInspection> {
    const warnings = validatePublication(publication);
    const provider = await this.providers.findByDomain(
      publication.provider.domain,
    );
    const capabilities = provider
      ? await this.capabilities.findByProvider(provider.id)
      : [];

    return {
      valid: true,
      plan: createPublicationPlan(publication, provider, capabilities),
      warnings,
    };
  }
}
