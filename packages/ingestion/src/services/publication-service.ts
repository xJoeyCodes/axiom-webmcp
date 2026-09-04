import type { RegistryUnitOfWork } from "@axiom/core";
import { CapabilityService, ProviderService } from "@axiom/registry";

import { createPublicationPlan } from "../diff/publication-diff.js";
import type { PublicationResult } from "../types.js";
import { validatePublication } from "../validate/publication-validator.js";
import type { PublicationInspectionService } from "./publication-inspection-service.js";

export class PublicationService {
  constructor(
    private readonly inspection: PublicationInspectionService,
    private readonly unitOfWork: RegistryUnitOfWork,
  ) {}

  async publish(input: unknown): Promise<PublicationResult> {
    const publication = this.inspection.normalize(input);
    const warnings = validatePublication(publication);

    return this.unitOfWork.execute(async (repositories) => {
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

      return { provider, plan, warnings };
    });
  }
}
