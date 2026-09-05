import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { AxiomError, type DiscoveryResponse } from "@axiom-webmcp/client";
import {
  AxiomPublisherError,
  type AxiomManifest,
  type InspectResult,
  type PublishResult,
} from "@axiom-webmcp/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runCli } from "./cli.js";
import { DEFAULT_AXIOM_BASE_URL, resolveBaseUrl } from "./config.js";
import { loadManifest, starterManifest } from "./manifest.js";
import type { CliServices } from "./services.js";

const inspectResult: InspectResult = {
  valid: true,
  plan: {
    mode: "merge",
    provider: {
      action: "create",
      slug: null,
      domain: "example.com",
    },
    summary: { total: 1, create: 1, update: 0, unchanged: 0, remove: 0 },
    capabilities: [
      {
        name: "search_items",
        action: "create",
        contentHash: "a".repeat(64),
      },
    ],
  },
  warnings: [],
};
const timestamp = "2026-09-05T00:00:00.000Z";
const publishResult: PublishResult = {
  provider: {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "example-webmcp-site",
    name: starterManifest.provider.name,
    domain: starterManifest.provider.domain,
    canonicalUrl: starterManifest.provider.canonicalUrl,
    description: starterManifest.provider.description,
    verificationStatus: "unverified",
    status: "active",
    lastIndexedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  summary: inspectResult.plan.summary,
  indexing: { ready: 1, failed: 0, unchanged: 0, pending: 0 },
  capabilities: [],
  warnings: [],
};
const discoveryResult: DiscoveryResponse = {
  query: { intent: "search products" },
  count: 1,
  results: [
    {
      provider: publishResult.provider,
      score: 0.93,
      matchedCapabilities: [],
    },
  ],
};

let directory: string;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "axiom-cli-"));
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

async function writeManifest(
  manifest: AxiomManifest = starterManifest,
  name = "axiom.json",
) {
  await writeFile(join(directory, name), JSON.stringify(manifest), "utf8");
}

function setup(overrides: Partial<CliServices> = {}) {
  let stdout = "";
  let stderr = "";
  const inspect = vi.fn(async () => inspectResult);
  const publish = vi.fn(async () => publishResult);
  const discover = vi.fn(async () => discoveryResult);
  const services: CliServices = {
    cwd: directory,
    environment: {},
    interactive: false,
    io: {
      stdout: (value) => {
        stdout += value;
      },
      stderr: (value) => {
        stderr += value;
      },
    },
    createPublisher: () => ({ inspect, publish }),
    createClient: () => ({ discover }),
    confirm: vi.fn(async () => true),
    ...overrides,
  };
  return {
    services,
    inspect,
    publish,
    discover,
    output: () => ({ stdout, stderr }),
  };
}

describe("manifest files and configuration", () => {
  it("uses flag, environment, then the local default URL", () => {
    expect(
      resolveBaseUrl(" https://flag.example/ ", {
        AXIOM_BASE_URL: "https://env.example",
      }),
    ).toBe("https://flag.example/");
    expect(
      resolveBaseUrl(undefined, { AXIOM_BASE_URL: " https://env.example " }),
    ).toBe("https://env.example");
    expect(resolveBaseUrl(undefined, {})).toBe(DEFAULT_AXIOM_BASE_URL);
  });

  it("loads the default or explicit manifest and validates shared schema", async () => {
    await writeManifest();
    expect((await loadManifest(directory)).manifest).toEqual(starterManifest);
    await writeManifest(starterManifest, "custom.json");
    expect(
      (await loadManifest(directory, "custom.json")).manifest.version,
    ).toBe("1");
  });

  it("reports missing, invalid JSON, invalid schema, and directories cleanly", async () => {
    await expect(loadManifest(directory)).rejects.toMatchObject({
      exitCode: 2,
      message: "Manifest not found.",
    });
    await writeFile(join(directory, "axiom.json"), "{", "utf8");
    await expect(loadManifest(directory)).rejects.toMatchObject({
      exitCode: 2,
      message: "Manifest contains invalid JSON.",
    });
    await writeFile(
      join(directory, "axiom.json"),
      JSON.stringify({ version: "2" }),
      "utf8",
    );
    await expect(loadManifest(directory)).rejects.toMatchObject({
      exitCode: 2,
      message: "Manifest invalid.",
    });
    await rm(join(directory, "axiom.json"));
    await mkdir(join(directory, "axiom.json"));
    await expect(loadManifest(directory)).rejects.toMatchObject({
      exitCode: 2,
      message: "Manifest path is not a file.",
    });
  });
});

