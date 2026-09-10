import { describe, expect, it } from "vitest";

import { buildManifestFromWebMcpTools } from "./website-inspector";

describe("WebMCP website inspection mapping", () => {
  it("normalizes discovered browser tools into an Axiom manifest", () => {
    const manifest = buildManifestFromWebMcpTools(
      new URL("https://northstar-commerce.example/catalog#featured"),
      [
        {
          name: "add_to_cart",
          description: "Add a product to the active shopping cart.",
          inputSchema: JSON.stringify({
            type: "object",
            properties: { productId: { type: "string" } },
            required: ["productId"],
          }),
          annotations: { readOnlyHint: false },
        },
      ],
    );

    expect(manifest.provider).toEqual({
      name: "Northstar Commerce",
      domain: "northstar-commerce.example",
      canonicalUrl: "https://northstar-commerce.example/catalog#featured",
      description: "WebMCP actions exposed by northstar-commerce.example.",
    });
    expect(manifest.capabilities[0]).toMatchObject({
      name: "add_to_cart",
      inputSchema: {
        type: "object",
        required: ["productId"],
      },
      annotations: { readOnlyHint: false },
    });
  });

  it("uses a safe schema and description when optional tool metadata is absent", () => {
    const manifest = buildManifestFromWebMcpTools(
      new URL("https://atlas.example/"),
      [{ name: "search_restaurants", inputSchema: "not json" }],
    );

    expect(manifest.capabilities[0]).toMatchObject({
      description: "WebMCP action exposed by atlas.example.",
      inputSchema: { type: "object" },
    });
  });
});
