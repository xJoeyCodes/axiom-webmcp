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

export const providerResponseSchema = z.object({
  id: z.uuid(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
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

export type ProviderResponse = z.infer<typeof providerResponseSchema>;
