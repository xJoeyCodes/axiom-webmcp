import type { Capability, CapabilitySchema, Provider } from "@axiom/core";

export const SEARCH_DOCUMENT_VERSION = "1";

function collectSchemaSemantics(
  schema: CapabilitySchema,
  path: string[] = [],
): string[] {
  const values: string[] = [];
  if (schema.description) {
    values.push(`${path.join(".")}: ${schema.description}`);
  }

  for (const [name, property] of Object.entries(schema.properties ?? {}).sort(
    ([left], [right]) => left.localeCompare(right),
  )) {
    const propertyPath = [...path, name];
    values.push(propertyPath.join("."));
    values.push(...collectSchemaSemantics(property, propertyPath));
    const enumValues = property.enum;
    if (Array.isArray(enumValues)) {
      const meaningful = enumValues.filter(
        (value): value is string => typeof value === "string",
      );
      if (meaningful.length > 0) {
        values.push(`${propertyPath.join(".")}: ${meaningful.join(", ")}`);
      }
    }
  }
  return values;
}

export class CapabilitySearchDocumentBuilder {
  readonly version = SEARCH_DOCUMENT_VERSION;

  build(provider: Provider, capability: Capability): string {
    const inputs = [...new Set(collectSchemaSemantics(capability.inputSchema))];
    return [
      `Capability: ${capability.name}`,
      `Provider: ${provider.name}`,
      `Provider description: ${provider.description}`,
      `Description: ${capability.description}`,
      ...(inputs.length > 0 ? [`Inputs: ${inputs.join("; ")}`] : []),
      `Behavior: ${capability.annotations.readOnly === true ? "read only" : "may change external state"}`,
    ]
      .join("\n")
      .slice(0, 6_000);
  }
}
