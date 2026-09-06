import type { FrontendAxiomClient } from "@/lib/api/axiom-client";
import { HttpAxiomClient } from "@/lib/api/http-axiom-client";
import { MockFrontendAxiomClient } from "@/lib/mock/mock-frontend-client";

export type AxiomDataMode = "http" | "mock";

let client: FrontendAxiomClient | undefined;

function resolveMode(value: string | undefined): AxiomDataMode {
  const mode = value?.trim() || "http";
  if (mode !== "http" && mode !== "mock") {
    throw new Error(
      "NEXT_PUBLIC_AXIOM_DATA_MODE must be either 'http' or 'mock'.",
    );
  }
  return mode;
}

export function normalizePublicApiUrl(value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(
      "NEXT_PUBLIC_AXIOM_API_URL is required when Axiom uses HTTP data mode.",
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_AXIOM_API_URL must be an absolute URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("NEXT_PUBLIC_AXIOM_API_URL must use HTTP or HTTPS.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      "NEXT_PUBLIC_AXIOM_API_URL cannot include credentials, a query, or a fragment.",
    );
  }

  return url.toString().replace(/\/$/u, "");
}

export function createAxiomClient(
  modeValue = process.env.NEXT_PUBLIC_AXIOM_DATA_MODE,
  apiUrlValue = process.env.NEXT_PUBLIC_AXIOM_API_URL,
): FrontendAxiomClient {
  const mode = resolveMode(modeValue);
  if (mode === "mock") return new MockFrontendAxiomClient();

  return new HttpAxiomClient({
    baseUrl: normalizePublicApiUrl(apiUrlValue),
    timeoutMs: 10_000,
  });
}

export function getAxiomClient(): FrontendAxiomClient {
  client ??= createAxiomClient();
  return client;
}
