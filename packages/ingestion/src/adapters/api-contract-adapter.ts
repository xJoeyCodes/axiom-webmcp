import { apiPublicationRequestSchema } from "@axiom/contracts";

import { normalizePublication } from "../normalize/publication-normalizer.js";
import type { CapabilitySourceAdapter } from "./capability-source-adapter.js";

export class ApiContractAdapter implements CapabilitySourceAdapter {
  readonly source = "api" as const;

  ingest(input: unknown) {
    const parsed = apiPublicationRequestSchema.parse(input);
    return normalizePublication(parsed, "api");
  }
}
