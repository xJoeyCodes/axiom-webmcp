import { describe, expect, it } from "vitest";

import {
  createCapabilityContentHash,
  stableJsonStringify,
} from "./content-hash.js";

describe("capability content hashing", () => {
  it("serializes object keys deterministically", () => {
    expect(stableJsonStringify({ b: 2, a: { d: true, c: null } })).toBe(
      '{"a":{"c":null,"d":true},"b":2}',
    );
  });

  it("produces the same hash for semantically identical key order", () => {
    const first = createCapabilityContentHash({
      name: "search_restaurants",
      description: "Search restaurants",
      inputSchema: {
        type: "object",
        properties: {
          location: { type: "string" },
          cuisine: { type: "string" },
        },
      },
      annotations: { readOnly: true, destructive: false },
    });
    const second = createCapabilityContentHash({
      name: "search_restaurants",
      description: "Search restaurants",
      inputSchema: {
        properties: {
          cuisine: { type: "string" },
          location: { type: "string" },
        },
        type: "object",
      },
      annotations: { destructive: false, readOnly: true },
    });

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f\d]{64}$/u);
  });

  it("changes when normalized capability content changes", () => {
    const base = {
      name: "make_reservation",
      description: "Create a reservation",
      inputSchema: { type: "object" as const },
    };

    expect(createCapabilityContentHash(base)).not.toBe(
      createCapabilityContentHash({
        ...base,
        description: "Update a reservation",
      }),
    );
  });
});
