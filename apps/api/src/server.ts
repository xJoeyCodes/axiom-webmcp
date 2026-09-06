import "dotenv/config";

import {
  createDatabase,
  DrizzleCapabilityIndexRepository,
  DrizzleCapabilityRepository,
  DrizzleProviderRepository,
  DrizzleRegistryUnitOfWork,
} from "@axiom/db";
import { CapabilityIndexingService, DiscoveryService } from "@axiom/discovery";
import {
  ApiContractAdapter,
  ManifestAdapter,
  PublicationInspectionService,
  PublicationService,
} from "@axiom/ingestion";
import { CapabilityService, ProviderService } from "@axiom/registry";

import { createApp } from "./app.js";
import { createEmbeddingProvider } from "./config/embedding-provider.js";
import { loadEnvironment } from "./config/environment.js";

async function start(): Promise<void> {
  const environment = loadEnvironment();
  const database = createDatabase(environment.DATABASE_URL);
  const providerRepository = new DrizzleProviderRepository(database.db);
  const capabilityRepository = new DrizzleCapabilityRepository(database.db);
  const indexRepository = new DrizzleCapabilityIndexRepository(database.db);
  const embeddingProvider = createEmbeddingProvider(environment);
  const indexingService = new CapabilityIndexingService(
    providerRepository,
    capabilityRepository,
    indexRepository,
    embeddingProvider,
  );
  const inspectionService = new PublicationInspectionService(
    [new ApiContractAdapter(), new ManifestAdapter()],
    providerRepository,
    capabilityRepository,
  );
  const registry = {
    providerService: new ProviderService(providerRepository),
    capabilityService: new CapabilityService(
      providerRepository,
      capabilityRepository,
    ),
    inspectionService,
    publicationService: new PublicationService(
      inspectionService,
      new DrizzleRegistryUnitOfWork(database.db),
      indexingService,
    ),
    discoveryService: new DiscoveryService(embeddingProvider, indexRepository),
  };
  const app = await createApp({ environment, registry });

  if (embeddingProvider.provider === "fake") {
    app.log.warn(
      { embeddingProvider: embeddingProvider.provider },
      "Deterministic fake embeddings are active; use only for development or demos",
    );
  }

  app.addHook("onClose", async () => {
    await database.client.end({ timeout: 5 });
  });

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    app.log.info({ signal }, "Shutting down Axiom API");
    await app.close();
    process.exitCode = 0;
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));

  try {
    await app.listen({ host: environment.API_HOST, port: environment.PORT });
  } catch (error) {
    app.log.fatal({ err: error }, "Unable to start Axiom API");
    await app.close();
    process.exitCode = 1;
  }
}

void start();
