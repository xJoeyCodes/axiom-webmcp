import { createHash } from "node:crypto";

import {
  stableJsonStringify,
  type Capability,
  type EmbeddingMetadata,
  type Provider,
} from "@axiom/core";

export function createIndexFingerprint(
  provider: Provider,
  capability: Capability,
  metadata: EmbeddingMetadata,
): string {
  const semanticIdentity = {
    capabilityContentHash: capability.contentHash,
    providerName: provider.name,
    providerDescription: provider.description,
    embeddingProvider: metadata.provider,
    embeddingModel: metadata.model,
    embeddingDimensions: metadata.dimensions,
    embeddingVersion: metadata.version,
    searchDocumentVersion: metadata.searchDocumentVersion,
  };
  return createHash("sha256")
    .update(stableJsonStringify(semanticIdentity))
    .digest("hex");
}
