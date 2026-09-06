import type { AxiomManifest as TransportAxiomManifest } from "@axiom-webmcp/sdk";

export type VerificationStatus = "verified" | "pending" | "unverified";

export type JsonSchemaType =
  "string" | "number" | "integer" | "boolean" | "object" | "array" | "null";

export type JsonSchemaValue =
  | string
  | number
  | boolean
  | null
  | JsonSchemaValue[]
  | { [key: string]: JsonSchemaValue };

export interface WebMCPSchema {
  type?: JsonSchemaType | JsonSchemaType[];
  title?: string;
  description?: string;
  format?: string;
  properties?: Record<string, WebMCPSchema>;
  items?: WebMCPSchema;
  required?: string[];
  enum?: JsonSchemaValue[];
  default?: JsonSchemaValue;
  examples?: JsonSchemaValue[];
  additionalProperties?: boolean | WebMCPSchema;
}

export interface CapabilityInput {
  name: string;
  description: string;
  required: boolean;
  schema: WebMCPSchema;
}

export interface CapabilityOutput {
  description: string;
  schema: WebMCPSchema;
}

export interface CapabilityMetadata {
  version: string;
  category: string;
  tags: string[];
  transport: "webmcp";
  destructive: boolean;
  sideEffecting?: boolean;
  requiresConfirmation: boolean;
}

export interface Capability {
  id: string;
  name: string;
  description: string;
  inputs: CapabilityInput[];
  output?: CapabilityOutput;
  metadata: CapabilityMetadata;
}

export interface ProviderMetadata {
  industry?: string;
  location?: string;
  documentationUrl?: string;
}

export interface Provider {
  id: string;
  slug: string;
  name: string;
  domain: string;
  canonicalUrl?: string;
  description: string;
  verified: boolean;
  verificationStatus: VerificationStatus;
  lastIndexed: string | null;
  capabilities: Capability[];
  metadata: ProviderMetadata;
}

export interface CapabilityMatch {
  capability: Capability;
  score: number;
  matchedTerms: string[];
}

export interface DiscoveryResult {
  provider: Provider;
  score: number;
  matches: CapabilityMatch[];
}

export type AxiomManifest = TransportAxiomManifest;
export type PublicationAction = "create" | "update" | "unchanged" | "remove";

export interface PublicationSummary {
  total: number;
  create: number;
  update: number;
  unchanged: number;
  remove: number;
}

export interface PublicationWarning {
  code: string;
  capability: string;
  message: string;
}

export interface InspectedCapability {
  capability: Capability;
  action: PublicationAction;
}

export interface ManifestInspectionResult {
  manifest: AxiomManifest;
  providerAction: Exclude<PublicationAction, "remove">;
  providerSlug: string | null;
  summary: PublicationSummary;
  capabilities: InspectedCapability[];
  warnings: PublicationWarning[];
}

export interface PublicationIndexingSummary {
  ready: number;
  failed: number;
  unchanged: number;
  pending: number;
}

export interface ManifestPublishResult {
  provider: Provider;
  summary: PublicationSummary;
  indexing: PublicationIndexingSummary;
  warnings: PublicationWarning[];
}

// Retained for the explicit offline mock client used by isolated frontend work.
export type InspectionStatus = "detected" | "not_found" | "invalid";

export interface InspectionResult {
  url: string;
  status: InspectionStatus;
  provider: Provider | null;
  capabilities: Capability[];
  inspectedAt: string;
  warnings: string[];
}

export interface PublishInput {
  url: string;
  contactEmail?: string;
  notes?: string;
}

export type PublishStatus = "accepted" | "queued" | "rejected";

export interface PublishResult {
  submissionId: string;
  status: PublishStatus;
  verificationStatus: VerificationStatus;
  message: string;
  provider?: Provider;
}
