import type { Provider, ProviderStatus } from "../domain/provider.js";

export interface ProviderListOptions {
  readonly limit: number;
  readonly offset: number;
  readonly status?: ProviderStatus;
}

export interface ProviderPage {
  readonly items: readonly Provider[];
  readonly total: number;
}

export interface ProviderRepository {
  findById(id: string): Promise<Provider | null>;
  findBySlug(slug: string): Promise<Provider | null>;
  findByDomain(domain: string): Promise<Provider | null>;
  list(options: ProviderListOptions): Promise<ProviderPage>;
  create(provider: Provider): Promise<Provider>;
  update(provider: Provider): Promise<Provider>;
  upsert(provider: Provider): Promise<Provider>;
}
