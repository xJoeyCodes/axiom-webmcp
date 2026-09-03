import type { WebMCPSchema } from "@/lib/types/axiom";

export interface SchemaChild {
  name: string;
  required: boolean;
  schema: WebMCPSchema;
}

function baseType(schema: WebMCPSchema | undefined): string {
  if (!schema?.type) return "unknown";
  if (Array.isArray(schema.type)) return schema.type.join(" | ");
  if (schema.type === "array") {
    return `${baseType(schema.items)}[]`;
  }
  return schema.title ?? schema.type;
}

export function schemaTypeLabel(schema: WebMCPSchema): string {
  const type = baseType(schema);
  return schema.format ? `${type}<${schema.format}>` : type;
}

export function schemaChildren(schema: WebMCPSchema): SchemaChild[] {
  const container = schema.type === "array" ? schema.items : schema;
  const properties = container?.properties;

  if (!properties) return [];

  const required = new Set(container.required ?? []);
  return Object.entries(properties).map(([name, childSchema]) => ({
    name,
    required: required.has(name),
    schema: childSchema,
  }));
}

export function schemaValueLabel(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}
