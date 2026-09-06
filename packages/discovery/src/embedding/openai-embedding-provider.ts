import {
  ApplicationError,
  CAPABILITY_EMBEDDING_DIMENSIONS,
  DEFAULT_EMBEDDING_MODEL,
  type EmbeddingProvider,
} from "@axiom/core";

interface OpenAIEmbeddingProviderOptions {
  readonly apiKey?: string | undefined;
  readonly model?: string | undefined;
  readonly timeoutMs?: number | undefined;
  readonly maxAttempts?: number | undefined;
  readonly fetchImplementation?: typeof fetch | undefined;
  readonly endpoint?: string | undefined;
}

interface OpenAIEmbeddingResponse {
  readonly data?: readonly {
    readonly index?: number;
    readonly embedding?: readonly number[];
  }[];
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly provider = "openai";
  readonly dimensions = CAPABILITY_EMBEDDING_DIMENSIONS;
  readonly version = "1";
  readonly model: string;
  private readonly fetchImplementation: typeof fetch;
  private readonly endpoint: string;
  private readonly timeoutMs: number;
  private readonly maxAttempts: number;
  private readonly apiKey: string | undefined;

  constructor(options: OpenAIEmbeddingProviderOptions = {}) {
    this.model = options.model ?? DEFAULT_EMBEDDING_MODEL;
    if (this.model !== DEFAULT_EMBEDDING_MODEL) {
      throw new ApplicationError(
        "VALIDATION_ERROR",
        `The current vector index only supports ${DEFAULT_EMBEDDING_MODEL} at ${CAPABILITY_EMBEDDING_DIMENSIONS} dimensions.`,
      );
    }
    this.apiKey = options.apiKey?.trim() || undefined;
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.maxAttempts = options.maxAttempts ?? 3;
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.endpoint = options.endpoint ?? "https://api.openai.com/v1/embeddings";
  }

  async embed(text: string): Promise<readonly number[]> {
    const [embedding] = await this.embedMany([text]);
    if (!embedding) {
      throw new ApplicationError(
        "SERVICE_UNAVAILABLE",
        "The embedding provider returned no vector.",
      );
    }
    return embedding;
  }

  async embedMany(
    texts: readonly string[],
  ): Promise<readonly (readonly number[])[]> {
    if (!this.apiKey) {
      throw new ApplicationError(
        "SERVICE_UNAVAILABLE",
        "Semantic indexing requires OPENAI_API_KEY.",
      );
    }
    if (texts.length === 0) return [];

    let lastError: unknown;
    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        const response = await this.fetchImplementation(this.endpoint, {
          method: "POST",
          headers: {
            authorization: `Bearer ${this.apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            input: texts,
            model: this.model,
            dimensions: this.dimensions,
            encoding_format: "float",
          }),
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (!response.ok) {
          const retryable = response.status === 429 || response.status >= 500;
          if (retryable && attempt < this.maxAttempts) {
            await delay(100 * 2 ** (attempt - 1));
            continue;
          }
          throw new ApplicationError(
            "SERVICE_UNAVAILABLE",
            "The embedding provider rejected the request.",
          );
        }

        const payload = (await response.json()) as OpenAIEmbeddingResponse;
        const ordered = [...(payload.data ?? [])].sort(
          (left, right) => (left.index ?? 0) - (right.index ?? 0),
        );
        const embeddings = ordered.map((item) => item.embedding ?? []);
        if (embeddings.length !== texts.length) {
          throw new ApplicationError(
            "SERVICE_UNAVAILABLE",
            "The embedding provider returned an incomplete response.",
          );
        }
        return embeddings;
      } catch (error) {
        lastError = error;
        if (error instanceof ApplicationError || attempt === this.maxAttempts)
          break;
        await delay(100 * 2 ** (attempt - 1));
      }
    }

    if (lastError instanceof ApplicationError) throw lastError;
    throw new ApplicationError(
      "SERVICE_UNAVAILABLE",
      "The embedding provider is temporarily unavailable.",
      { cause: lastError },
    );
  }
}
