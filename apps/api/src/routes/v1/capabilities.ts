import {
  capabilityListResponseSchema,
  capabilityParamsSchema,
  capabilityResourceResponseSchema,
  capabilityUpsertResponseSchema,
  providerCapabilityParamsSchema,
  writeCapabilityRequestSchema,
  type WriteCapabilityRequest,
} from "@axiom/contracts";
import type { CapabilityAnnotations, CapabilitySchema } from "@axiom/core";
import type { CapabilityService, WriteCapabilityInput } from "@axiom/registry";
import type { FastifyInstance } from "fastify";

import { toCapabilityResponse } from "../../transport/mappers.js";

export interface CapabilityRoutesOptions {
  readonly capabilityService: CapabilityService;
}

function toServiceInput(input: WriteCapabilityRequest): WriteCapabilityInput {
  return {
    name: input.name,
    description: input.description,
    inputSchema: input.inputSchema as CapabilitySchema,
    outputSchema: input.outputSchema as CapabilitySchema | null,
    annotations: input.annotations as CapabilityAnnotations,
    specVersion: input.specVersion,
    source: input.source,
  };
}

export async function registerCapabilityRoutes(
  app: FastifyInstance,
  options: CapabilityRoutesOptions,
): Promise<void> {
  app.post("/providers/:slug/capabilities", async (request, reply) => {
    const { slug } = providerCapabilityParamsSchema.parse(request.params);
    const input = writeCapabilityRequestSchema.parse(request.body);
    const capability = await options.capabilityService.registerCapability(
      slug,
      toServiceInput(input),
    );

    request.log.info(
      {
        event: "capability_created",
        providerId: capability.providerId,
        capabilityName: capability.name,
      },
      "Capability registered",
    );
    return reply.status(201).send(
      capabilityResourceResponseSchema.parse({
        data: toCapabilityResponse(capability),
      }),
    );
  });

  app.get("/providers/:slug/capabilities", async (request) => {
    const { slug } = providerCapabilityParamsSchema.parse(request.params);
    const capabilities = await options.capabilityService.listCapabilities(slug);

    return capabilityListResponseSchema.parse({
      data: capabilities.map(toCapabilityResponse),
    });
  });

  app.get("/providers/:slug/capabilities/:capabilityName", async (request) => {
    const { slug, capabilityName } = capabilityParamsSchema.parse(
      request.params,
    );
    const capability = await options.capabilityService.getCapability(
      slug,
      capabilityName,
    );

    return capabilityResourceResponseSchema.parse({
      data: toCapabilityResponse(capability),
    });
  });

  app.put(
    "/providers/:slug/capabilities/:capabilityName",
    async (request, reply) => {
      const { slug, capabilityName } = capabilityParamsSchema.parse(
        request.params,
      );
      const input = writeCapabilityRequestSchema.parse(request.body);
      const result = await options.capabilityService.upsertCapability(
        slug,
        capabilityName,
        toServiceInput(input),
      );

      if (result.outcome !== "unchanged") {
        request.log.info(
          {
            event: `capability_${result.outcome}`,
            providerId: result.capability.providerId,
            capabilityName: result.capability.name,
          },
          `Capability ${result.outcome}`,
        );
      }
      return reply.status(result.outcome === "created" ? 201 : 200).send(
        capabilityUpsertResponseSchema.parse({
          data: toCapabilityResponse(result.capability),
          meta: { outcome: result.outcome },
        }),
      );
    },
  );
}
