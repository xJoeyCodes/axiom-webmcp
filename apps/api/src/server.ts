import "dotenv/config";

import { createDatabase } from "@axiom/db";

import { createApp } from "./app.js";
import { loadEnvironment } from "./config/environment.js";

async function start(): Promise<void> {
  const environment = loadEnvironment();
  const database = createDatabase(environment.DATABASE_URL);
  const app = await createApp({ environment });

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
