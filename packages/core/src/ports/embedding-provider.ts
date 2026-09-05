export const CAPABILITY_EMBEDDING_DIMENSIONS = 1_024;
export const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";

export interface EmbeddingProvider {
  readonly provider: string;
  readonly model: string;
  readonly dimensions: number;
  readonly version: string;
  embed(text: string): Promise<readonly number[]>;
  embedMany(texts: readonly string[]): Promise<readonly (readonly number[])[]>;
}
