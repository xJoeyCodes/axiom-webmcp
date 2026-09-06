import {
  discoveryRequestSchema,
  discoveryResponseSchema,
} from "../../contracts/src/discovery.js";
import {
  providerDetailResponseSchema,
  providerSlugSchema,
} from "../../contracts/src/provider.js";
import {
  capabilityListResponseSchema,
  capabilityNameSchema,
  capabilityResourceResponseSchema,
} from "../../contracts/src/capability.js";
import { routes } from "./routes.js";
import { Transport, validate } from "./transport.js";
import type {
  AxiomOptions,
  Capability,
  DiscoverOptions,
  DiscoveryResponse,
  Provider,
} from "./types.js";

/** Framework-neutral read client for the versioned Axiom API. */
export class Axiom {
  private readonly transport: Transport;

  constructor(options: AxiomOptions) {
    this.transport = new Transport(options);
  }

  /** Discover providers and capability contracts matching a natural-language intent. */
  async discover(options: DiscoverOptions): Promise<DiscoveryResponse> {
    const input = validate(discoveryRequestSchema, options);
    return (
      await this.transport.request(
        routes.discover,
        discoveryResponseSchema,
        input,
      )
    ).data;
  }

  /** Retrieve provider metadata. Capabilities are fetched separately; missing providers throw NOT_FOUND. */
  async getProvider(slug: string): Promise<Provider> {
    return (
      await this.transport.request(
        routes.provider(validate(providerSlugSchema, slug)),
        providerDetailResponseSchema,
      )
    ).data;
  }

  /** Retrieve the provider's active capabilities in server-defined order. */
  async getCapabilities(providerSlug: string): Promise<Capability[]> {
    return (
      await this.transport.request(
        routes.capabilities(validate(providerSlugSchema, providerSlug)),
        capabilityListResponseSchema,
      )
    ).data;
  }

  /** Retrieve one capability contract without executing it. */
  async getCapability(
    providerSlug: string,
    capabilityName: string,
  ): Promise<Capability> {
    const slug = validate(providerSlugSchema, providerSlug);
    const name = validate(capabilityNameSchema, capabilityName);
    return (
      await this.transport.request(
        routes.capability(slug, name),
        capabilityResourceResponseSchema,
      )
    ).data;
  }
}
