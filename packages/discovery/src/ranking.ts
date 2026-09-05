import type { CapabilitySearchCandidate, Provider } from "@axiom/core";

export const DISCOVERY_RANKING_WEIGHTS = {
  semantic: 0.9,
  lexical: 0.08,
  verification: 0.02,
  additionalCapabilityBonus: 0.01,
  maximumAdditionalBonus: 0.03,
} as const;

export interface RankedCapability {
  readonly candidate: CapabilitySearchCandidate;
  readonly score: number;
  readonly matchedTerms: readonly string[];
}

export interface RankedProvider {
  readonly provider: Provider;
  readonly score: number;
  readonly capabilities: readonly RankedCapability[];
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function tokenize(value: string): string[] {
  return (
    value
      .toLowerCase()
      .replace(/_/gu, " ")
      .match(/[a-z0-9]+/gu) ?? []
  );
}

function lexicalSignal(
  intent: string,
  candidate: CapabilitySearchCandidate,
): { score: number; terms: readonly string[] } {
  const queryTokens = [...new Set(tokenize(intent))];
  const searchable = new Set(
    tokenize(
      `${candidate.capability.name} ${candidate.capability.description} ${candidate.provider.name}`,
    ),
  );
  const terms = queryTokens.filter((token) => searchable.has(token));
  const overlap =
    queryTokens.length === 0 ? 0 : terms.length / queryTokens.length;
  const capabilityPhrase = candidate.capability.name.replace(/_/gu, " ");
  const phraseBoost = intent.toLowerCase().includes(capabilityPhrase) ? 0.2 : 0;
  return { score: clamp(overlap + phraseBoost), terms };
}

export function rankAndGroupCandidates(
  intent: string,
  candidates: readonly CapabilitySearchCandidate[],
  providerLimit: number,
  minimumScore: number,
): readonly RankedProvider[] {
  const grouped = new Map<string, RankedCapability[]>();
  for (const candidate of candidates) {
    const lexical = lexicalSignal(intent, candidate);
    const score = clamp(
      candidate.similarity * DISCOVERY_RANKING_WEIGHTS.semantic +
        lexical.score * DISCOVERY_RANKING_WEIGHTS.lexical +
        (candidate.provider.verificationStatus === "verified"
          ? DISCOVERY_RANKING_WEIGHTS.verification
          : 0),
    );
    if (score < minimumScore) continue;
    const matches = grouped.get(candidate.provider.id) ?? [];
    matches.push({ candidate, score, matchedTerms: lexical.terms });
    grouped.set(candidate.provider.id, matches);
  }

  return [...grouped.values()]
    .map((capabilities) => {
      const sorted = capabilities.sort(
        (left, right) => right.score - left.score,
      );
      const best = sorted[0]!;
      const bonus = Math.min(
        DISCOVERY_RANKING_WEIGHTS.maximumAdditionalBonus,
        Math.max(0, sorted.length - 1) *
          DISCOVERY_RANKING_WEIGHTS.additionalCapabilityBonus,
      );
      return {
        provider: best.candidate.provider,
        score: clamp(best.score + bonus),
        capabilities: sorted.slice(0, 5),
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.provider.name.localeCompare(right.provider.name),
    )
    .slice(0, providerLimit);
}
