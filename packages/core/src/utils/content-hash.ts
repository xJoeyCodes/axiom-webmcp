import { createHash } from "node:crypto";

import type { CapabilityContract } from "../domain/capability.js";
import type { JsonValue } from "../domain/json.js";

function sortJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter((entry): entry is [string, JsonValue] => entry[1] !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortJson(nested)]),
    );
  }

  return value;
}

export function stableJsonStringify(value: JsonValue): string {
  return JSON.stringify(sortJson(value));
}

export function createCapabilityContentHash(
  contract: CapabilityContract,
): string {
  const normalized = {
    annotations: contract.annotations ?? {},
    description: contract.description.trim(),
    inputSchema: contract.inputSchema,
    name: contract.name.trim(),
    outputSchema: contract.outputSchema ?? null,
  } satisfies JsonValue;

  return createHash("sha256")
    .update(stableJsonStringify(normalized))
    .digest("hex");
}
