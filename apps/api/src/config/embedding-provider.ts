import {
  CAPABILITY_EMBEDDING_DIMENSIONS,
  type EmbeddingProvider,
} from "@axiom/core";
import {
  FakeEmbeddingProvider,
  OpenAIEmbeddingProvider,
} from "@axiom/discovery";

import type { Environment } from "./environment.js";

export function createEmbeddingProvider(
  environment: Pick<
    Environment,
    "EMBEDDING_PROVIDER" | "EMBEDDING_MODEL" | "OPENAI_API_KEY"
  >,
): EmbeddingProvider {
  if (environment.EMBEDDING_PROVIDER === "fake") {
    return new FakeEmbeddingProvider(CAPABILITY_EMBEDDING_DIMENSIONS);
  }

  return new OpenAIEmbeddingProvider({
    apiKey: environment.OPENAI_API_KEY,
    model: environment.EMBEDDING_MODEL,
  });
}
