import type { Capability, Provider } from "@axiom/core";

import type {
  NormalizedPublication,
  PublicationCapabilityAction,
  PublicationPlan,
  PublicationProviderAction,
} from "../types.js";

function providerAction(
  provider: Provider | null,
  incoming: NormalizedPublication["provider"],
): PublicationProviderAction {
  if (!provider) return "create";
  return provider.name === incoming.name &&
    provider.description === incoming.description &&
    provider.canonicalUrl === incoming.canonicalUrl
    ? "unchanged"
    : "update";
}

export function createPublicationPlan(
  publication: NormalizedPublication,
  existingProvider: Provider | null,
  existingCapabilities: readonly Capability[],
): PublicationPlan {
  const existingByName = new Map(
    existingCapabilities.map((capability) => [capability.name, capability]),
  );
  const changes = publication.capabilities.map((capability) => {
    const existing = existingByName.get(capability.name);
    let action: PublicationCapabilityAction = "create";
    if (existing) {
      action =
        existing.contentHash === capability.contentHash &&
        existing.specVersion === capability.specVersion &&
        existing.source === capability.source &&
        existing.status === "active"
          ? "unchanged"
          : "update";
    }
    return {
      name: capability.name,
      action,
      contentHash: capability.contentHash,
    };
  });

  const count = (action: PublicationCapabilityAction) =>
    changes.filter((change) => change.action === action).length;

  return {
    mode: publication.mode,
    providerAction: providerAction(existingProvider, publication.provider),
    provider: publication.provider,
    existingProvider,
    capabilities: changes,
    summary: {
      total: changes.length,
      create: count("create"),
      update: count("update"),
      unchanged: count("unchanged"),
      remove: 0,
    },
  };
}
