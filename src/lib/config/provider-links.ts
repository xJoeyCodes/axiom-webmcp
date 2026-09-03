import type { Provider } from "@/lib/types/axiom";

const mockProviderDestinations: Record<string, string> = {
  "atlas-dining": "https://example.com",
  "orbit-travel": "https://example.com",
  "pulse-events": "https://example.com",
};

function safeHttpsUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function getProviderVisitUrl(
  provider: Pick<Provider, "domain" | "slug">,
): string | null {
  const mockDestination = mockProviderDestinations[provider.slug];

  if (mockDestination) {
    return safeHttpsUrl(mockDestination);
  }

  if (provider.domain.endsWith(".example")) {
    return null;
  }

  return safeHttpsUrl(`https://${provider.domain}`);
}
