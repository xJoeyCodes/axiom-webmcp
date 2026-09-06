import type { Provider } from "@/lib/types/axiom";

function safeProviderUrl(value: string): string | null {
  try {
    const url = new URL(value);
    const localHttp =
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1");
    if (url.protocol !== "https:" && !localHttp) return null;
    if (url.hostname.endsWith(".example")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function getProviderVisitUrl(
  provider: Pick<Provider, "canonicalUrl" | "domain">,
): string | null {
  return safeProviderUrl(provider.canonicalUrl ?? `https://${provider.domain}`);
}
