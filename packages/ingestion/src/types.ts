import type {
  CapabilityAnnotations,
  CapabilitySchema,
  CapabilitySource,
  JsonValue,
  Provider,
} from "@axiom/core";

export type PublicationMode = "merge";
export type PublicationProviderAction = "create" | "update" | "unchanged";
export type PublicationCapabilityAction =
  "create" | "update" | "unchanged" | "remove";

export interface PublicationProviderInput {
  readonly name: string;
  readonly domain: string;
  readonly canonicalUrl: string;
  readonly description: string;
}

export interface PublicationCapabilityInput {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: CapabilitySchema;
  readonly outputSchema: CapabilitySchema | null;
  readonly annotations: CapabilityAnnotations;
  readonly specVersion: string | null;
  readonly source: CapabilitySource;
  readonly rawContract: JsonValue;
  readonly contentHash: string;
}

export interface NormalizedPublication {
  readonly mode: PublicationMode;
  readonly provider: PublicationProviderInput;
  readonly capabilities: readonly PublicationCapabilityInput[];
}

export interface PublicationWarning {
  readonly code:
    | "MISSING_OUTPUT_SCHEMA"
    | "SHORT_DESCRIPTION"
    | "MUTATION_ANNOTATIONS_MISSING";
  readonly message: string;
  readonly capability: string;
}

export interface PublicationCapabilityChange {
  readonly name: string;
  readonly action: PublicationCapabilityAction;
  readonly contentHash: string;
}

export interface PublicationSummary {
  readonly total: number;
  readonly create: number;
  readonly update: number;
  readonly unchanged: number;
  readonly remove: number;
}

export interface PublicationPlan {
  readonly mode: PublicationMode;
  readonly providerAction: PublicationProviderAction;
  readonly provider: PublicationProviderInput;
  readonly existingProvider: Provider | null;
  readonly capabilities: readonly PublicationCapabilityChange[];
  readonly summary: PublicationSummary;
}

export interface PublicationInspection {
  readonly valid: true;
  readonly plan: PublicationPlan;
  readonly warnings: readonly PublicationWarning[];
}

export interface PublicationIndexingSummary {
  readonly ready: number;
  readonly failed: number;
  readonly unchanged: number;
  readonly pending: number;
}

export interface PublicationIndexerResult {
  readonly ready: number;
  readonly failed: number;
  readonly unchanged: number;
}

export interface PublicationIndexer {
  indexCapabilities(
    capabilityIds: readonly string[],
  ): Promise<PublicationIndexerResult>;
}

export interface PublicationResult {
  readonly provider: Provider;
  readonly plan: PublicationPlan;
  readonly warnings: readonly PublicationWarning[];
  readonly indexing: PublicationIndexingSummary;
}
