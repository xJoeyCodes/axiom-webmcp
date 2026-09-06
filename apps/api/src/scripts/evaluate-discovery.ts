import "dotenv/config";

import { createDatabase, DrizzleCapabilityIndexRepository } from "@axiom/db";
import { DiscoveryService, evaluateDiscovery } from "@axiom/discovery";

import { createEmbeddingProvider } from "../config/embedding-provider.js";
import { loadEnvironment } from "../config/environment.js";

async function evaluate(): Promise<void> {
  const environment = loadEnvironment();
  const database = createDatabase(environment.DATABASE_URL);
  try {
    const embeddings = createEmbeddingProvider(environment);
    const service = new DiscoveryService(
      embeddings,
      new DrizzleCapabilityIndexRepository(database.db),
    );
    const summary = await evaluateDiscovery(async (intent) => {
      const result = await service.discover({ intent, limit: 10 });
      return result.results;
    });
    process.stdout.write(
      [
        `Discovery Evaluation (${embeddings.provider})`,
        `Queries: ${summary.queries}`,
        `Top-1 provider: ${summary.top1Provider}/${summary.queries}`,
        `Top-3 provider: ${summary.top3Provider}/${summary.queries}`,
        `Capability hit: ${summary.capabilityHit}/${summary.queries}`,
      ].join("\n") + "\n",
    );
  } finally {
    await database.client.end({ timeout: 5 });
  }
}

evaluate().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown evaluation error";
  process.stderr.write(`Discovery evaluation failed: ${message}\n`);
  process.exitCode = 1;
});
