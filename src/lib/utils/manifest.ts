import { axiomManifestSchema } from "@axiom-webmcp/sdk";

import type { AxiomManifest } from "../types/axiom";

export type ManifestParseResult =
  | { success: true; manifest: AxiomManifest }
  | { success: false; message: string };

export function parseManifestJson(value: string): ManifestParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return { success: false, message: "Manifest must be valid JSON." };
  }

  const result = axiomManifestSchema.safeParse(parsed);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.length ? `${issue.path.join(".")}: ` : "";
    return {
      success: false,
      message: `${path}${issue?.message ?? "Manifest is invalid."}`,
    };
  }

  return { success: true, manifest: result.data };
}
