import type { AxiomClient } from "@/lib/api/axiom-client";
import { mockInspectionProvider } from "@/lib/mock/inspection-provider";
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

const MOCK_INSPECTED_AT = "2026-09-03T12:00:00.000Z";

const conceptAliases: Record<string, string> = {
  accommodation: "accommodation",
  airfare: "flight",
  available: "availability",
  booking: "reserve",
  book: "reserve",
  check: "availability",
  concert: "event",
  dining: "restaurant",
  dinner: "restaurant",
  discover: "search",
  eat: "restaurant",
  fare: "flight",
  find: "search",
  fly: "flight",
  food: "restaurant",
  locate: "search",
  plane: "flight",
  purchase: "buy",
  reservation: "reserve",
  show: "event",
  table: "restaurant",
  ticket: "event",
  travel: "flight",
  trip: "flight",
};

const ignoredTerms = new Set([
  "and",
  "for",
  "from",
  "into",
  "need",
  "please",
  "that",
  "the",
  "this",
  "with",
]);

const genericConcepts = new Set([
  "availability",
  "buy",
  "compare",
  "reserve",
  "search",
]);

interface QueryTerm {
  original: string;
  concept: string;
}

interface RankedCapability {
  match: CapabilityMatch;
  matchedConcepts: Set<string>;
  rawScore: number;
}

function singularize(token: string): string {
  if (token.endsWith("ies") && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.endsWith("s") && token.length > 4) {
    return token.slice(0, -1);
  }

  return token;
}

function lexicalTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .split(/[^a-z0-9]+/)
    .map(singularize)
    .filter((token) => token.length > 1 && !ignoredTerms.has(token));
}

function conceptFor(token: string): string {
  return conceptAliases[token] ?? token;
}

function documentConcepts(value: string): Set<string> {
  return new Set(lexicalTokens(value).map(conceptFor));
}

function queryTerms(value: string): QueryTerm[] {
  const seenConcepts = new Set<string>();

  return lexicalTokens(value).flatMap((original) => {
    const concept = conceptFor(original);

    if (seenConcepts.has(concept)) {
      return [];
    }

    seenConcepts.add(concept);
    return [{ original, concept }];
  });
}

function rankCapability(
  capability: Capability,
  terms: QueryTerm[],
): RankedCapability {
  const name = documentConcepts(capability.name);
  const description = documentConcepts(capability.description);
  const category = documentConcepts(capability.metadata.category);
  const tags = documentConcepts(capability.metadata.tags.join(" "));
  const matchedConcepts = new Set<string>();
  const matchedTerms = new Set<string>();
  let rawScore = 0;

  for (const term of terms) {
    let termScore = 0;

    if (name.has(term.concept)) termScore += 15;
    if (tags.has(term.concept)) termScore += 11;
    if (category.has(term.concept)) termScore += 8;
    if (description.has(term.concept)) termScore += 6;

    if (termScore > 0) {
      rawScore += termScore;
      matchedConcepts.add(term.concept);
      matchedTerms.add(term.original);
    }
  }

  const coverage = terms.length === 0 ? 0 : matchedConcepts.size / terms.length;
  const score = Math.min(
    99,
    Math.round(55 + coverage * 32 + Math.min(12, rawScore / 4)),
  );

  return {
    match: {
      capability,
      score,
      matchedTerms: [...matchedTerms],
    },
    matchedConcepts,
    rawScore,
  };
}

