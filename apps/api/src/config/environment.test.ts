import { describe, expect, it } from "vitest";

import { loadEnvironment } from "./environment.js";

describe("API environment", () => {
  it("accepts the blank optional key from .env.example and rejects incompatible models", () => {
    expect(
      loadEnvironment({
        DATABASE_URL: "postgresql://localhost/axiom",
        OPENAI_API_KEY: " ",
      }).OPENAI_API_KEY,
    ).toBeUndefined();
    expect(() =>
      loadEnvironment({
        DATABASE_URL: "postgresql://localhost/axiom",
        EMBEDDING_MODEL: "other-model",
      }),
    ).toThrow("Invalid API environment");
  });
  it("loads validated settings and explicit CORS origins", () => {
    expect(
      loadEnvironment({
        DATABASE_URL: "postgresql://axiom:axiom@localhost:5432/axiom",
        PORT: "4100",
        CORS_ORIGINS: "http://localhost:3000,https://axiom.example",
      }),
    ).toMatchObject({
      PORT: 4_100,
      CORS_ORIGINS: ["http://localhost:3000", "https://axiom.example"],
    });
  });

  it("fails clearly when DATABASE_URL is missing", () => {
    expect(() => loadEnvironment({})).toThrow("Invalid API environment");
  });

  it("rejects wildcard CORS", () => {
    expect(() =>
      loadEnvironment({
        DATABASE_URL: "postgresql://axiom:axiom@localhost:5432/axiom",
        CORS_ORIGINS: "*",
      }),
    ).toThrow("Wildcard CORS origins are not permitted");
  });
});
