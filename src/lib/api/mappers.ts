import type {
  Capability as ApiCapability,
  DiscoveryResponse as ApiDiscoveryResponse,
  Provider as ApiProvider,
} from "@axiom-webmcp/client";
import type {
  AxiomManifest,
  InspectResult as ApiInspectResult,
  PublishResult as ApiPublishResult,
} from "@axiom-webmcp/sdk";

import type {
  Capability,
  DiscoveryResult,
  JsonSchemaType,
  JsonSchemaValue,
  ManifestInspectionResult,
  ManifestPublishResult,
  Provider,
  WebMCPSchema,
} from "../types/axiom";

const schemaTypes = new Set<JsonSchemaType>([
  "string",
  "number",
  "integer",
  "boolean",
  "object",
  "array",
  "null",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asSchemaType(value: unknown): JsonSchemaType | undefined {
  return typeof value === "string" && schemaTypes.has(value as JsonSchemaType)
    ? (value as JsonSchemaType)
    : undefined;
}

function asJsonValue(value: unknown): JsonSchemaValue | undefined {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    const values = value.map(asJsonValue);
    return values.every((item) => item !== undefined)
      ? (values as JsonSchemaValue[])
      : undefined;
  }
  if (isRecord(value)) {
    const entries = Object.entries(value)
      .map(([key, item]) => [key, asJsonValue(item)] as const)
      .filter(
        (entry): entry is readonly [string, JsonSchemaValue] =>
          entry[1] !== undefined,
      );
    return Object.fromEntries(entries);
  }
  return undefined;
}

export function mapJsonSchema(value: unknown): WebMCPSchema {
  if (!isRecord(value)) return {};

  const schema: WebMCPSchema = {};
  const singleType = asSchemaType(value.type);
  if (singleType) schema.type = singleType;
  if (Array.isArray(value.type)) {
    const types = value.type
      .map(asSchemaType)
      .filter((type) => type !== undefined);
    if (types.length > 0) schema.type = types;
  }

  for (const key of ["title", "description", "format"] as const) {
    if (typeof value[key] === "string") schema[key] = value[key];
  }

  if (isRecord(value.properties)) {
    schema.properties = Object.fromEntries(
      Object.entries(value.properties).map(([name, field]) => [
        name,
        mapJsonSchema(field),
      ]),
    );
  }
  if (isRecord(value.items)) schema.items = mapJsonSchema(value.items);
  if (Array.isArray(value.required)) {
    schema.required = value.required.filter(
      (item): item is string => typeof item === "string",
    );
  }
  if (Array.isArray(value.enum)) {
    schema.enum = value.enum
      .map(asJsonValue)
      .filter((item): item is JsonSchemaValue => item !== undefined);
  }
  const defaultValue = asJsonValue(value.default);
  if (defaultValue !== undefined) schema.default = defaultValue;
  if (Array.isArray(value.examples)) {
    schema.examples = value.examples
      .map(asJsonValue)
      .filter((item): item is JsonSchemaValue => item !== undefined);
  }
  if (typeof value.additionalProperties === "boolean") {
    schema.additionalProperties = value.additionalProperties;
  } else if (isRecord(value.additionalProperties)) {
    schema.additionalProperties = mapJsonSchema(value.additionalProperties);
  }

  return schema;
}

function annotationBoolean(
  annotations: Readonly<Record<string, unknown>>,
  key: string,
): boolean {
  return annotations[key] === true;
}

function annotationString(
  annotations: Readonly<Record<string, unknown>>,
  key: string,
): string | undefined {
  const value = annotations[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function annotationStrings(
  annotations: Readonly<Record<string, unknown>>,
  key: string,
): string[] {
  const value = annotations[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function mapCapability(
  capability: Pick<
    ApiCapability,
    | "id"
    | "name"
    | "description"
    | "inputSchema"
    | "outputSchema"
    | "annotations"
    | "specVersion"
  >,
): Capability {
  const inputSchema = mapJsonSchema(capability.inputSchema);
  const required = new Set(inputSchema.required ?? []);
  const destructive = annotationBoolean(capability.annotations, "destructive");
  const sideEffecting =
    annotationBoolean(capability.annotations, "sideEffecting") || destructive;
  const category =
    annotationString(capability.annotations, "category") ??
    (sideEffecting ? "action" : "capability");
  const inputFields = Object.entries(inputSchema.properties ?? {}).map(
    ([name, schema]) => ({
      name,
      description: schema.description ?? "No field description supplied.",
      required: required.has(name),
      schema,
    }),
  );
  const inputTypes = Array.isArray(inputSchema.type)
    ? inputSchema.type
    : inputSchema.type
      ? [inputSchema.type]
      : [];
  const hasDirectInput = inputTypes.some(
    (type) => type !== "object" && type !== "null",
  );

  return {
    id: capability.id,
    name: capability.name,
    description: capability.description,
    inputs:
      inputFields.length > 0
        ? inputFields
        : hasDirectInput
          ? [
              {
                name: inputSchema.title ?? "input",
                description:
                  inputSchema.description ?? "Capability input value.",
                required: true,
                schema: inputSchema,
              },
            ]
          : [],
    output: capability.outputSchema
      ? {
          description:
            mapJsonSchema(capability.outputSchema).description ??
            "Declared capability output.",
          schema: mapJsonSchema(capability.outputSchema),
        }
      : undefined,
    metadata: {
      version: capability.specVersion ?? "unspecified",
      category,
      tags: annotationStrings(capability.annotations, "tags"),
      transport: "webmcp",
      destructive,
      sideEffecting,
      requiresConfirmation: annotationBoolean(
        capability.annotations,
        "requiresConfirmation",
      ),
    },
  };
}

export function mapManifestCapability(
  capability: AxiomManifest["capabilities"][number],
  index: number,
): Capability {
  return mapCapability({
    id: `manifest-${index + 1}-${capability.name}`,
    name: capability.name,
    description: capability.description,
    inputSchema: capability.inputSchema,
    outputSchema: capability.outputSchema ?? null,
    annotations: capability.annotations ?? {},
    specVersion: capability.specVersion ?? null,
  });
}

export function mapProvider(
  provider: ApiProvider,
  capabilities: ApiCapability[] = provider.capabilities ?? [],
): Provider {
  return {
    id: provider.id,
    slug: provider.slug,
    name: provider.name,
    domain: provider.domain,
    canonicalUrl: provider.canonicalUrl,
    description: provider.description,
    verified: provider.verificationStatus === "verified",
    verificationStatus: provider.verificationStatus,
    lastIndexed: provider.lastIndexedAt,
    capabilities: capabilities.map(mapCapability),
    metadata: {},
  };
}

function toDisplayScore(score: number): number {
  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

export function mapDiscoveryResponse(
  response: ApiDiscoveryResponse,
): DiscoveryResult[] {
  return response.results.map((result) => {
    const capabilities = result.matchedCapabilities.map((match) =>
      mapCapability(match.capability),
    );
    return {
      provider: mapProvider(
        result.provider,
        result.matchedCapabilities.map((match) => match.capability),
      ),
      score: toDisplayScore(result.score),
      matches: result.matchedCapabilities.map((match, index) => ({
        capability: capabilities[index]!,
        score: toDisplayScore(match.score),
        matchedTerms: match.matchedTerms,
      })),
    };
  });
}

export function mapInspectionResult(
  manifest: AxiomManifest,
  result: ApiInspectResult,
): ManifestInspectionResult {
  const actionByName = new Map(
    result.plan.capabilities.map((change) => [change.name, change.action]),
  );
  return {
    manifest,
    providerAction: result.plan.provider.action,
    providerSlug: result.plan.provider.slug,
    summary: result.plan.summary,
    capabilities: manifest.capabilities.map((capability, index) => ({
      capability: mapManifestCapability(capability, index),
      action: actionByName.get(capability.name) ?? "unchanged",
    })),
    warnings: result.warnings,
  };
}

export function mapPublishResult(
  result: ApiPublishResult,
): ManifestPublishResult {
  return {
    provider: mapProvider(result.provider, result.capabilities),
    summary: result.summary,
    indexing: result.indexing,
    warnings: result.warnings,
  };
}
