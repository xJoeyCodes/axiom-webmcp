import { describe, expect, it } from "vitest";

import {
  createProviderSlug,
  isValidProviderSlug,
  normalizeDomain,
  normalizeUrl,
} from "./normalization.js";

describe("domain normalization", () => {
  it.each([
    ["HTTPS://WWW.Example.COM/path?q=1", "example.com"],
    ["example.com", "example.com"],
    ["http://example.com/", "example.com"],
  ])("normalizes %s to the provider domain", (input, expected) => {
    expect(normalizeDomain(input)).toBe(expected);
  });

  it("normalizes canonical URLs to a secure origin", () => {
    expect(normalizeUrl("http://www.Example.com/products?q=one#details")).toBe(
      "https://example.com",
    );
  });

  it("creates stable provider slugs", () => {
    expect(createProviderSlug("  Café Northstar  ")).toBe("cafe-northstar");
    expect(isValidProviderSlug("cafe-northstar")).toBe(true);
    expect(isValidProviderSlug("Café Northstar")).toBe(false);
  });

  it("rejects non-HTTP schemes", () => {
    expect(() => normalizeDomain("file:///tmp/example")).toThrow(
      "Only HTTP and HTTPS URLs are supported.",
    );
  });
});
