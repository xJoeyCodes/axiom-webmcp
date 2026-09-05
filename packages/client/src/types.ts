import type { z } from "zod";
import type {
  discoveryRequestSchema,
  DiscoveryResponse as WireDiscoveryResponse,
} from "../../contracts/src/discovery.js";

/** Explicit configuration; no environment variables or production URL are assumed. */
export interface AxiomOptions {
  /** HTTP(S) API base URL, optionally including a reverse-proxy path prefix. */
  readonly baseUrl: string;
  /** Overrides native fetch for tests or custom networking. */
  readonly fetch?: typeof globalThis.fetch;
  /** Copied at initialization. JSON Content-Type and Accept are enforced. */
  readonly headers?: NonNullable<RequestInit["headers"]>;
  /** Deadline covering fetch and response-body reading. Default: 10,000 ms. */
  readonly timeoutMs?: number;
}

export type DiscoverOptions = z.input<typeof discoveryRequestSchema>;
/** Unwrapped API payload. Scores express relevance, not calibrated confidence. */
export type DiscoveryResponse = WireDiscoveryResponse["data"];
export type { ProviderResponse as Provider } from "../../contracts/src/provider.js";
export type { CapabilityResponse as Capability } from "../../contracts/src/capability.js";
export type {
  DiscoveryProviderResult,
  DiscoveryCapabilityMatch,
} from "../../contracts/src/discovery.js";
