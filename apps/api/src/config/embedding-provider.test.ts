import { describe, expect, it } from "vitest";

import { createEmbeddingProvider } from "./embedding-provider.js";

describe("embedding provider configuration", () => {
  it("uses deterministic embeddings only when explicitly selected", () => {
    const provider = createEmbeddingProvider({
      EMBEDDING_PROVIDER: "fake",
      EMBEDDING_MODEL: "text-embedding-3-small",
    });

    expect(provider.provider).toBe("fake");
    expect(provider.dimensions).toBe(1_024);
  });

  it("defaults an omitted provider to OpenAI", () => {
    const provider = createEmbeddingProvider({
      EMBEDDING_MODEL: "text-embedding-3-small",
      OPENAI_API_KEY: "test-key",
    });

    expect(provider.provider).toBe("openai");
  });
});
