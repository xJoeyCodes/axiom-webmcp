import { Axiom } from "@axiom-webmcp/client";
import { AxiomPublisher } from "@axiom-webmcp/sdk";

import type { FrontendAxiomClient } from "./axiom-client";
import { FrontendAxiomError, toFrontendAxiomError } from "./errors";
import {
  mapDiscoveryResponse,
  mapInspectionResult,
  mapProvider,
  mapPublishResult,
} from "./mappers";
import type {
  AxiomManifest,
  DiscoveryResult,
  ManifestInspectionResult,
  ManifestPublishResult,
  Provider,
} from "../types/axiom";

export interface HttpAxiomClientOptions {
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
  headers?: NonNullable<RequestInit["headers"]>;
  timeoutMs?: number;
}

export class HttpAxiomClient implements FrontendAxiomClient {
  private readonly reader: Axiom;
  private readonly publisher: AxiomPublisher;

  constructor(options: HttpAxiomClientOptions) {
    this.reader = new Axiom(options);
    this.publisher = new AxiomPublisher(options);
  }

  async discover(query: string): Promise<DiscoveryResult[]> {
    try {
      const response = await this.reader.discover({ intent: query, limit: 10 });
      return mapDiscoveryResponse(response);
    } catch (error) {
      throw toFrontendAxiomError(error);
    }
  }

  async getProvider(slug: string): Promise<Provider | null> {
    try {
      const provider = await this.reader.getProvider(slug);
      const capabilities = await this.reader.getCapabilities(slug);
      return mapProvider(provider, capabilities);
    } catch (error) {
      const mapped = toFrontendAxiomError(error);
      if (mapped.code === "NOT_FOUND") return null;
      throw mapped;
    }
  }

  async inspect(manifest: AxiomManifest): Promise<ManifestInspectionResult> {
    try {
      const response = await this.publisher.inspect(manifest);
      return mapInspectionResult(manifest, response);
    } catch (error) {
      throw toFrontendAxiomError(error);
    }
  }

  async publish(manifest: AxiomManifest): Promise<ManifestPublishResult> {
    try {
      return mapPublishResult(await this.publisher.publish(manifest));
    } catch (error) {
      throw toFrontendAxiomError(error);
    }
  }
}

export { FrontendAxiomError };
