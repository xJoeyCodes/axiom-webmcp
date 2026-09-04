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

export const capabilityNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .refine((name) => !/[\u0000-\u001f\u007f]/u.test(name), {
    message: "Capability names cannot contain control characters.",
  });

export const capabilityResponseSchema = z.object({
  id: z.uuid(),
  providerId: z.uuid(),
  name: capabilityNameSchema,
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

export const writeCapabilityRequestSchema = z
  .object({
    name: capabilityNameSchema,
    description: z.string().trim().min(1).max(2_000),
    inputSchema: jsonObjectSchema,
    outputSchema: jsonObjectSchema.nullable().default(null),
    annotations: jsonObjectSchema.default({}),
    specVersion: z.string().trim().max(80).nullable().default(null),
    source: capabilitySourceSchema.default("api"),
  })
  .strict();

export const capabilityParamsSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
    capabilityName: capabilityNameSchema,
  })
  .strict();

export const providerCapabilityParamsSchema = capabilityParamsSchema.pick({
  slug: true,
});

export const capabilityResourceResponseSchema = z.object({
  data: capabilityResponseSchema,
});

export const capabilityListResponseSchema = z.object({
  data: z.array(capabilityResponseSchema),
});

export const capabilityUpsertResponseSchema = z.object({
  data: capabilityResponseSchema,
  meta: z.object({ outcome: z.enum(["created", "updated", "unchanged"]) }),
});

export type CapabilityResponse = z.infer<typeof capabilityResponseSchema>;
export type WriteCapabilityRequest = z.infer<
  typeof writeCapabilityRequestSchema
>;
export type CapabilityResourceResponse = z.infer<
  typeof capabilityResourceResponseSchema
>;
export type CapabilityListResponse = z.infer<
  typeof capabilityListResponseSchema
>;
export type CapabilityUpsertResponse = z.infer<
  typeof capabilityUpsertResponseSchema
>;
