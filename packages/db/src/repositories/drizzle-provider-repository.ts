import {
  ApplicationError,
  normalizeDomain,
  type Provider,
  type ProviderRepository,
} from "@axiom/core";
import { eq } from "drizzle-orm";

import type { AxiomDatabase } from "../client.js";
import { mapProviderRow, toProviderRow } from "../mappers.js";
import { providers } from "../schema.js";

export class DrizzleProviderRepository implements ProviderRepository {
  constructor(private readonly db: AxiomDatabase) {}

  async findById(id: string): Promise<Provider | null> {
    const [row] = await this.db
      .select()
      .from(providers)
      .where(eq(providers.id, id))
      .limit(1);
    return row ? mapProviderRow(row) : null;
  }

  async findBySlug(slug: string): Promise<Provider | null> {
    const [row] = await this.db
      .select()
      .from(providers)
      .where(eq(providers.slug, slug))
      .limit(1);
    return row ? mapProviderRow(row) : null;
  }

  async findByDomain(domain: string): Promise<Provider | null> {
    const normalized = normalizeDomain(domain);
    const [row] = await this.db
      .select()
      .from(providers)
      .where(eq(providers.domain, normalized))
      .limit(1);
    return row ? mapProviderRow(row) : null;
  }

  async upsert(provider: Provider): Promise<Provider> {
    const [row] = await this.db
      .insert(providers)
      .values(toProviderRow(provider))
      .onConflictDoUpdate({
        target: providers.domain,
        set: {
          slug: provider.slug,
          name: provider.name,
          canonicalUrl: provider.canonicalUrl,
          description: provider.description,
          verificationStatus: provider.verificationStatus,
          status: provider.status,
          lastIndexedAt: provider.lastIndexedAt,
          updatedAt: provider.updatedAt,
        },
      })
      .returning();

    if (!row) {
      throw new ApplicationError(
        "INTERNAL_ERROR",
        "Provider upsert returned no record.",
      );
    }

    return mapProviderRow(row);
  }
}
