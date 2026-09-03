import { z } from "zod";

import { capabilityResponseSchema } from "./capability.js";
import { providerResponseSchema } from "./provider.js";

export const discoveryRequestSchema = z.object({
  query: z.string().trim().min(1).max(500),
  limit: z.number().int().min(1).max(50).default(10),
});

export const capabilityMatchResponseSchema = z.object({
  capability: capabilityResponseSchema,
  score: z.number().min(0).max(1),
  matchedTerms: z.array(z.string()),
});

export const discoveryResultResponseSchema = z.object({
  provider: providerResponseSchema,
  score: z.number().min(0).max(1),
  matches: z.array(capabilityMatchResponseSchema),
});

export const discoveryResponseSchema = z.object({
  query: z.string(),
  results: z.array(discoveryResultResponseSchema),
});

export type DiscoveryRequest = z.infer<typeof discoveryRequestSchema>;
export type DiscoveryResponse = z.infer<typeof discoveryResponseSchema>;
