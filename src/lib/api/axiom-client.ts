import type {
  DiscoveryResult,
  InspectionResult,
  Provider,
  PublishInput,
  PublishResult,
} from "@/lib/types/axiom";

export interface AxiomClient {
  discover(query: string): Promise<DiscoveryResult[]>;
  getProvider(slug: string): Promise<Provider | null>;
  inspect(url: string): Promise<InspectionResult>;
  publish(input: PublishInput): Promise<PublishResult>;
}