function providerConcepts(provider: Provider): {
  description: Set<string>;
  identity: Set<string>;
  industry: Set<string>;
} {
  return {
    description: documentConcepts(provider.description),
    identity: documentConcepts(`${provider.name} ${provider.domain}`),
    industry: documentConcepts(provider.metadata.industry),
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function invalidInspection(url: string, warning: string): InspectionResult {
  return {
    url,
    status: "invalid",
    provider: null,
    capabilities: [],
    inspectedAt: MOCK_INSPECTED_AT,
    warnings: [warning],
  };
}

function submissionIdFor(url: string): string {
  let hash = 2_166_136_261;
  for (const character of url) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  return `sub_mock_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export class MockAxiomClient implements AxiomClient {
  constructor(private readonly providers: Provider[] = mockProviders) {}

  async discover(query: string): Promise<DiscoveryResult[]> {
    const terms = queryTerms(query.trim());

    if (terms.length === 0) {
      return [];
    }

    await wait(120);

    const requiredSpecificConcepts = new Set(
      terms
        .map((term) => term.concept)
        .filter((concept) => !genericConcepts.has(concept)),
    );

    return this.providers
      .map((provider) => {
        const providerDocument = providerConcepts(provider);
        const matchedConcepts = new Set<string>();
        let providerRawScore = 0;

        for (const term of terms) {
          let termScore = 0;

          if (providerDocument.identity.has(term.concept)) termScore += 10;
          if (providerDocument.industry.has(term.concept)) termScore += 8;
          if (providerDocument.description.has(term.concept)) termScore += 5;

          if (termScore > 0) {
            providerRawScore += termScore;
            matchedConcepts.add(term.concept);
          }
        }

        const rankedCapabilities = provider.capabilities
          .map((capability) => rankCapability(capability, terms))
          .filter((ranked) => ranked.rawScore > 0)
          .sort(
            (left, right) =>
              right.rawScore - left.rawScore ||
              left.match.capability.name.localeCompare(
                right.match.capability.name,
              ),
          );

        for (const ranked of rankedCapabilities) {
          providerRawScore += ranked.rawScore;
          for (const concept of ranked.matchedConcepts) {
            matchedConcepts.add(concept);
          }
        }

        const matchesSpecificConcept = [...requiredSpecificConcepts].some(
          (concept) => matchedConcepts.has(concept),
        );
        const isRelevant =
          providerRawScore > 0 &&
          (requiredSpecificConcepts.size === 0 || matchesSpecificConcept);
        const coverage = matchedConcepts.size / terms.length;
        const score = Math.min(
          99,
          Math.round(62 + coverage * 25 + Math.min(12, providerRawScore / 5)),
        );

        return {
          isRelevant,
          result: {
            provider: clone(provider),
            score,
            matches: clone(rankedCapabilities.map((ranked) => ranked.match)),
          } satisfies DiscoveryResult,
          rawScore: providerRawScore,
        };
      })
      .filter((entry) => entry.isRelevant)
      .sort(
        (left, right) =>
          right.result.score - left.result.score ||
          right.rawScore - left.rawScore ||
          left.result.provider.name.localeCompare(right.result.provider.name),
      )
      .map((entry) => entry.result);
  }

  async getProvider(slug: string): Promise<Provider | null> {
    const provider =
      this.providers.find((entry) => entry.slug === slug) ??
      (mockInspectionProvider.slug === slug ? mockInspectionProvider : null);
    return provider ? clone(provider) : null;
  }

  async inspect(url: string): Promise<InspectionResult> {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url);
    } catch {
      return invalidInspection(url, "Enter an absolute HTTP or HTTPS URL.");
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return invalidInspection(
        url,
        "Only HTTP and HTTPS websites can be inspected.",
      );
    }

    await wait(180);

    const provider = this.providers.find(
      (entry) =>
        parsedUrl.hostname === entry.domain ||
        parsedUrl.hostname.endsWith(`.${entry.domain}`),
    );
    const isNorthstarDemo = [
      "example.com",
      "www.example.com",
      mockInspectionProvider.domain,
    ].includes(parsedUrl.hostname);

    if (provider || isNorthstarDemo) {
      const detectedProvider = clone(provider ?? mockInspectionProvider);
      if (isNorthstarDemo) detectedProvider.domain = parsedUrl.hostname;

      return {
        url: parsedUrl.toString(),
        status: "detected",
        provider: detectedProvider,
        capabilities: clone(detectedProvider.capabilities),
        inspectedAt: MOCK_INSPECTED_AT,
        warnings: [],
      };
    }

    return {
      url: parsedUrl.toString(),
      status: "not_found",
      provider: null,
      capabilities: [],
      inspectedAt: MOCK_INSPECTED_AT,
      warnings: ["No WebMCP capabilities were detected at this website."],
    };
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    const inspection = await this.inspect(input.url);
    await wait(140);

    if (inspection.status !== "detected" || !inspection.provider) {
      return {
        submissionId: submissionIdFor(input.url),
        status: "rejected",
        verificationStatus: "unverified",
        message:
          inspection.warnings[0] ??
          "The website could not be added to the mock registry.",
      };
    }

    return {
      submissionId: submissionIdFor(inspection.url),
      status: "accepted",
      verificationStatus: "verified",
      message: "Website accepted by the mock Axiom registry.",
      provider: clone(inspection.provider),
    };
  }
}
