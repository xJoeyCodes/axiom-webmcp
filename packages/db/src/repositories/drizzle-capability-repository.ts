import {
  ApplicationError,
  type Capability,
  type CapabilityRepository,
} from "@axiom/core";
import { and, eq, notInArray } from "drizzle-orm";

import type { AxiomDatabase } from "../client.js";
import { mapCapabilityRow, toCapabilityRow } from "../mappers.js";
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

  async findByProvider(providerId: string): Promise<readonly Capability[]> {
    const rows = await this.db
      .select()
      .from(capabilities)
      .where(eq(capabilities.providerId, providerId));
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

  async upsert(capability: Capability): Promise<Capability> {
    const [row] = await this.db
      .insert(capabilities)
      .values(toCapabilityRow(capability))
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