describe("commands", () => {
  it("init creates a valid manifest and never overwrites it", async () => {
    const first = setup();
    expect(await runCli(["init"], first.services)).toBe(0);
    expect(first.output().stdout).toContain("Created axiom.json");
    const created = JSON.parse(
      await readFile(join(directory, "axiom.json"), "utf8"),
    );
    expect(created).toEqual(starterManifest);
    await writeFile(join(directory, "axiom.json"), '{"sentinel":true}', "utf8");
    const second = setup();
    expect(await runCli(["init"], second.services)).toBe(0);
    expect(second.output().stdout).toBe("axiom.json already exists.\n");
    expect(await readFile(join(directory, "axiom.json"), "utf8")).toBe(
      '{"sentinel":true}',
    );
  });

  it("init and inspect produce JSON-only stdout", async () => {
    const initialized = setup();
    expect(
      await runCli(
        ["init", "--file", "custom.json", "--json"],
        initialized.services,
      ),
    ).toBe(0);
    expect(JSON.parse(initialized.output().stdout)).toMatchObject({
      status: "created",
    });
    const inspected = setup();
    expect(
      await runCli(
        [
          "--base-url",
          "https://api.example.com",
          "inspect",
          "--file",
          "custom.json",
          "--json",
        ],
        inspected.services,
      ),
    ).toBe(0);
    expect(JSON.parse(inspected.output().stdout)).toEqual(inspectResult);
    expect(inspected.output().stderr).toBe("");
    expect(inspected.inspect).toHaveBeenCalledWith(starterManifest);
  });

  it("inspect prints the publication plan and uses environment configuration", async () => {
    await writeManifest();
    let configuredUrl = "";
    const fixture = setup({
      environment: { AXIOM_BASE_URL: "https://environment.example" },
      createPublisher: (options) => {
        configuredUrl = options.baseUrl;
        return {
          inspect: async () => inspectResult,
          publish: async () => publishResult,
        };
      },
    });
    expect(await runCli(["inspect"], fixture.services)).toBe(0);
    expect(configuredUrl).toBe("https://environment.example");
    expect(fixture.output().stdout).toContain("CREATE       search_items");
    expect(fixture.output().stdout).toContain("Ready to publish.");
  });

  it("publish inspects first, supports --yes, and reports indexing status", async () => {
    await writeManifest();
    const fixture = setup();
    expect(await runCli(["publish", "--yes"], fixture.services)).toBe(0);
    expect(fixture.inspect).toHaveBeenCalledBefore(fixture.publish);
    expect(fixture.publish).toHaveBeenCalledWith(starterManifest);
    expect(fixture.output().stdout).toContain("Published.");
    expect(fixture.output().stdout).toContain("1 capability indexed.");
  });

  it("requires --yes without a terminal and respects interactive cancellation", async () => {
    await writeManifest();
    const unattended = setup();
    expect(await runCli(["publish"], unattended.services)).toBe(2);
    expect(unattended.publish).not.toHaveBeenCalled();
    expect(unattended.output().stderr).toContain("Run axiom publish --yes.");
    const confirm = vi.fn(async () => false);
    const interactive = setup({ interactive: true, confirm });
    expect(await runCli(["publish"], interactive.services)).toBe(0);
    expect(confirm).toHaveBeenCalledOnce();
    expect(interactive.publish).not.toHaveBeenCalled();
    expect(interactive.output().stdout).toContain("cancelled");
  });

  it("skips publish when everything is already current", async () => {
    await writeManifest();
    const unchanged: InspectResult = {
      ...inspectResult,
      plan: {
        ...inspectResult.plan,
        provider: { ...inspectResult.plan.provider, action: "unchanged" },
        summary: { total: 1, create: 0, update: 0, unchanged: 1, remove: 0 },
        capabilities: [
          { ...inspectResult.plan.capabilities[0]!, action: "unchanged" },
        ],
      },
    };
    const fixture = setup({
      createPublisher: () => ({
        inspect: async () => unchanged,
        publish: vi.fn(),
      }),
    });
    expect(await runCli(["publish", "--yes", "--json"], fixture.services)).toBe(
      0,
    );
    expect(JSON.parse(fixture.output().stdout)).toMatchObject({
      status: "unchanged",
    });
  });

  it("uses the agent client for readable and JSON search output", async () => {
    let baseUrl = "";
    const fixture = setup({
      createClient: (options) => {
        baseUrl = options.baseUrl;
        return { discover: fixtureDiscover };
      },
    });
    const fixtureDiscover = vi.fn(async () => discoveryResult);
    expect(
      await runCli(
        ["search", "search products", "--limit", "3"],
        fixture.services,
      ),
    ).toBe(0);
    expect(baseUrl).toBe(DEFAULT_AXIOM_BASE_URL);
    expect(fixtureDiscover).toHaveBeenCalledWith({
      intent: "search products",
      limit: 3,
    });
    expect(fixture.output().stdout).toContain("93%");
    const jsonFixture = setup();
    expect(
      await runCli(
        ["search", "search products", "--json"],
        jsonFixture.services,
      ),
    ).toBe(0);
    expect(JSON.parse(jsonFixture.output().stdout)).toEqual(discoveryResult);
  });

  it("returns code 2 for local validation and code 1 for remote failures", async () => {
    const missing = setup();
    expect(await runCli(["inspect"], missing.services)).toBe(2);
    expect(missing.output().stderr).toContain("Manifest not found.");
    const invalidLimit = setup();
    expect(
      await runCli(
        ["search", "dinner", "--limit", "nope"],
        invalidLimit.services,
      ),
    ).toBe(2);
    const network = setup({
      createClient: () => ({
        discover: async () => {
          throw new AxiomError(
            "NETWORK_ERROR",
            "Could not reach the Axiom API.",
          );
        },
      }),
    });
    expect(await runCli(["search", "dinner"], network.services)).toBe(1);
    expect(network.output().stderr).toContain("Unable to reach Axiom.");
    expect(network.output().stderr).toContain(DEFAULT_AXIOM_BASE_URL);
  });

  it("keeps JSON stdout clean when backend inspection fails", async () => {
    await writeManifest();
    const fixture = setup({
      createPublisher: () => ({
        inspect: async () => {
          throw new AxiomPublisherError("TIMEOUT", "timed out");
        },
        publish: async () => publishResult,
      }),
    });
    expect(await runCli(["inspect", "--json"], fixture.services)).toBe(1);
    expect(fixture.output().stdout).toBe("");
    expect(JSON.parse(fixture.output().stderr)).toMatchObject({
      error: { code: "TIMEOUT" },
    });
  });
});
