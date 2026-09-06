import "dotenv/config";

import { inArray } from "drizzle-orm";

import { createDatabase } from "./client.js";
import { providers } from "./schema.js";

const demoProviderSlugs = [
  "atlas-dining",
  "orbit-travel",
  "pulse-events",
  "northstar-commerce",
] as const;

async function clearDemoProviders(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");

  const database = createDatabase(databaseUrl);
  try {
    const removed = await database.db
      .delete(providers)
      .where(inArray(providers.slug, demoProviderSlugs))
      .returning({ slug: providers.slug });
    process.stdout.write(`Removed ${removed.length} demo providers.\n`);
  } finally {
    await database.client.end({ timeout: 5 });
  }
}

clearDemoProviders().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown database error";
  process.stderr.write(`Demo reset failed: ${message}\n`);
  process.exitCode = 1;
});
