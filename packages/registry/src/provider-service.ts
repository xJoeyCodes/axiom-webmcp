import { randomUUID } from "node:crypto";

import {
  ApplicationError,
  createProviderSlug,
  isValidProviderSlug,
  normalizeDomain,
  normalizeUrl,
  type Provider,
  type ProviderPage,
  type ProviderRepository,
  type ProviderStatus,
} from "@axiom/core";

export interface RegisterProviderInput {
  readonly name: string;
  readonly domain: string;
  readonly canonicalUrl: string;
  readonly description: string;
  readonly slug?: string;
}

export interface ListProvidersInput {
  readonly limit: number;
  readonly offset: number;
  readonly status?: ProviderStatus;
}

export interface UpdateProviderInput {
  readonly name?: string;
  readonly description?: string;
  readonly canonicalUrl?: string;
}

export interface RegistryServiceOptions {
  readonly createId?: () => string;
  readonly now?: () => Date;
}

export class ProviderService {
  private readonly createId: () => string;
  private readonly now: () => Date;

  constructor(
    private readonly providers: ProviderRepository,
    options: RegistryServiceOptions = {},
  ) {
    this.createId = options.createId ?? randomUUID;
    this.now = options.now ?? (() => new Date());
  }

  async registerProvider(input: RegisterProviderInput): Promise<Provider> {
    const domain = normalizeDomain(input.domain);
    const canonicalUrl = normalizeUrl(input.canonicalUrl);
    this.assertCanonicalDomain(domain, canonicalUrl);

    if (await this.providers.findByDomain(domain)) {
      throw new ApplicationError(
        "CONFLICT",
        `A provider is already registered for ${domain}.`,
      );
    }

    const slug = input.slug?.trim() || createProviderSlug(input.name);
    if (!isValidProviderSlug(slug)) {
      throw new ApplicationError(
        "VALIDATION_ERROR",
        "Provider slugs must contain lowercase letters, numbers, and single hyphens only.",
      );
    }
    if (await this.providers.findBySlug(slug)) {
      throw new ApplicationError(
        "CONFLICT",
        `The provider slug ${slug} is already in use.`,
      );
    }

    const timestamp = this.now();
    return this.providers.create({
      id: this.createId(),
      slug,
      name: input.name.trim(),
      domain,
      canonicalUrl,
      description: input.description.trim(),
      verificationStatus: "unverified",
      status: "active",
      lastIndexedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  async getProvider(slug: string): Promise<Provider> {
    const provider = await this.providers.findBySlug(slug);
    if (!provider) {
      throw new ApplicationError(
        "NOT_FOUND",
        `Provider ${slug} was not found.`,
      );
    }
    return provider;
  }

  listProviders(input: ListProvidersInput): Promise<ProviderPage> {
    return this.providers.list(input);
  }

  async updateProvider(
    slug: string,
    input: UpdateProviderInput,
  ): Promise<Provider> {
    const provider = await this.getProvider(slug);
    const canonicalUrl = input.canonicalUrl
      ? normalizeUrl(input.canonicalUrl)
      : provider.canonicalUrl;
    this.assertCanonicalDomain(provider.domain, canonicalUrl);

    return this.providers.update({
      ...provider,
      name: input.name?.trim() ?? provider.name,
      description: input.description?.trim() ?? provider.description,
      canonicalUrl,
      updatedAt: this.now(),
    });
  }

  private assertCanonicalDomain(domain: string, canonicalUrl: string): void {
    if (normalizeDomain(canonicalUrl) !== domain) {
      throw new ApplicationError(
        "VALIDATION_ERROR",
        "canonicalUrl must belong to the provider domain.",
      );
    }
  }
}
