import { constants } from "node:fs";
import { access, readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { axiomManifestSchema, type AxiomManifest } from "@axiom-webmcp/sdk";

import { CliError, formatValidationIssues } from "./errors.js";

export const DEFAULT_MANIFEST_FILE = "axiom.json";
export const MAX_MANIFEST_BYTES = 2 * 1024 * 1024;

export interface LoadedManifest {
  readonly path: string;
  readonly manifest: AxiomManifest;
}

function manifestPath(cwd: string, file = DEFAULT_MANIFEST_FILE): string {
  return resolve(cwd, file);
}

export async function loadManifest(
  cwd: string,
  file?: string,
): Promise<LoadedManifest> {
  const path = manifestPath(cwd, file);
  try {
    const metadata = await stat(path);
    if (!metadata.isFile()) {
      throw new CliError("Manifest path is not a file.", 2, [path]);
    }
    if (metadata.size > MAX_MANIFEST_BYTES) {
      throw new CliError("Manifest exceeds the 2 MB size limit.", 2, [path]);
    }
    const source = await readFile(path, "utf8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(source);
    } catch {
      throw new CliError("Manifest contains invalid JSON.", 2, [path]);
    }
    const result = axiomManifestSchema.safeParse(parsed);
    if (!result.success) {
      throw new CliError(
        "Manifest invalid.",
        2,
        formatValidationIssues(result.error.issues),
      );
    }
    return { path, manifest: result.data };
  } catch (error) {
    if (error instanceof CliError) throw error;
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : undefined;
    if (code === "ENOENT") {
      throw new CliError("Manifest not found.", 2, [
        path,
        "Run axiom init to create one.",
      ]);
    }
    if (code === "EACCES" || code === "EPERM") {
      throw new CliError("Manifest cannot be read.", 2, [path]);
    }
    throw new CliError("Manifest could not be loaded.", 2, [path]);
  }
}

export const starterManifest: AxiomManifest = {
  version: "1",
  provider: {
    name: "Example WebMCP Site",
    domain: "example.com",
    canonicalUrl: "https://example.com",
    description: "Capabilities exposed by this WebMCP-enabled website.",
  },
  capabilities: [
    {
      name: "search_items",
      description: "Search available items using a text query.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
      annotations: { readOnly: true },
    },
  ],
};

export async function createManifest(
  cwd: string,
  file?: string,
): Promise<{ readonly path: string; readonly created: boolean }> {
  const path = manifestPath(cwd, file);
  try {
    await access(path, constants.F_OK);
    return { path, created: false };
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : undefined;
    if (code !== "ENOENT") {
      throw new CliError("Manifest path cannot be accessed.", 2, [path]);
    }
  }

  try {
    await writeFile(path, `${JSON.stringify(starterManifest, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
    });
    return { path, created: true };
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : undefined;
    if (code === "EEXIST") return { path, created: false };
    throw new CliError("Manifest could not be created.", 2, [path]);
  }
}
