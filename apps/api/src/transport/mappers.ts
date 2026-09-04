import type { Capability, Provider } from "@axiom/core";
import type { CapabilityResponse, ProviderResponse } from "@axiom/contracts";

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
