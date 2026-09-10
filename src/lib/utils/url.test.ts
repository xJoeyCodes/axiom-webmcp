import { describe, expect, it } from "vitest";

import { normalizeWebsiteUrl } from "./url";

describe("normalizeWebsiteUrl", () => {
  it("preserves valid HTTPS URLs", () => {
    expect(normalizeWebsiteUrl("https://www.example.com/path#section")).toBe(
      "https://www.example.com/path",
    );
  });

  it("adds HTTPS when the scheme is omitted", () => {
    expect(normalizeWebsiteUrl("example.com")).toBe("https://example.com/");
  });

  it("rejects unsupported URLs and credentials", () => {
    expect(normalizeWebsiteUrl("file:///tmp/axiom.json")).toBeNull();
    expect(normalizeWebsiteUrl("https://user:secret@example.com")).toBeNull();
    expect(normalizeWebsiteUrl("")).toBeNull();
  });
});
