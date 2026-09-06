import type { DiscoveryService } from "@axiom/discovery";
import type {
  PublicationInspectionService,
  PublicationService,
} from "@axiom/ingestion";
import type { CapabilityService, ProviderService } from "@axiom/registry";
import type { FastifyInstance } from "fastify";

import { registerCapabilityRoutes } from "./capabilities.js";
import { registerDiscoveryRoutes } from "./discovery.js";
import { registerPublicationRoutes } from "./publications.js";
import { registerProviderRoutes } from "./providers.js";

export interface RegistryRoutesOptions {
  readonly providerService: ProviderService;
  readonly capabilityService: CapabilityService;
  readonly inspectionService: PublicationInspectionService;
  readonly publicationService: PublicationService;
  readonly discoveryService: DiscoveryService;
}

export async function registerRegistryRoutes(
  app: FastifyInstance,
  options: RegistryRoutesOptions,
): Promise<void> {
  await app.register(registerProviderRoutes, {
    providerService: options.providerService,
    capabilityService: options.capabilityService,
  });
  await app.register(registerCapabilityRoutes, {
    capabilityService: options.capabilityService,
  });
  await app.register(registerPublicationRoutes, {
    inspectionService: options.inspectionService,
    publicationService: options.publicationService,
    capabilityService: options.capabilityService,
  });
  await app.register(registerDiscoveryRoutes, {
    discoveryService: options.discoveryService,
  });
}
