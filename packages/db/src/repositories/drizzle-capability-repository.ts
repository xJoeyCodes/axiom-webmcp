import {
  ApplicationError,
  type Capability,
  type CapabilityPersistenceOptions,
  type CapabilityRepository,
  type CapabilityStatus,
} from "@axiom/core";
import { and, asc, eq, notInArray } from "drizzle-orm";

import type { AxiomDatabase } from "../client.js";
import { mapCapabilityRow, toCapabilityRow } from "../mappers.js";
import { isPostgresUniqueViolation } from "../postgres-errors.js";
import { capabilities } from "../schema.js";

export class DrizzleCapabilityRepository implements CapabilityRepository {
  constructor(private readonly db: AxiomDatabase) {}

  async findById(id: string): Promise<Capability | null> {
    const [row] = await this.db
      .select()
      .from(capabilities)
      .where(eq(capabilities.id, id))
      .limit(1);
    return row ? mapCapabilityRow(row) : null;
  }

  async findByProvider(
    providerId: string,
    status?: CapabilityStatus,
  ): Promise<readonly Capability[]> {
    const condition = status
      ? and(
          eq(capabilities.providerId, providerId),
          eq(capabilities.status, status),
        )
      : eq(capabilities.providerId, providerId);
    const rows = await this.db
      .select()
      .from(capabilities)
      .where(condition)
      .orderBy(asc(capabilities.name));
    return rows.map(mapCapabilityRow);
  }

  async findByProviderAndName(
    providerId: string,
    name: string,
  ): Promise<Capability | null> {
    const [row] = await this.db
      .select()
      .from(capabilities)
      .where(
        and(
          eq(capabilities.providerId, providerId),
          eq(capabilities.name, name),
        ),
      )
      .limit(1);
    return row ? mapCapabilityRow(row) : null;
  }

  async create(
    capability: Capability,
    options?: CapabilityPersistenceOptions,
  ): Promise<Capability> {
    try {
      const [row] = await this.db
        .insert(capabilities)
        .values(toCapabilityRow(capability, options?.rawContract))
        .returning();
      if (!row) {
        throw new ApplicationError(
          "INTERNAL_ERROR",
          "Capability insert returned no record.",
        );
      }
      return mapCapabilityRow(row);
    } catch (error) {
      if (isPostgresUniqueViolation(error)) {
        throw new ApplicationError(
          "CONFLICT",
          "That capability is already registered for this provider.",
          { cause: error },
        );
      }
      throw error;
    }
  }

  async upsert(
    capability: Capability,
    options?: CapabilityPersistenceOptions,
  ): Promise<Capability> {
    const rawContractUpdate =
      options?.rawContract === undefined
        ? {}
        : { rawContract: options.rawContract };
    const [row] = await this.db
      .insert(capabilities)
      .values(toCapabilityRow(capability, options?.rawContract))
      .onConflictDoUpdate({
        target: [capabilities.providerId, capabilities.name],
        set: {
          description: capability.description,
          inputSchema: capability.inputSchema,
          outputSchema: capability.outputSchema,
          annotations: capability.annotations,
          specVersion: capability.specVersion,
          source: capability.source,
          status: capability.status,
          contentHash: capability.contentHash,
          ...rawContractUpdate,
          updatedAt: capability.updatedAt,
        },
      })
      .returning();

    if (!row) {
      throw new ApplicationError(
        "INTERNAL_ERROR",
        "Capability upsert returned no record.",
      );
    }

    return mapCapabilityRow(row);
  }

  async deleteMissingForProvider(
    providerId: string,
    retainedNames: readonly string[],
  ): Promise<number> {
    const condition =
      retainedNames.length === 0
        ? eq(capabilities.providerId, providerId)
        : and(
            eq(capabilities.providerId, providerId),
            notInArray(capabilities.name, [...retainedNames]),
          );
    const rows = await this.db
      .delete(capabilities)
      .where(condition)
      .returning({ id: capabilities.id });
    return rows.length;
  }
}
