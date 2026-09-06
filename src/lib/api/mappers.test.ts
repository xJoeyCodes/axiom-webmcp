import { describe, expect, it } from "vitest";

import { mapCapability, mapJsonSchema } from "./mappers";

const baseCapability = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "set_preference",
  description: "Set a provider preference.",
  outputSchema: null,
  annotations: { sideEffecting: true },
  specVersion: "draft",
} as const;

describe("frontend contract mapping", () => {
  it("renders a top-level scalar schema as one required input", () => {
    const capability = mapCapability({
      ...baseCapability,
      inputSchema: {
        type: "string",
        title: "preference",
        description: "Preference value.",
      },
    });

    expect(capability.inputs).toEqual([
      expect.objectContaining({
        name: "preference",
        required: true,
        description: "Preference value.",
      }),
    ]);
  });

  it("preserves supported structure and ignores unknown keywords safely", () => {
    expect(
      mapJsonSchema({
        type: "object",
        properties: { enabled: { type: "boolean" } },
        required: ["enabled"],
        futureKeyword: { executable: false },
      }),
    ).toEqual({
      type: "object",
      properties: { enabled: { type: "boolean" } },
      required: ["enabled"],
    });
  });
});
