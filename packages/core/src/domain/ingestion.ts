import type { Capability } from "./capability.js";
import type { JsonValue } from "./json.js";
import type { Provider, ProviderVerificationStatus } from "./provider.js";

export type InspectionStatus = "detected" | "not-found" | "invalid";

export interface InspectionResult {
  readonly url: string;
  readonly status: InspectionStatus;
  readonly provider: Provider | null;
  readonly capabilities: readonly Capability[];
  readonly inspectedAt: Date;
  readonly warnings: readonly string[];
  readonly rawContract?: JsonValue;
}

export interface PublishInput {
  readonly url: string;
  readonly contactEmail?: string;
  readonly notes?: string;
  readonly rawContract?: JsonValue;
}

export type PublishStatus = "accepted" | "queued" | "rejected";

export interface PublishResult {
  readonly submissionId: string;
  readonly status: PublishStatus;
  readonly verificationStatus: ProviderVerificationStatus;
  readonly message: string;
  readonly provider?: Provider;
}
