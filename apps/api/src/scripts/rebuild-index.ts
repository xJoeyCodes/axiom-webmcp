import "dotenv/config";

import {
  createDatabase,
  DrizzleCapabilityIndexRepository,
  DrizzleCapabilityRepository,
  DrizzleProviderRepository,
} from "@axiom/db";
import { CapabilityIndexingService } from "@axiom/discovery";

import { createEmbeddingProvider } from "../config/embedding-provider.js";
import { loadEnvironment } from "../config/environment.js";

async function rebuild(): Promise<void> {
  const environment = loadEnvironment();
  const database = createDatabase(environment.DATABASE_URL);
  try {
    const embeddings = createEmbeddingProvider(environment);
    const service = new CapabilityIndexingService(
      new DrizzleProviderRepository(database.db),
      new DrizzleCapabilityRepository(database.db),
      new DrizzleCapabilityIndexRepository(database.db),
      embeddings,
    );
    const result = await service.rebuild();
    process.stdout.write(
      `Index rebuild (${embeddings.provider}) complete: ${result.ready} ready, ${result.unchanged} unchanged, ${result.failed} failed.\n`,
    );
    if (result.failed > 0) process.exitCode = 1;
  } finally {
    await database.client.end({ timeout: 5 });
  }
}

rebuild().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown indexing error";
  process.stderr.write(`Index rebuild failed: ${message}\n`);
  process.exitCode = 1;
});
