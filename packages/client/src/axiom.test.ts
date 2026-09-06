import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Axiom,
  AxiomError,
  type Capability,
  type DiscoveryResponse,
  type Provider,
} from "./index.js";

const timestamp = "2026-09-05T00:00:00.000Z";
const provider: Provider = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "atlas-dining",
  name: "Atlas Dining",
  domain: "atlas.example",
  canonicalUrl: "https://atlas.example",
  description: "Restaurant reservations.",
  verificationStatus: "unverified",
  status: "active",
  lastIndexedAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
};
const capability: Capability = {
  id: "22222222-2222-4222-8222-222222222222",
  providerId: provider.id,
  name: "make_reservation",
  description: "Reserve a table.",
  inputSchema: { type: "object", properties: { guests: { type: "number" } } },
  outputSchema: null,
  annotations: { readOnly: false },
  source: "api",
  status: "active",
  specVersion: null,
  contentHash: "a".repeat(64),
  createdAt: timestamp,
  updatedAt: timestamp,
};
const discovery: DiscoveryResponse = {
  query: { intent: "reserve dinner" },
  count: 1,
  results: [
    {
      provider,
      score: 0.9,
      matchedCapabilities: [
        { capability, score: 0.9, matchedTerms: ["reserve"] },
      ],
    },
  ],
};
function response(data: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(data), {
    status,
    ...(headers === undefined ? {} : { headers }),
  });
}
function setup(data: unknown = { data: discovery }) {
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockImplementation(async () => response(data));
  return {
    fetch,
    axiom: new Axiom({ baseUrl: "https://api.example.com", fetch }),
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("configuration and transport", () => {
  it.each(["https://api.example.com", "https://api.example.com/"])(
    "normalizes %s and serializes validated discovery",
    async (baseUrl) => {
      const { fetch } = setup();
      const axiom = new Axiom({ baseUrl, fetch });
      expect(fetch).not.toHaveBeenCalled();
      expect(
        await axiom.discover({ intent: " reserve dinner ", limit: 5 }),
      ).toEqual(discovery);
      expect(fetch.mock.calls[0]?.[0]).toBe(
        "https://api.example.com/v1/discover",
      );
      const request = fetch.mock.calls[0]?.[1];
      expect(request).toMatchObject({
        method: "POST",
        credentials: "omit",
        redirect: "error",
      });
      expect(JSON.parse(String(request?.body))).toEqual({
        intent: "reserve dinner",
        limit: 5,
      });
      expect(request?.signal).toBeInstanceOf(AbortSignal);
    },
  );

  it("preserves a reverse-proxy prefix and applies the shared default limit", async () => {
    const { fetch } = setup();
    await new Axiom({
      baseUrl: "https://api.example.com/axiom///",
      fetch,
    }).discover({ intent: "dinner" });
    expect(fetch.mock.calls[0]?.[0]).toBe(
      "https://api.example.com/axiom/v1/discover",
    );
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({
      intent: "dinner",
      limit: 10,
    });
  });

  it.each([
    "",
    "not-a-url",
    "ftp://example.com",
    "https://user:secret@example.com",
    "https://example.com/?key=secret",
    "https://example.com/#fragment",
  ])("rejects invalid base URL %s", (baseUrl) => {
    expect(() => new Axiom({ baseUrl })).toThrow(AxiomError);
  });

  it.each([0, -1, NaN, Infinity, 1.5, 2_147_483_648])(
    "rejects invalid timeout %s",
    (timeoutMs) => {
      expect(
        () => new Axiom({ baseUrl: "https://example.com", timeoutMs }),
      ).toThrow(AxiomError);
    },
  );

  it("uses native fetch or an injected implementation when native fetch is absent", async () => {
    const { fetch } = setup();
    vi.stubGlobal("fetch", fetch);
    await new Axiom({ baseUrl: "https://example.com" }).discover({
      intent: "dinner",
    });
    expect(fetch).toHaveBeenCalledOnce();
    vi.stubGlobal("fetch", undefined);
    expect(() => new Axiom({ baseUrl: "https://example.com" })).toThrow(
      "injected fetch",
    );
    await new Axiom({ baseUrl: "https://example.com", fetch }).discover({
      intent: "dinner",
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("copies headers and enforces JSON without mutating caller configuration", async () => {
    const { fetch } = setup();
    const headers = new Headers({
      "X-Agent-Name": "Nova",
      Accept: "text/html",
      Authorization: "Bearer test",
    });
    const axiom = new Axiom({ baseUrl: "https://example.com", headers, fetch });
    headers.set("X-Agent-Name", "changed");
    await axiom.discover({ intent: "dinner" });
    const sent = new Headers(fetch.mock.calls[0]?.[1]?.headers);
    expect(sent.get("X-Agent-Name")).toBe("Nova");
    expect(sent.get("Accept")).toBe("application/json");
    expect(sent.get("Content-Type")).toBe("application/json");
    expect(sent.get("Authorization")).toBe("Bearer test");
    expect(headers.get("Accept")).toBe("text/html");
    expect(sent.has("User-Agent")).toBe(false);
  });
});

describe("resource operations and validation", () => {
  it("retrieves provider metadata and capabilities through their existing endpoints", async () => {
    const { fetch, axiom } = setup();
    fetch.mockResolvedValueOnce(
      response({ data: provider, meta: { capabilityCount: 1 } }),
    );
    expect(await axiom.getProvider(" atlas-dining ")).toEqual(provider);
    fetch.mockResolvedValueOnce(response({ data: [capability] }));
    expect(await axiom.getCapabilities("atlas-dining")).toEqual([capability]);
    fetch.mockResolvedValueOnce(response({ data: capability }));
    expect(
      await axiom.getCapability("atlas-dining", "make_reservation"),
    ).toEqual(capability);
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      "https://api.example.com/v1/providers/atlas-dining",
      "https://api.example.com/v1/providers/atlas-dining/capabilities",
      "https://api.example.com/v1/providers/atlas-dining/capabilities/make_reservation",
    ]);
    expect(
      fetch.mock.calls.every(
        ([, options]) =>
          options?.method === "GET" && options.body === undefined,
      ),
    ).toBe(true);
  });

  it("encodes capability path segments safely", async () => {
    const name = "tools/reserve?date#value%";
    const { fetch, axiom } = setup({ data: { ...capability, name } });
    await axiom.getCapability("atlas-dining", name);
    expect(fetch.mock.calls[0]?.[0]).toBe(
      `https://api.example.com/v1/providers/atlas-dining/capabilities/${encodeURIComponent(name)}`,
    );
    await expect(
      axiom.getCapability("atlas-dining", ".."),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("validates all method inputs before network traffic", async () => {
    const { fetch, axiom } = setup();
    for (const input of [
      { intent: " " },
      { intent: "dinner", limit: 0 },
      { intent: "dinner", limit: 51 },
      { intent: "x".repeat(501) },
      { intent: "dinner", minimumScore: 2 },
    ]) {
      await expect(axiom.discover(input)).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
      });
    }
    await expect(axiom.getProvider("../secret")).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
    await expect(axiom.getCapabilities("")).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
    await expect(
      axiom.getCapability("atlas-dining", "\u0000"),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("preserves empty discovery results and rejects mismatched success contracts", async () => {
    const { fetch, axiom } = setup({
      data: { query: { intent: "unmatched" }, results: [], count: 0 },
    });
    expect((await axiom.discover({ intent: "unmatched" })).results).toEqual([]);
    fetch.mockResolvedValueOnce(response({ data: { results: [] } }));
    await expect(axiom.discover({ intent: "dinner" })).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      status: 200,
    });
    fetch.mockResolvedValueOnce(
      response({
        data: { ...provider, id: "invalid" },
        meta: { capabilityCount: 1 },
      }),
    );
    await expect(axiom.getProvider("atlas-dining")).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
    fetch.mockResolvedValueOnce(
      response({ data: [{ ...capability, inputSchema: "invalid" }] }),
    );
    await expect(axiom.getCapabilities("atlas-dining")).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });
});

describe("errors and deadlines", () => {
  it.each([
    [404, "NOT_FOUND"],
    [409, "CONFLICT"],
    [503, "SERVICE_UNAVAILABLE"],
  ] as const)(
    "maps structured %s errors with request IDs and details",
    async (status, code) => {
      const { fetch, axiom } = setup();
      fetch.mockResolvedValueOnce(
        response(
          {
            error: {
              code,
              message: "Registry request failed.",
              requestId: "server-request",
              details: { field: "slug" },
            },
          },
          status,
        ),
      );
      await expect(axiom.getProvider("atlas-dining")).rejects.toMatchObject({
        name: "AxiomError",
        code,
        status,
        requestId: "server-request",
        details: { field: "slug" },
      });
      expect(fetch).toHaveBeenCalledOnce();
    },
  );

  it("sanitizes network failures and unstructured error responses", async () => {
    const { fetch, axiom } = setup();
    fetch.mockRejectedValueOnce(new Error("secret networking internals"));
    await expect(axiom.discover({ intent: "dinner" })).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      message: "Could not reach the Axiom API.",
    });
    fetch.mockResolvedValueOnce(
      new Response("<html>internal proxy error</html>", {
        status: 502,
        headers: { "x-request-id": "proxy-request" },
      }),
    );
    await expect(axiom.discover({ intent: "dinner" })).rejects.toMatchObject({
      code: "API_ERROR",
      status: 502,
      requestId: "proxy-request",
    });
    fetch.mockResolvedValueOnce(new Response("not json"));
    await expect(axiom.discover({ intent: "dinner" })).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });

  it("times out even when injected fetch ignores cancellation", async () => {
    vi.useFakeTimers();
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation(() => new Promise(() => {}));
    const axiom = new Axiom({
      baseUrl: "https://example.com",
      fetch,
      timeoutMs: 25,
    });
    const assertion = expect(
      axiom.discover({ intent: "dinner" }),
    ).rejects.toMatchObject({ code: "TIMEOUT" });
    await vi.advanceTimersByTimeAsync(25);
    await assertion;
    expect(fetch.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps the deadline active while reading the response body", async () => {
    vi.useFakeTimers();
    const hanging = new ReadableStream<Uint8Array>();
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response(hanging));
    const axiom = new Axiom({
      baseUrl: "https://example.com",
      fetch,
      timeoutMs: 25,
    });
    const assertion = expect(
      axiom.discover({ intent: "dinner" }),
    ).rejects.toMatchObject({ code: "TIMEOUT" });
    await vi.advanceTimersByTimeAsync(25);
    await assertion;
  });

  it("clears successful request timers and isolates concurrent requests", async () => {
    vi.useFakeTimers();
    const { axiom } = setup();
    await Promise.all([
      axiom.discover({ intent: "dinner" }),
      axiom.discover({ intent: "flights" }),
    ]);
    expect(vi.getTimerCount()).toBe(0);
  });
});
