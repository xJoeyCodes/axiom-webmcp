import {
  providerDetailResponseSchema,
  providerListQuerySchema,
  providerListResponseSchema,
  providerParamsSchema,
  providerResourceResponseSchema,
  registerProviderRequestSchema,
  updateProviderRequestSchema,
} from "@axiom/contracts";
import type { CapabilityService, ProviderService } from "@axiom/registry";
import type { FastifyInstance } from "fastify";

import { toProviderResponse } from "../../transport/mappers.js";

export interface ProviderRoutesOptions {
  readonly providerService: ProviderService;
  readonly capabilityService: CapabilityService;
}

export async function registerProviderRoutes(
  app: FastifyInstance,
  options: ProviderRoutesOptions,
): Promise<void> {
  app.post("/providers", async (request, reply) => {
    const input = registerProviderRequestSchema.parse(request.body);
    const provider = await options.providerService.registerProvider({
      name: input.name,
      domain: input.domain,
      canonicalUrl: input.canonicalUrl,
      description: input.description,
      ...(input.slug === undefined ? {} : { slug: input.slug }),
    });

    request.log.info(
      {
        event: "provider_created",
        providerId: provider.id,
        domain: provider.domain,
      },
      "Provider registered",
    );
    return reply.status(201).send(
      providerResourceResponseSchema.parse({
        data: toProviderResponse(provider),
      }),
    );
  });

  app.get("/providers", async (request) => {
    const query = providerListQuerySchema.parse(request.query);
    const page = await options.providerService.listProviders({
      limit: query.limit,
      offset: query.offset,
      ...(query.status === undefined ? {} : { status: query.status }),
    });

    return providerListResponseSchema.parse({
      data: page.items.map(toProviderResponse),
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total: page.total,
      },
    });
  });

  app.get("/providers/:slug", async (request) => {
    const { slug } = providerParamsSchema.parse(request.params);
    const [provider, capabilities] = await Promise.all([
      options.providerService.getProvider(slug),
      options.capabilityService.listCapabilities(slug),
    ]);

    return providerDetailResponseSchema.parse({
      data: toProviderResponse(provider),
      meta: { capabilityCount: capabilities.length },
    });
  });

  app.patch("/providers/:slug", async (request) => {
    const { slug } = providerParamsSchema.parse(request.params);
    const input = updateProviderRequestSchema.parse(request.body);
    const provider = await options.providerService.updateProvider(slug, {
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.description === undefined
        ? {}
        : { description: input.description }),
      ...(input.canonicalUrl === undefined
        ? {}
        : { canonicalUrl: input.canonicalUrl }),
    });

    request.log.info(
      { event: "provider_updated", providerId: provider.id },
      "Provider metadata updated",
    );
    return providerResourceResponseSchema.parse({
      data: toProviderResponse(provider),
    });
  });
}
