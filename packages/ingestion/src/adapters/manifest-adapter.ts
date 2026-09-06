import { manifestPublicationRequestSchema } from "@axiom/contracts";

import { normalizePublication } from "../normalize/publication-normalizer.js";
import type { CapabilitySourceAdapter } from "./capability-source-adapter.js";

export class ManifestAdapter implements CapabilitySourceAdapter {
  readonly source = "manifest" as const;

  ingest(input: unknown) {
    const parsed = manifestPublicationRequestSchema.parse(input);
    return normalizePublication(
      {
        mode: parsed.mode,
        provider: parsed.manifest.provider,
        capabilities: parsed.manifest.capabilities,
      },
      "manifest",
    );
  }
}
