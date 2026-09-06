import type { FrontendAxiomClient } from "../api/axiom-client";
import { mapManifestCapability } from "../api/mappers";
import type {
  AxiomManifest,
  ManifestInspectionResult,
  ManifestPublishResult,
  Provider,
} from "../types/axiom";
import { mockInspectionProvider } from "./inspection-provider";
import { MockAxiomClient } from "./mock-axiom-client";
import { mockProviders } from "./providers";

function slugFromName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
}

export class MockFrontendAxiomClient implements FrontendAxiomClient {
  private readonly reader = new MockAxiomClient([
    ...mockProviders,
    mockInspectionProvider,
  ]);

  discover(query: string) {
    return this.reader.discover(query);
  }

  getProvider(slug: string) {
    return this.reader.getProvider(slug);
  }

  async inspect(manifest: AxiomManifest): Promise<ManifestInspectionResult> {
    return {
      manifest,
      providerAction: "create",
      providerSlug: null,
      summary: {
        total: manifest.capabilities.length,
        create: manifest.capabilities.length,
        update: 0,
        unchanged: 0,
        remove: 0,
      },
      capabilities: manifest.capabilities.map((capability, index) => ({
        capability: mapManifestCapability(capability, index),
        action: "create",
      })),
      warnings: [],
    };
  }

  async publish(manifest: AxiomManifest): Promise<ManifestPublishResult> {
    const capabilities = manifest.capabilities.map(mapManifestCapability);
    const provider: Provider = {
      id: `offline-${manifest.provider.domain}`,
      slug: slugFromName(manifest.provider.name),
      name: manifest.provider.name,
      domain: manifest.provider.domain,
      canonicalUrl: manifest.provider.canonicalUrl,
      description: manifest.provider.description,
      verified: false,
      verificationStatus: "unverified",
      lastIndexed: new Date().toISOString(),
      capabilities,
      metadata: {},
    };

    return {
      provider,
      summary: {
        total: capabilities.length,
        create: capabilities.length,
        update: 0,
        unchanged: 0,
        remove: 0,
      },
      indexing: {
        ready: capabilities.length,
        failed: 0,
        pending: 0,
        unchanged: 0,
      },
      warnings: [],
    };
  }
}
