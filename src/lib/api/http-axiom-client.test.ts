import { describe, expect, it } from "vitest";

import { HttpAxiomClient } from "./http-axiom-client";

const provider = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "atlas-dining",
  name: "Atlas Dining",
  domain: "atlas.example",
  canonicalUrl: "https://atlas.example",
  description: "Restaurant discovery and reservation services.",
  verificationStatus: "unverified",
  status: "active",
  lastIndexedAt: "2026-09-03T10:30:00.000Z",
  createdAt: "2026-09-01T10:30:00.000Z",
  updatedAt: "2026-09-03T10:30:00.000Z",
} as const;

const capability = {
  id: "22222222-2222-4222-8222-222222222222",
  providerId: provider.id,
  name: "make_reservation",
  description: "Reserve an available restaurant table.",
  inputSchema: {
    type: "object",
    properties: {
      restaurant: { type: "string", description: "Restaurant identifier." },
    },
    required: ["restaurant"],
  },
  outputSchema: null,
  annotations: { sideEffecting: true, requiresConfirmation: true },
  specVersion: "draft",
  source: "manifest",
  status: "active",
  contentHash: "a".repeat(64),
  createdAt: "2026-09-01T10:30:00.000Z",
  updatedAt: "2026-09-03T10:30:00.000Z",
} as const;

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("HttpAxiomClient", () => {
  it("maps real discovery DTOs into the existing frontend result model", async () => {
    const requests: Array<{ url: string; body: string | null }> = [];
    const client = new HttpAxiomClient({
      baseUrl: "http://127.0.0.1:4000/",
      fetch: async (input, init) => {
        requests.push({ url: String(input), body: String(init?.body ?? "") });
        return json({
          data: {
            query: { intent: "reserve dinner" },
            count: 1,
            results: [
              {
                provider,
                score: 0.93,
                matchedCapabilities: [
                  {
                    capability,
                    score: 0.95,
                    matchedTerms: ["reservation"],
                  },
                ],
              },
            ],
          },
        });
      },
    });

    const [result] = await client.discover("reserve dinner");

    expect(requests[0]?.url).toBe("http://127.0.0.1:4000/v1/discover");
    expect(JSON.parse(requests[0]?.body ?? "{}")).toEqual({
      intent: "reserve dinner",
      limit: 10,
    });
    expect(result?.provider.name).toBe("Atlas Dining");
    expect(result?.provider.verified).toBe(false);
    expect(result?.score).toBe(93);
    expect(result?.matches[0]?.capability.metadata.sideEffecting).toBe(true);
  });

  it("composes provider and capability endpoints without exposing backend-only fields", async () => {
    const client = new HttpAxiomClient({
      baseUrl: "http://127.0.0.1:4000",
      fetch: async (input) =>
        String(input).endsWith("/capabilities")
          ? json({ data: [capability] })
          : json({ data: provider, meta: { capabilityCount: 1 } }),
    });

    const result = await client.getProvider("atlas-dining");

    expect(result?.canonicalUrl).toBe("https://atlas.example");
    expect(result?.capabilities[0]?.inputs[0]).toMatchObject({
      name: "restaurant",
      required: true,
    });
    expect(result).not.toHaveProperty("contentHash");
  });

  it("returns null only for a structured provider NOT_FOUND response", async () => {
    const client = new HttpAxiomClient({
      baseUrl: "http://127.0.0.1:4000",
      fetch: async () =>
        json(
          {
            error: {
              code: "NOT_FOUND",
              message: "Provider not found",
              requestId: "request-1",
            },
          },
          404,
        ),
    });

    await expect(client.getProvider("missing-provider")).resolves.toBeNull();
  });
});
