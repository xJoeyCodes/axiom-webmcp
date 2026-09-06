import { z } from "zod";

import { capabilityResponseSchema } from "./capability.js";
import { providerResponseSchema } from "./provider.js";

export const discoveryRequestSchema = z
  .object({
    intent: z.string().trim().min(1).max(500),
    limit: z.number().int().min(1).max(50).default(10),
    minimumScore: z.number().min(0).max(1).optional(),
  })
  .strict();

export const discoveryCapabilityMatchSchema = z.object({
  capability: capabilityResponseSchema,
  score: z.number().min(0).max(1),
  matchedTerms: z.array(z.string()),
});

export const discoveryProviderResultSchema = z.object({
  provider: providerResponseSchema,
  score: z.number().min(0).max(1),
  matchedCapabilities: z.array(discoveryCapabilityMatchSchema),
});

export const discoveryResponseSchema = z.object({
  data: z.object({
    query: z.object({ intent: z.string() }),
    results: z.array(discoveryProviderResultSchema),
    count: z.number().int().min(0),
  }),
});

export type DiscoveryRequest = z.infer<typeof discoveryRequestSchema>;
export type DiscoveryCapabilityMatch = z.infer<
  typeof discoveryCapabilityMatchSchema
>;
export type DiscoveryProviderResult = z.infer<
  typeof discoveryProviderResultSchema
>;
export type DiscoveryResponse = z.infer<typeof discoveryResponseSchema>;
