import { describe, expect, it } from "vitest";

import { ApiContractAdapter } from "./adapters/api-contract-adapter.js";
import { ManifestAdapter } from "./adapters/manifest-adapter.js";
import { northstarCommercePublication } from "./fixtures/northstar-commerce.js";

describe("publication source validation", () => {
  it("rejects domains that do not match the canonical URL", () => {
    expect(() =>
      new ApiContractAdapter().ingest({
        ...northstarCommercePublication,
        provider: {
          ...northstarCommercePublication.provider,
          canonicalUrl: "https://different-provider.example",
        },
      }),
    ).toThrow("canonicalUrl must belong to the provider domain");
  });

  it("rejects unsupported Axiom manifest versions", () => {
    expect(() =>
      new ManifestAdapter().ingest({
        source: "manifest",
        manifest: {
          version: "2",
          provider: northstarCommercePublication.provider,
          capabilities: northstarCommercePublication.capabilities,
        },
      }),
    ).toThrow();
  });
});
