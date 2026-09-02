import type { AxiomClient } from "@/lib/api/axiom-client";
import { mockProviders } from "@/lib/mock/providers";
import type {
  Capability,
  CapabilityMatch,
  DiscoveryResult,
  InspectionResult,
  Provider,
  PublishInput,
  PublishResult,
} from "@/lib/types/axiom";

const relatedTerms: Record<string, string[]> = {
  buy: ["reserve", "book", "transaction"],
  dinner: ["dining", "restaurant", "table", "food"],
  dine: ["dining", "restaurant", "table", "food"],
  eat: ["dining", "restaurant", "food"],
  fare: ["flight", "airfare", "travel"],
  fly: ["flight", "airfare", "travel"],
  plane: ["flight", "airfare", "travel"],
  restaurant: ["dining", "dinner", "table", "food"],
  show: ["event", "concert", "ticket"],
  tickets: ["ticket", "event", "concert"],
  ticket: ["tickets", "event", "concert"],
};

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1)
    .map((token) => {
      if (token.endsWith("ies")) return `${token.slice(0, -3)}y`;
      if (token.endsWith("s") && token.length > 4) return token.slice(0, -1);
      return token;
    });
}

function capabilityDocument(
  provider: Provider,
  capability: Capability,
): Set<string> {
  return new Set(
    tokens(
      [
        provider.name,
        provider.domain,
        provider.description,
        capability.name,
        capability.description,
        capability.metadata.category,
        ...capability.metadata.tags,
      ].join(" "),
    ),
  );
}

function rankCapability(
  provider: Provider,
  capability: Capability,
  queryTokens: string[],
): CapabilityMatch {
  const document = capabilityDocument(provider, capability);
  let score = 0;
  const matchedTerms = new Set<string>();

  for (const queryToken of queryTokens) {
    if (document.has(queryToken)) {
      score += 6;
      matchedTerms.add(queryToken);
    }

    for (const related of relatedTerms[queryToken] ?? []) {
      const normalizedRelated = tokens(related)[0] ?? related;
      if (document.has(normalizedRelated)) {
        score += 2;
        matchedTerms.add(queryToken);
        break;
      }
    }
  }

  if (tokens(capability.name).every((token) => document.has(token))) {
    score += queryTokens.some((token) => capability.name.includes(token))
      ? 2
      : 0;
  }

  return { capability, score, matchedTerms: [...matchedTerms] };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class MockAxiomClient implements AxiomClient {
  constructor(private readonly providers: Provider[] = mockProviders) {}

  async discover(query: string): Promise<DiscoveryResult[]> {
    const queryTokens = tokens(query);

    if (queryTokens.length === 0) {
      return this.providers.map((provider) => ({
        provider: clone(provider),
        score: 0,
        matches: provider.capabilities.map((capability) => ({
          capability: clone(capability),
          score: 0,
          matchedTerms: [],
        })),
      }));
    }

    return this.providers
      .map((provider) => {
        const matches = provider.capabilities
          .map((capability) =>
            rankCapability(provider, capability, queryTokens),
          )
          .filter((match) => match.score > 0)
          .sort((a, b) => b.score - a.score);
        const score = matches.reduce(
          (total, match, index) => total + match.score / (index + 1),
          0,
        );

        return { provider: clone(provider), score, matches: clone(matches) };
      })
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  async getProvider(slug: string): Promise<Provider | null> {
    const provider = this.providers.find((entry) => entry.slug === slug);
    return provider ? clone(provider) : null;
  }

  async inspect(url: string): Promise<InspectionResult> {
    const inspectedAt = new Date().toISOString();

    try {
      const parsedUrl = new URL(url);
      const provider = this.providers.find(
        (entry) =>
          parsedUrl.hostname === entry.domain ||
          parsedUrl.hostname.endsWith(`.${entry.domain}`),
      );

      return provider
        ? {
            url: parsedUrl.toString(),
            status: "detected",
            provider: clone(provider),
            capabilities: clone(provider.capabilities),
            inspectedAt,
            warnings: [],
          }
        : {
            url: parsedUrl.toString(),
            status: "not_found",
            provider: null,
            capabilities: [],
            inspectedAt,
            warnings: ["No WebMCP manifest was found by the mock inspector."],
          };
    } catch {
      return {
        url,
        status: "invalid",
        provider: null,
        capabilities: [],
        inspectedAt,
        warnings: ["Enter an absolute HTTP or HTTPS URL."],
      };
    }
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    const inspection = await this.inspect(input.url);

    if (inspection.status === "invalid") {
      return {
        submissionId: "",
        status: "rejected",
        verificationStatus: "unverified",
        message: inspection.warnings[0],
      };
    }

    return {
      submissionId: `sub_${crypto.randomUUID()}`,
      status: "queued",
      verificationStatus: "pending",
      message: "Website queued for WebMCP verification and indexing.",
      provider: inspection.provider ?? undefined,
    };
  }
}
