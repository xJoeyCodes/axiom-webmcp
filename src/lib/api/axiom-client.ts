import type {
  AxiomManifest,
  DiscoveryResult,
  ManifestInspectionResult,
  ManifestPublishResult,
  Provider,
} from "@/lib/types/axiom";

export interface AxiomClient {
  discover(query: string): Promise<DiscoveryResult[]>;
  getProvider(slug: string): Promise<Provider | null>;
}

export interface AxiomPublishingClient {
  inspect(manifest: AxiomManifest): Promise<ManifestInspectionResult>;
  publish(manifest: AxiomManifest): Promise<ManifestPublishResult>;
}

export interface FrontendAxiomClient
  extends AxiomClient, AxiomPublishingClient {}
