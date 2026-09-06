import type { Capability, JsonValue, Provider } from "@axiom/core";

import type {
  CapabilityRow,
  NewCapabilityRow,
  NewProviderRow,
  ProviderRow,
} from "./schema.js";

export function mapProviderRow(row: ProviderRow): Provider {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    domain: row.domain,
    canonicalUrl: row.canonicalUrl,
    description: row.description,
    verificationStatus: row.verificationStatus,
    status: row.status,
    lastIndexedAt: row.lastIndexedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toProviderRow(provider: Provider): NewProviderRow {
  return {
    id: provider.id,
    slug: provider.slug,
    name: provider.name,
    domain: provider.domain,
    canonicalUrl: provider.canonicalUrl,
    description: provider.description,
    verificationStatus: provider.verificationStatus,
    status: provider.status,
    lastIndexedAt: provider.lastIndexedAt,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
  };
}

export function mapCapabilityRow(row: CapabilityRow): Capability {
  return {
    id: row.id,
    providerId: row.providerId,
    name: row.name,
    description: row.description,
    inputSchema: row.inputSchema,
    outputSchema: row.outputSchema,
    annotations: row.annotations,
    specVersion: row.specVersion,
    source: row.source,
    status: row.status,
    contentHash: row.contentHash,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toCapabilityRow(
  capability: Capability,
  rawContract?: JsonValue,
): NewCapabilityRow {
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
    ...(rawContract === undefined ? {} : { rawContract }),
    createdAt: capability.createdAt,
    updatedAt: capability.updatedAt,
  };
}
