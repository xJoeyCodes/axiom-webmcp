import type { RegistryRepositories, RegistryUnitOfWork } from "@axiom/core";

import type { AxiomDatabase } from "./client.js";
import { DrizzleCapabilityRepository } from "./repositories/drizzle-capability-repository.js";
import { DrizzleProviderRepository } from "./repositories/drizzle-provider-repository.js";

export class DrizzleRegistryUnitOfWork implements RegistryUnitOfWork {
  constructor(private readonly db: AxiomDatabase) {}

  execute<T>(
    operation: (repositories: RegistryRepositories) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction((transaction) => {
      // Repositories only use query-builder methods shared by the database and
      // Drizzle transaction objects. Drizzle's public types add `$client` to the
      // former even though it is irrelevant to repository operations.
      const executor = transaction as unknown as AxiomDatabase;
      return operation({
        providers: new DrizzleProviderRepository(executor),
        capabilities: new DrizzleCapabilityRepository(executor),
      });
    });
  }
}
