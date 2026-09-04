import type { Capability, Provider } from "@axiom/core";
import type {
  CapabilityResponse,
  ProviderResponse,
  PublicationPlan as PublicationPlanResponse,
} from "@axiom/contracts";
import type { PublicationPlan } from "@axiom/ingestion";

export function toProviderResponse(provider: Provider): ProviderResponse {
  return {
    id: provider.id,
    slug: provider.slug,
    name: provider.name,
    domain: provider.domain,
    canonicalUrl: provider.canonicalUrl,
    description: provider.description,
    verificationStatus: provider.verificationStatus,
    status: provider.status,
    lastIndexedAt: provider.lastIndexedAt?.toISOString() ?? null,
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
  };
}

export function toCapabilityResponse(
  capability: Capability,
): CapabilityResponse {
  return {
    id: capability.id,
    providerId: capability.providerId,
    name: capability.name,
    description: capability.description,
    inputSchema: capability.inputSchema,
    outputSchema: capability.outputSchema,
    annotations: capability.annotations,
    specVersion: capability.specVersion,
    source: capability.source,
    status: capability.status,
    contentHash: capability.contentHash,
    createdAt: capability.createdAt.toISOString(),
    updatedAt: capability.updatedAt.toISOString(),
  };
}

export function toPublicationPlanResponse(
  plan: PublicationPlan,
): PublicationPlanResponse {
  return {
    mode: plan.mode,
    provider: {
      action: plan.providerAction,
      slug: plan.existingProvider?.slug ?? null,
      domain: plan.provider.domain,
    },
    summary: plan.summary,
    capabilities: [...plan.capabilities],
  };
}
