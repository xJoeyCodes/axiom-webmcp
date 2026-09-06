import {
  discoveryRequestSchema,
  discoveryResponseSchema,
} from "@axiom/contracts";
import type { DiscoveryService } from "@axiom/discovery";
import type { FastifyInstance } from "fastify";

import {
  toCapabilityResponse,
  toProviderResponse,
} from "../../transport/mappers.js";

export interface DiscoveryRoutesOptions {
  readonly discoveryService: DiscoveryService;
}

export async function registerDiscoveryRoutes(
  app: FastifyInstance,
  options: DiscoveryRoutesOptions,
): Promise<void> {
  app.post("/discover", async (request) => {
    const startedAt = performance.now();
    try {
      const input = discoveryRequestSchema.parse(request.body);
      const result = await options.discoveryService.discover(input);
      request.log.info(
        {
          event: "discovery_completed",
          candidateCount: result.candidateCount,
          resultCount: result.results.length,
          durationMs: Math.round(performance.now() - startedAt),
        },
        "Capability discovery completed",
      );
      return discoveryResponseSchema.parse({
        data: {
          query: { intent: result.intent },
          count: result.results.length,
          results: result.results.map((item) => ({
            provider: toProviderResponse(item.provider),
            score: item.score,
            matchedCapabilities: item.capabilities.map((match) => ({
              capability: toCapabilityResponse(match.candidate.capability),
              score: match.score,
              matchedTerms: [...match.matchedTerms],
            })),
          })),
        },
      });
    } catch (error) {
      request.log.warn(
        {
          event: "discovery_failed",
          durationMs: Math.round(performance.now() - startedAt),
        },
        "Capability discovery failed",
      );
      throw error;
    }
  });
}
