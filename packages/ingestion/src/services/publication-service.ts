import type { RegistryUnitOfWork } from "@axiom/core";
import { CapabilityService, ProviderService } from "@axiom/registry";

import { createPublicationPlan } from "../diff/publication-diff.js";
import type { PublicationIndexer, PublicationResult } from "../types.js";
import { validatePublication } from "../validate/publication-validator.js";
import type { PublicationInspectionService } from "./publication-inspection-service.js";

export class PublicationService {
  constructor(
    private readonly inspection: PublicationInspectionService,
    private readonly unitOfWork: RegistryUnitOfWork,
    private readonly indexer?: PublicationIndexer,
  ) {}

  async publish(input: unknown): Promise<PublicationResult> {
    const publication = this.inspection.normalize(input);
    const warnings = validatePublication(publication);

    const committed = await this.unitOfWork.execute(async (repositories) => {
      const existingProvider = await repositories.providers.findByDomain(
        publication.provider.domain,
      );
      const existingCapabilities = existingProvider
        ? await repositories.capabilities.findByProvider(existingProvider.id)
        : [];
      const plan = createPublicationPlan(
        publication,
        existingProvider,
        existingCapabilities,
      );
      const providerService = new ProviderService(repositories.providers);
      const capabilityService = new CapabilityService(
        repositories.providers,
        repositories.capabilities,
      );

      let provider = existingProvider;
      if (!provider) {
        provider = await providerService.registerProvider(publication.provider);
      } else if (plan.providerAction === "update") {
        provider = await providerService.updateProvider(provider.slug, {
          name: publication.provider.name,
          description: publication.provider.description,
          canonicalUrl: publication.provider.canonicalUrl,
        });
      }

      const incomingByName = new Map(
        publication.capabilities.map((capability) => [
          capability.name,
          capability,
        ]),
      );
      for (const change of plan.capabilities) {
        if (change.action === "unchanged" || change.action === "remove")
          continue;
        const capability = incomingByName.get(change.name)!;
        await capabilityService.upsertCapability(
          provider.slug,
          capability.name,
          {
            name: capability.name,
            description: capability.description,
            inputSchema: capability.inputSchema,
            outputSchema: capability.outputSchema,
            annotations: capability.annotations,
            specVersion: capability.specVersion,
            source: capability.source,
            rawContract: capability.rawContract,
          },
        );
      }

      const storedCapabilities = await repositories.capabilities.findByProvider(
        provider.id,
        "active",
      );
      const changedNames = new Set(
        plan.capabilities
          .filter(
            (change) =>
              change.action === "create" || change.action === "update",
          )
          .map((change) => change.name),
      );
      const indexIds = storedCapabilities
        .filter(
          (capability) =>
            plan.providerAction === "update" ||
            changedNames.has(capability.name),
        )
        .map((capability) => capability.id);
      return { provider, plan, indexIds };
    });

    const skippedUnchanged =
      committed.plan.providerAction === "update"
        ? 0
        : committed.plan.summary.unchanged;
    if (!this.indexer) {
      return {
        provider: committed.provider,
        plan: committed.plan,
        warnings,
        indexing: {
          ready: 0,
          failed: 0,
          unchanged: skippedUnchanged,
          pending: committed.indexIds.length,
        },
      };
    }

    try {
      const indexed = await this.indexer.indexCapabilities(committed.indexIds);
      return {
        provider: committed.provider,
        plan: committed.plan,
        warnings,
        indexing: {
          ready: indexed.ready,
          failed: indexed.failed,
          unchanged: indexed.unchanged + skippedUnchanged,
          pending: 0,
        },
      };
    } catch {
      return {
        provider: committed.provider,
        plan: committed.plan,
        warnings,
        indexing: {
          ready: 0,
          failed: committed.indexIds.length,
          unchanged: skippedUnchanged,
          pending: 0,
        },
      };
    }
  }
}
