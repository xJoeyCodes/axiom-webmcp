import { z } from "zod";

import { jsonObjectSchema } from "./common.js";

export const capabilitySourceSchema = z.enum([
  "cli",
  "api",
  "manifest",
  "browser-inspection",
  "manual",
]);

export const capabilityStatusSchema = z.enum([
  "active",
  "disabled",
  "deprecated",
]);

export const capabilityResponseSchema = z.object({
  id: z.uuid(),
  providerId: z.uuid(),
  name: z.string().min(1).max(160),
  description: z.string().min(1).max(2_000),
  inputSchema: jsonObjectSchema,
  outputSchema: jsonObjectSchema.nullable(),
  annotations: jsonObjectSchema,
  specVersion: z.string().max(80).nullable(),
  source: capabilitySourceSchema,
  status: capabilityStatusSchema,
  contentHash: z.string().regex(/^[a-f\d]{64}$/u),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type CapabilityResponse = z.infer<typeof capabilityResponseSchema>;
