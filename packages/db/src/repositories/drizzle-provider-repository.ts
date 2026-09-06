import {
  ApplicationError,
  normalizeDomain,
  type Provider,
  type ProviderListOptions,
  type ProviderPage,
  type ProviderRepository,
} from "@axiom/core";
import { asc, count, eq } from "drizzle-orm";

import type { AxiomDatabase } from "../client.js";
import { mapProviderRow, toProviderRow } from "../mappers.js";
import { isPostgresUniqueViolation } from "../postgres-errors.js";
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

  async list(options: ProviderListOptions): Promise<ProviderPage> {
    const condition = options.status
      ? eq(providers.status, options.status)
      : undefined;
    const [rows, totals] = await Promise.all([
      this.db
        .select()
        .from(providers)
        .where(condition)
        .orderBy(asc(providers.name), asc(providers.id))
        .limit(options.limit)
        .offset(options.offset),
      this.db.select({ value: count() }).from(providers).where(condition),
    ]);

    return { items: rows.map(mapProviderRow), total: totals[0]?.value ?? 0 };
  }

  async create(provider: Provider): Promise<Provider> {
    try {
      const [row] = await this.db
        .insert(providers)
        .values(toProviderRow(provider))
        .returning();
      if (!row) {
        throw new ApplicationError(
          "INTERNAL_ERROR",
          "Provider insert returned no record.",
        );
      }
      return mapProviderRow(row);
    } catch (error) {
      if (isPostgresUniqueViolation(error)) {
        throw new ApplicationError(
          "CONFLICT",
          "A provider with that domain or slug already exists.",
          { cause: error },
        );
      }
      throw error;
    }
  }

  async update(provider: Provider): Promise<Provider> {
    const [row] = await this.db
      .update(providers)
      .set({
        name: provider.name,
        canonicalUrl: provider.canonicalUrl,
        description: provider.description,
        updatedAt: provider.updatedAt,
      })
      .where(eq(providers.id, provider.id))
      .returning();
    if (!row) {
      throw new ApplicationError("NOT_FOUND", "Provider no longer exists.");
    }
    return mapProviderRow(row);
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
