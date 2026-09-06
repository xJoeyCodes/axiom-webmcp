import type { JsonValue } from "./json.js";

export type JsonSchemaType =
  "null" | "boolean" | "object" | "array" | "number" | "string" | "integer";

export interface CapabilitySchema {
  readonly [keyword: string]: JsonValue | undefined;
  readonly $schema?: string;
  readonly $id?: string;
  readonly title?: string;
  readonly description?: string;
  readonly type?: JsonSchemaType | JsonSchemaType[];
  readonly properties?: Record<string, CapabilitySchema>;
  readonly required?: string[];
  readonly items?: CapabilitySchema | CapabilitySchema[];
  readonly additionalProperties?: boolean | CapabilitySchema;
}

export interface CapabilityAnnotations {
  readonly [annotation: string]: JsonValue | undefined;
  readonly readOnly?: boolean;
  readonly destructive?: boolean;
  readonly requiresConfirmation?: boolean;
  readonly authenticated?: boolean;
  readonly sideEffecting?: boolean;
}

export type CapabilityStatus = "active" | "disabled" | "deprecated";

export type CapabilitySource =
  "cli" | "api" | "manifest" | "browser-inspection" | "manual";

export interface Capability {
  readonly id: string;
  readonly providerId: string;
  readonly name: string;
  readonly description: string;
  readonly inputSchema: CapabilitySchema;
  readonly outputSchema: CapabilitySchema | null;
  readonly annotations: CapabilityAnnotations;
  readonly specVersion: string | null;
  readonly source: CapabilitySource;
  readonly status: CapabilityStatus;
  readonly contentHash: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CapabilityContract {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: CapabilitySchema;
  readonly outputSchema?: CapabilitySchema | null;
  readonly annotations?: CapabilityAnnotations;
}
