import { z } from "zod";

import { capabilityResponseSchema } from "./capability.js";

export const providerVerificationStatusSchema = z.enum([
  "unverified",
  "pending",
  "verified",
]);
export const providerStatusSchema = z.enum([
  "draft",
  "active",
  "suspended",
  "archived",
]);
export const providerSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);

export const providerResponseSchema = z.object({
  id: z.uuid(),
  slug: providerSlugSchema,
  name: z.string().min(1).max(200),
  domain: z.string().min(1).max(253),
  canonicalUrl: z.string().url(),
  description: z.string().min(1).max(2_000),
  verificationStatus: providerVerificationStatusSchema,
  status: providerStatusSchema,
  lastIndexedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  capabilities: z.array(capabilityResponseSchema).optional(),
});

export const registerProviderRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    domain: z.string().trim().min(1).max(500),
    canonicalUrl: z.string().trim().min(1).max(2_048),
    description: z.string().trim().min(1).max(2_000),
    slug: providerSlugSchema.optional(),
  })
  .strict();

export const updateProviderRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    canonicalUrl: z.string().trim().min(1).max(2_048).optional(),
    description: z.string().trim().min(1).max(2_000).optional(),
  })
  .strict()
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    {
      message: "At least one editable provider field is required.",
    },
  );

export const providerParamsSchema = z
  .object({ slug: providerSlugSchema })
  .strict();

export const providerListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    status: providerStatusSchema.optional(),
  })
  .strict();

export const providerResourceResponseSchema = z.object({
  data: providerResponseSchema,
});

export const providerDetailResponseSchema = z.object({
  data: providerResponseSchema,
  meta: z.object({ capabilityCount: z.number().int().min(0) }),
});

export const providerListResponseSchema = z.object({
  data: z.array(providerResponseSchema),
  pagination: z.object({
    limit: z.number().int().positive(),
    offset: z.number().int().min(0),
    total: z.number().int().min(0),
  }),
});

export type ProviderResponse = z.infer<typeof providerResponseSchema>;
export type RegisterProviderRequest = z.infer<
  typeof registerProviderRequestSchema
>;
export type UpdateProviderRequest = z.infer<typeof updateProviderRequestSchema>;
export type ProviderListQuery = z.infer<typeof providerListQuerySchema>;
export type ProviderResourceResponse = z.infer<
  typeof providerResourceResponseSchema
>;
export type ProviderDetailResponse = z.infer<
  typeof providerDetailResponseSchema
>;
export type ProviderListResponse = z.infer<typeof providerListResponseSchema>;
