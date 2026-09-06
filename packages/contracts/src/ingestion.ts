import { z } from "zod";

import { capabilityResponseSchema } from "./capability.js";
import { jsonObjectSchema } from "./common.js";
import { providerResponseSchema } from "./provider.js";

const providerPublicationSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    domain: z.string().trim().min(1).max(500),
    canonicalUrl: z.string().trim().min(1).max(2_048),
    description: z.string().trim().min(1).max(4_000),
  })
  .strict();

const publicationCapabilitySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(128)
      .refine((name) => !/[\u0000-\u001f\u007f]/u.test(name), {
        message: "Capability names cannot contain control characters.",
      }),
    description: z.string().trim().min(1).max(4_000),
    inputSchema: jsonObjectSchema,
    outputSchema: jsonObjectSchema.nullable().optional(),
    annotations: jsonObjectSchema.optional(),
    specVersion: z.string().trim().max(80).nullable().optional(),
  })
  .strict();

export const axiomManifestSchema = z
  .object({
    version: z.literal("1"),
    provider: providerPublicationSchema,
    capabilities: z.array(publicationCapabilitySchema).min(1).max(100),
  })
  .strict();

export const apiPublicationRequestSchema = z
  .object({
    source: z.literal("api"),
    mode: z.literal("merge").default("merge"),
    provider: providerPublicationSchema,
    capabilities: z.array(publicationCapabilitySchema).min(1).max(100),
  })
  .strict();

export const manifestPublicationRequestSchema = z
  .object({
    source: z.literal("manifest"),
    mode: z.literal("merge").default("merge"),
    manifest: axiomManifestSchema,
  })
  .strict();

export const publicationRequestSchema = z.discriminatedUnion("source", [
  apiPublicationRequestSchema,
  manifestPublicationRequestSchema,
]);

export const publicationCapabilityActionSchema = z.enum([
  "create",
  "update",
  "unchanged",
  "remove",
]);

export const publicationWarningSchema = z.object({
  code: z.enum([
    "MISSING_OUTPUT_SCHEMA",
    "SHORT_DESCRIPTION",
    "MUTATION_ANNOTATIONS_MISSING",
  ]),
  capability: z.string(),
  message: z.string(),
});

export const publicationSummarySchema = z.object({
  total: z.number().int().min(0),
  create: z.number().int().min(0),
  update: z.number().int().min(0),
  unchanged: z.number().int().min(0),
  remove: z.number().int().min(0),
});

export const publicationPlanSchema = z.object({
  mode: z.literal("merge"),
  provider: z.object({
    action: z.enum(["create", "update", "unchanged"]),
    slug: z.string().nullable(),
    domain: z.string(),
  }),
  summary: publicationSummarySchema,
  capabilities: z.array(
    z.object({
      name: z.string(),
      action: publicationCapabilityActionSchema,
      contentHash: z.string().regex(/^[a-f\d]{64}$/u),
    }),
  ),
});

export const publicationIndexingSummarySchema = z.object({
  ready: z.number().int().min(0),
  failed: z.number().int().min(0),
  unchanged: z.number().int().min(0),
  pending: z.number().int().min(0),
});

export const inspectPublicationResponseSchema = z.object({
  data: z.object({
    valid: z.literal(true),
    plan: publicationPlanSchema,
    warnings: z.array(publicationWarningSchema),
  }),
});

export const publishResponseSchema = z.object({
  data: z.object({
    provider: providerResponseSchema,
    summary: publicationSummarySchema,
    indexing: publicationIndexingSummarySchema,
    capabilities: z.array(capabilityResponseSchema),
    warnings: z.array(publicationWarningSchema),
  }),
});

export const inspectPublicationRequestSchema = publicationRequestSchema;
export const publishRequestSchema = publicationRequestSchema;

export type AxiomManifest = z.infer<typeof axiomManifestSchema>;
export type ManifestProvider = AxiomManifest["provider"];
export type ManifestCapability = AxiomManifest["capabilities"][number];
export type InspectPublicationRequest = z.infer<
  typeof inspectPublicationRequestSchema
>;
export type InspectPublicationResponse = z.infer<
  typeof inspectPublicationResponseSchema
>;
export type PublishRequest = z.infer<typeof publishRequestSchema>;
export type PublishResponse = z.infer<typeof publishResponseSchema>;
export type PublicationPlan = z.infer<typeof publicationPlanSchema>;
export type PublicationCapabilityChange =
  PublicationPlan["capabilities"][number];
export type PublicationWarning = z.infer<typeof publicationWarningSchema>;
