import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Axiom } from "@axiom-webmcp/client";
import { runCli, type CliServices } from "@axiom-webmcp/cli";
import { AxiomPublisher, type AxiomManifest } from "@axiom-webmcp/sdk";
import { northstarCommercePublication } from "@axiom/ingestion";
import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";

import { createApp } from "../../app.js";
import type { Environment } from "../../config/environment.js";
import { createTestRegistry } from "../../test/create-test-registry.js";

const environment: Environment = {
  NODE_ENV: "test",
  API_HOST: "127.0.0.1",
  PORT: 4_000,
  DATABASE_URL: "postgresql://axiom:axiom@localhost:5432/axiom_test",
  LOG_LEVEL: "silent",
  CORS_ORIGINS: ["http://localhost:3000"],
};

describe("website developer tooling HTTP integration", () => {
  let app: FastifyInstance | undefined;
  let directory: string | undefined;

  afterEach(async () => {
    await app?.close();
    if (directory) await rm(directory, { recursive: true, force: true });
  });

  it("inspects, publishes, detects unchanged contracts, and searches through the public clients", async () => {
    app = await createApp({
      environment,
      registry: createTestRegistry(),
      logger: false,
    });
    const baseUrl = await app.listen({ host: "127.0.0.1", port: 0 });
    directory = await mkdtemp(join(tmpdir(), "axiom-tooling-integration-"));
    const manifest: AxiomManifest = {
      version: "1",
      provider: northstarCommercePublication.provider,
      capabilities: northstarCommercePublication.capabilities,
    };
    await writeFile(
      join(directory, "axiom.json"),
      `${JSON.stringify(manifest)}\n`,
      "utf8",
    );

    let stdout = "";
    let stderr = "";
    const services: CliServices = {
      cwd: directory,
      environment: { AXIOM_BASE_URL: baseUrl },
      interactive: false,
      io: {
        stdout: (value) => {
          stdout += value;
        },
        stderr: (value) => {
          stderr += value;
        },
      },
      createPublisher: (options) => new AxiomPublisher(options),
      createClient: (options) => new Axiom(options),
      confirm: async () => true,
    };

    expect(await runCli(["inspect", "--json"], services)).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({
      plan: { summary: { create: 4, update: 0, unchanged: 0 } },
    });

    stdout = "";
    expect(await runCli(["publish", "--yes", "--json"], services)).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({
      publication: {
        provider: { slug: "northstar-commerce" },
        indexing: { ready: 4, failed: 0 },
      },
    });

    stdout = "";
    expect(await runCli(["inspect", "--json"], services)).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({
      plan: { summary: { create: 0, update: 0, unchanged: 4 } },
    });

    stdout = "";
    expect(
      await runCli(
        ["search", "put something in my shopping basket", "--json"],
        services,
      ),
    ).toBe(0);
    const discovery = JSON.parse(stdout) as {
      results: Array<{
        provider: { slug: string };
        matchedCapabilities: Array<{ capability: { name: string } }>;
      }>;
    };
    expect(discovery.results[0]?.provider.slug).toBe("northstar-commerce");
    expect(
      discovery.results[0]?.matchedCapabilities.some(
        (match) => match.capability.name === "add_to_cart",
      ),
    ).toBe(true);
    expect(stderr).toBe("");
  });
});
