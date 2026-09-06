import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AxiomPublisher,
  AxiomPublisherError,
  type AxiomManifest,
  type InspectResult,
  type PublishResult,
} from "./index.js";

const timestamp = "2026-09-05T00:00:00.000Z";
const manifest: AxiomManifest = {
  version: "1",
  provider: {
    name: "Northstar Commerce",
    domain: "northstar.example",
    canonicalUrl: "https://northstar.example",
    description: "Product discovery and cart management.",
  },
  capabilities: [
    {
      name: "search_products",
      description: "Search products by query.",
      inputSchema: { type: "object" },
      outputSchema: { type: "object" },
      annotations: { readOnly: true },
    },
  ],
};
const inspectResult: InspectResult = {
  valid: true,
  plan: {
    mode: "merge",
    provider: {
      action: "create",
      slug: null,
      domain: "northstar.example",
    },
    summary: { total: 1, create: 1, update: 0, unchanged: 0, remove: 0 },
    capabilities: [
      {
        name: "search_products",
        action: "create",
        contentHash: "a".repeat(64),
      },
    ],
  },
  warnings: [],
};
const provider = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "northstar-commerce",
  name: "Northstar Commerce",
  domain: "northstar.example",
  canonicalUrl: "https://northstar.example",
  description: "Product discovery and cart management.",
  verificationStatus: "unverified" as const,
  status: "active" as const,
  lastIndexedAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
};
const capability = {
  id: "22222222-2222-4222-8222-222222222222",
  providerId: provider.id,
  name: "search_products",
  description: "Search products by query.",
  inputSchema: { type: "object" },
  outputSchema: { type: "object" },
  annotations: { readOnly: true },
  specVersion: null,
  source: "manifest" as const,
  status: "active" as const,
  contentHash: "a".repeat(64),
  createdAt: timestamp,
  updatedAt: timestamp,
};
const publishResult: PublishResult = {
  provider,
  summary: inspectResult.plan.summary,
  indexing: { ready: 1, failed: 0, unchanged: 0, pending: 0 },
  capabilities: [capability],
  warnings: [],
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status });
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("AxiomPublisher", () => {
  it("normalizes the base URL and inspects a manifest through the shared contract", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(json({ data: inspectResult }));
    const publisher = new AxiomPublisher({
      baseUrl: "https://api.example.com/root///",
      fetch,
    });

    expect(await publisher.inspect(manifest)).toEqual(inspectResult);
    expect(fetch.mock.calls[0]?.[0]).toBe(
      "https://api.example.com/root/v1/inspect",
    );
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({
      source: "manifest",
      mode: "merge",
      manifest,
    });
  });

  it("accepts the direct ergonomic publication shape", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(json({ data: inspectResult }));
    const publisher = new AxiomPublisher({
      baseUrl: "https://api.example.com",
      fetch,
    });
    const direct = {
      provider: manifest.provider,
      capabilities: manifest.capabilities,
    };
    await publisher.inspect(direct);
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({
      source: "api",
      mode: "merge",
      provider: manifest.provider,
      capabilities: manifest.capabilities,
    });
  });

  it("publishes and returns the unwrapped indexing result", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(json({ data: publishResult }));
    const publisher = new AxiomPublisher({
      baseUrl: "https://api.example.com/",
      fetch,
    });
    expect(await publisher.publish(manifest)).toEqual(publishResult);
    expect(fetch.mock.calls[0]?.[0]).toBe("https://api.example.com/v1/publish");
  });

  it("copies custom headers and supports native or injected fetch", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(json({ data: inspectResult }));
    const headers = new Headers({ "X-Release": "preview" });
    vi.stubGlobal("fetch", fetch);
    const publisher = new AxiomPublisher({
      baseUrl: "https://api.example.com",
      headers,
    });
    headers.set("X-Release", "changed");
    await publisher.inspect(manifest);
    const sent = new Headers(fetch.mock.calls[0]?.[1]?.headers);
    expect(sent.get("X-Release")).toBe("preview");
    expect(sent.get("Content-Type")).toBe("application/json");
  });

  it("rejects configuration and publication errors before network traffic", async () => {
    expect(() => new AxiomPublisher({ baseUrl: "not-a-url" })).toThrow(
      AxiomPublisherError,
    );
    expect(
      () =>
        new AxiomPublisher({
          baseUrl: "https://api.example.com",
          timeoutMs: 0,
        }),
    ).toThrow(AxiomPublisherError);
    const fetch = vi.fn<typeof globalThis.fetch>();
    const publisher = new AxiomPublisher({
      baseUrl: "https://api.example.com",
      fetch,
    });
    await expect(
      publisher.inspect({ ...manifest, capabilities: [] }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects invalid success responses", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(json({ data: { valid: true } }));
    await expect(
      new AxiomPublisher({ baseUrl: "https://api.example.com", fetch }).inspect(
        manifest,
      ),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE", status: 200 });
  });

  it("maps structured backend errors", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Publication contains invalid capabilities.",
            requestId: "request-1",
            details: { field: "capabilities.0.name" },
          },
        },
        400,
      ),
    );
    await expect(
      new AxiomPublisher({ baseUrl: "https://api.example.com", fetch }).inspect(
        manifest,
      ),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 400,
      requestId: "request-1",
      details: { field: "capabilities.0.name" },
    });
  });

  it("sanitizes network and unstructured HTTP failures", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockRejectedValueOnce(new Error("private socket detail"))
      .mockResolvedValueOnce(new Response("proxy failure", { status: 502 }));
    const publisher = new AxiomPublisher({
      baseUrl: "https://api.example.com",
      fetch,
    });
    await expect(publisher.inspect(manifest)).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      message: "Could not reach the Axiom API.",
    });
    await expect(publisher.inspect(manifest)).rejects.toMatchObject({
      code: "API_ERROR",
      status: 502,
    });
  });

  it("times out even when custom fetch ignores abort", async () => {
    vi.useFakeTimers();
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation(() => new Promise(() => {}));
    const publisher = new AxiomPublisher({
      baseUrl: "https://api.example.com",
      fetch,
      timeoutMs: 25,
    });
    const result = expect(publisher.inspect(manifest)).rejects.toMatchObject({
      code: "TIMEOUT",
    });
    await vi.advanceTimersByTimeAsync(25);
    await result;
    expect(fetch.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  });
});
