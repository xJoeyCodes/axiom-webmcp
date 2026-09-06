import type { NormalizedPublication } from "../types.js";

export interface CapabilitySourceAdapter {
  readonly source: "api" | "manifest";
  ingest(input: unknown): NormalizedPublication;
}
