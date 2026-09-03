import type { Capability } from "./capability.js";
import type { Provider } from "./provider.js";

export interface DiscoveryQuery {
  readonly intent: string;
  readonly limit?: number;
}

export interface CapabilityMatch {
  readonly capability: Capability;
  readonly score: number;
  readonly matchedTerms: readonly string[];
}

export interface DiscoveryResult {
  readonly provider: Provider;
  readonly score: number;
  readonly matches: readonly CapabilityMatch[];
}
