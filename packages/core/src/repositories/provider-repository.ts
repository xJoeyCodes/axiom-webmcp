import type { Provider } from "../domain/provider.js";

export interface ProviderRepository {
  findById(id: string): Promise<Provider | null>;
  findBySlug(slug: string): Promise<Provider | null>;
  findByDomain(domain: string): Promise<Provider | null>;
  upsert(provider: Provider): Promise<Provider>;
}
