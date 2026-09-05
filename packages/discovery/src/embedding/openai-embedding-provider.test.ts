import { describe, expect, it, vi } from "vitest";

import { OpenAIEmbeddingProvider } from "./openai-embedding-provider.js";

describe("OpenAIEmbeddingProvider", () => {
  it("uses the schema-fixed model and 1024-dimensional request", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ index: 0, embedding: Array<number>(1_024).fill(0.5) }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const provider = new OpenAIEmbeddingProvider({
      apiKey: "test-key",
      fetchImplementation: request,
    });
    const embedding = await provider.embed("reserve dinner");
    const body = JSON.parse(
      (request.mock.calls[0]?.[1]?.body as string | undefined) ?? "{}",
    ) as { model?: string; dimensions?: number };

    expect(embedding).toHaveLength(1_024);
    expect(body).toMatchObject({
      model: "text-embedding-3-small",
      dimensions: 1_024,
    });
  });

  it("rejects incompatible model configuration and missing credentials", async () => {
    expect(() => new OpenAIEmbeddingProvider({ model: "other-model" })).toThrow(
      "only supports text-embedding-3-small",
    );
    await expect(
      new OpenAIEmbeddingProvider().embed("reserve dinner"),
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });

  it("retries a bounded transient response", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [{ index: 0, embedding: Array<number>(1_024).fill(0) }],
          }),
          { status: 200 },
        ),
      );
    await new OpenAIEmbeddingProvider({
      apiKey: "test-key",
      fetchImplementation: request,
      maxAttempts: 2,
    }).embed("find flights");
    expect(request).toHaveBeenCalledTimes(2);
  });
});
