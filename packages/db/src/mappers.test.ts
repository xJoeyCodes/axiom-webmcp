import type { Capability, Provider } from "@axiom/core";
import { describe, expect, it } from "vitest";

import {
  mapCapabilityRow,
  mapProviderRow,
  toCapabilityRow,
  toProviderRow,
} from "./mappers.js";
import type { CapabilityRow, ProviderRow } from "./schema.js";

const now = new Date("2026-09-03T10:00:00.000Z");

describe("database mappings", () => {
  it("round-trips providers without leaking database naming", () => {
    const provider: Provider = {
      id: "4986c0dd-50c2-42a9-a0c8-753b850322da",
      slug: "atlas-dining",
      name: "Atlas Dining",
      domain: "atlas-dining.example",
      canonicalUrl: "https://atlas-dining.example",
      description: "Restaurant discovery and reservations.",
      verificationStatus: "verified",
      status: "active",
      lastIndexedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    const row = toProviderRow(provider) as ProviderRow;

    expect(mapProviderRow(row)).toEqual(provider);
  });

  it("round-trips capability schemas and annotations", () => {
    const capability: Capability = {
      id: "dbf606ba-60b0-4d7f-baad-ecc44ec6ab17",
      providerId: "4986c0dd-50c2-42a9-a0c8-753b850322da",
      name: "make_reservation",
      description: "Create a restaurant reservation.",
      inputSchema: { type: "object", required: ["restaurantId"] },
      outputSchema: { type: "object" },
      annotations: {
        destructive: false,
        sideEffecting: true,
        requiresConfirmation: true,
      },
      specVersion: "draft-2026-08",
      source: "api",
      status: "active",
      contentHash: "a".repeat(64),
      createdAt: now,
      updatedAt: now,
    };
    const row = {
      ...toCapabilityRow(capability),
      rawContract: null,
    } as CapabilityRow;

    expect(mapCapabilityRow(row)).toEqual(capability);
  });
});
