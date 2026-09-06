import { AxiomError } from "./error.js";

function segment(value: string): string {
  // URL parsers normalize standalone dots even when percent-encoded.
  if (value === "." || value === "..") {
    throw new AxiomError(
      "VALIDATION_ERROR",
      "A path identifier cannot be a dot segment.",
    );
  }
  return encodeURIComponent(value);
}

export const routes = {
  discover: "/v1/discover",
  provider: (slug: string) => `/v1/providers/${segment(slug)}`,
  capabilities: (slug: string) => `/v1/providers/${segment(slug)}/capabilities`,
  capability: (slug: string, name: string) =>
    `/v1/providers/${segment(slug)}/capabilities/${segment(name)}`,
};
