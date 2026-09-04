import {
  ApplicationError,
  createCapabilityContentHash,
  normalizeCapabilityName,
  normalizeDomain,
  normalizeUrl,
  type CapabilityAnnotations,
  type CapabilitySchema,
  type CapabilitySource,
  type JsonValue,
} from "@axiom/core";

import type {
  NormalizedPublication,
  PublicationCapabilityInput,
  PublicationMode,
} from "../types.js";

export interface SourceCapability {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
  readonly outputSchema?: Record<string, unknown> | null | undefined;
  readonly annotations?: Record<string, unknown> | undefined;
  readonly specVersion?: string | null | undefined;
}

export interface SourcePublication {
  readonly mode?: PublicationMode | undefined;
  readonly provider: {
    readonly name: string;
    readonly domain: string;
    readonly canonicalUrl: string;
    readonly description: string;
  };
  readonly capabilities: readonly SourceCapability[];
}

function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/gu, " ");
}

function normalizeCapability(
  input: SourceCapability,
  source: CapabilitySource,
): PublicationCapabilityInput {
  const normalized = {
    name: normalizeCapabilityName(input.name),
    description: collapseWhitespace(input.description),
    inputSchema: input.inputSchema as CapabilitySchema,
    outputSchema: (input.outputSchema ?? null) as CapabilitySchema | null,
    annotations: (input.annotations ?? {}) as CapabilityAnnotations,
    specVersion: input.specVersion?.trim() || null,
    source,
  };

  return {
    ...normalized,
    rawContract: input as unknown as JsonValue,
    contentHash: createCapabilityContentHash(normalized),
  };
}

export function normalizePublication(
  input: SourcePublication,
  source: CapabilitySource,
): NormalizedPublication {
  const domain = normalizeDomain(input.provider.domain);
  const canonicalUrl = normalizeUrl(input.provider.canonicalUrl);

  if (normalizeDomain(canonicalUrl) !== domain) {
    throw new ApplicationError(
      "VALIDATION_ERROR",
      "canonicalUrl must belong to the provider domain.",
    );
  }

  return {
    mode: input.mode ?? "merge",
    provider: {
      name: collapseWhitespace(input.provider.name),
      domain,
      canonicalUrl,
      description: collapseWhitespace(input.provider.description),
    },
    capabilities: input.capabilities.map((capability) =>
      normalizeCapability(capability, source),
    ),
  };
}
