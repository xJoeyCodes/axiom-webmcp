import { ApplicationError, stableJsonStringify } from "@axiom/core";

import type { NormalizedPublication, PublicationWarning } from "../types.js";

const MAX_SCHEMA_BYTES = 131_072;

export function validatePublication(
  publication: NormalizedPublication,
): readonly PublicationWarning[] {
  const seen = new Set<string>();
  const issues: Array<{ path: string; message: string }> = [];
  const warnings: PublicationWarning[] = [];

  for (const [index, capability] of publication.capabilities.entries()) {
    if (seen.has(capability.name)) {
      issues.push({
        path: `capabilities[${index}].name`,
        message: `Capability ${capability.name} appears more than once.`,
      });
    }
    seen.add(capability.name);

    if (capability.description.length < 24) {
      warnings.push({
        code: "SHORT_DESCRIPTION",
        capability: capability.name,
        message: "A fuller description will improve capability discovery.",
      });
    }
    if (capability.outputSchema === null) {
      warnings.push({
        code: "MISSING_OUTPUT_SCHEMA",
        capability: capability.name,
        message: "No output schema was supplied.",
      });
    }
    if (
      (capability.annotations.readOnly === false ||
        capability.annotations.sideEffecting === true) &&
      capability.annotations.requiresConfirmation === undefined &&
      capability.annotations.destructive === undefined
    ) {
      warnings.push({
        code: "MUTATION_ANNOTATIONS_MISSING",
        capability: capability.name,
        message:
          "Mutating capabilities should describe confirmation or destructive behavior.",
      });
    }

    const schemaBytes = Buffer.byteLength(
      stableJsonStringify({
        inputSchema: capability.inputSchema,
        outputSchema: capability.outputSchema,
      }),
      "utf8",
    );
    if (schemaBytes > MAX_SCHEMA_BYTES) {
      issues.push({
        path: `capabilities[${index}]`,
        message: `Capability schemas must be at most ${MAX_SCHEMA_BYTES} bytes.`,
      });
    }
  }

  if (issues.length > 0) {
    throw new ApplicationError(
      "VALIDATION_ERROR",
      "Publication contains invalid capabilities.",
      { details: { issues } },
    );
  }

  return warnings;
}
