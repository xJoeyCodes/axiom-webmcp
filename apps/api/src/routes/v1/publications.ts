import {
  inspectPublicationRequestSchema,
  inspectPublicationResponseSchema,
  publishRequestSchema,
  publishResponseSchema,
} from "@axiom/contracts";
import type {
  PublicationInspectionService,
  PublicationService,
} from "@axiom/ingestion";
import type { CapabilityService } from "@axiom/registry";
import type { FastifyInstance } from "fastify";

import {
  toCapabilityResponse,
  toProviderResponse,
  toPublicationPlanResponse,
} from "../../transport/mappers.js";

export interface PublicationRoutesOptions {
  readonly inspectionService: PublicationInspectionService;
  readonly publicationService: PublicationService;
  readonly capabilityService: CapabilityService;
}

export async function registerPublicationRoutes(
  app: FastifyInstance,
  options: PublicationRoutesOptions,
): Promise<void> {
  app.post("/inspect", async (request) => {
    try {
      const input = inspectPublicationRequestSchema.parse(request.body);
      const result = await options.inspectionService.inspect(input);
      request.log.info(
        {
          event: "publication_inspected",
          domain: result.plan.provider.domain,
          capabilityCount: result.plan.summary.total,
          createCount: result.plan.summary.create,
          updateCount: result.plan.summary.update,
          unchangedCount: result.plan.summary.unchanged,
        },
        "Publication inspected",
      );
      return inspectPublicationResponseSchema.parse({
        data: {
          valid: result.valid,
          plan: toPublicationPlanResponse(result.plan),
          warnings: result.warnings,
        },
      });
    } catch (error) {
      request.log.warn(
        { event: "publication_inspection_failed" },
        "Publication inspection failed",
      );
      throw error;
    }
  });

  app.post("/publish", async (request, reply) => {
    try {
      const input = publishRequestSchema.parse(request.body);
      const result = await options.publicationService.publish(input);
      const capabilities = await options.capabilityService.listCapabilities(
        result.provider.slug,
      );
      request.log.info(
        {
          event: "publication_completed",
          providerId: result.provider.id,
          domain: result.provider.domain,
          capabilityCount: result.plan.summary.total,
          createCount: result.plan.summary.create,
          updateCount: result.plan.summary.update,
          unchangedCount: result.plan.summary.unchanged,
          indexingReady: result.indexing.ready,
          indexingFailed: result.indexing.failed,
        },
        "Publication completed",
      );
      return reply.status(200).send(
        publishResponseSchema.parse({
          data: {
            provider: toProviderResponse(result.provider),
            summary: result.plan.summary,
            indexing: result.indexing,
            capabilities: capabilities.map(toCapabilityResponse),
            warnings: result.warnings,
          },
        }),
      );
    } catch (error) {
      request.log.warn({ event: "publication_failed" }, "Publication failed");
      throw error;
    }
  });
}
