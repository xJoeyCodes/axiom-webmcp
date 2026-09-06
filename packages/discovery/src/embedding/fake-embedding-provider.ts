import { createHash } from "node:crypto";

import type { EmbeddingProvider } from "@axiom/core";

const concepts: readonly (readonly string[])[] = [
  ["restaurant", "restaurants", "dinner", "dining", "table", "meal"],
  ["reservation", "reserve", "booking", "book"],
  ["availability", "available", "space", "open"],
  ["flight", "flights", "plane", "airfare", "airline"],
  ["compare", "comparison"],
  ["event", "events", "concert", "show", "attend", "venue"],
  ["ticket", "tickets", "admission"],
  ["product", "products", "catalog", "item", "items"],
  ["cart", "basket", "shopping"],
  ["checkout", "order", "purchase", "buy"],
  ["search", "find", "lookup", "discover"],
  ["check", "retrieve", "get"],
];

function tokens(text: string): string[] {
  return (
    text
      .toLowerCase()
      .replace(/_/gu, " ")
      .match(/[a-z0-9]+/gu) ?? []
  );
}

function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(
    vector.reduce((sum, value) => sum + value ** 2, 0),
  );
  return magnitude === 0 ? vector : vector.map((value) => value / magnitude);
}

export class FakeEmbeddingProvider implements EmbeddingProvider {
  readonly provider = "fake";
  readonly model = "deterministic-semantic-fixture";
  readonly version = "1";

  constructor(readonly dimensions = 1_024) {}

  async embed(text: string): Promise<readonly number[]> {
    const vector = Array<number>(this.dimensions).fill(0);
    const words = tokens(text);
    for (const word of words) {
      const concept = concepts.findIndex((group) => group.includes(word));
      if (concept >= 0 && concept < this.dimensions) {
        vector[concept] = (vector[concept] ?? 0) + 2;
      }
      const digest = createHash("sha256").update(word).digest();
      const index =
        32 + (digest.readUInt32BE(0) % Math.max(1, this.dimensions - 32));
      if (index < this.dimensions) {
        vector[index] = (vector[index] ?? 0) + 0.35;
      }
    }
    return normalize(vector);
  }

  async embedMany(
    texts: readonly string[],
  ): Promise<readonly (readonly number[])[]> {
    return Promise.all(texts.map((text) => this.embed(text)));
  }
}
