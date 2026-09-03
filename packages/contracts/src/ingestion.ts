import { z } from "zod";

import { capabilityResponseSchema } from "./capability.js";
import { jsonValueSchema } from "./common.js";
import {
  providerResponseSchema,
  providerVerificationStatusSchema,
} from "./provider.js";

export const inspectionRequestSchema = z.object({
  url: z.string().url(),
});

export const inspectionResponseSchema = z.object({
  url: z.string().url(),
  status: z.enum(["detected", "not_found", "invalid"]),
  provider: providerResponseSchema.nullable(),
  capabilities: z.array(capabilityResponseSchema),
  inspectedAt: z.iso.datetime(),
  warnings: z.array(z.string()),
  rawContract: jsonValueSchema.optional(),
});

export const publishRequestSchema = z.object({
  url: z.string().url(),
  contactEmail: z.email().optional(),
  notes: z.string().max(2_000).optional(),
  rawContract: jsonValueSchema.optional(),
});

export const publishResponseSchema = z.object({
  submissionId: z.uuid(),
  status: z.enum(["accepted", "queued", "rejected"]),
  verificationStatus: providerVerificationStatusSchema,
  message: z.string(),
  provider: providerResponseSchema.optional(),
});

export type InspectionRequest = z.infer<typeof inspectionRequestSchema>;
export type InspectionResponse = z.infer<typeof inspectionResponseSchema>;
export type PublishRequest = z.infer<typeof publishRequestSchema>;
export type PublishResponse = z.infer<typeof publishResponseSchema>;
