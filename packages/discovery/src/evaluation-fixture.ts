export interface DiscoveryEvaluationCase {
  readonly intent: string;
  readonly expectedProvider: string;
  readonly expectedCapability: string;
}

export const discoveryEvaluationCases: readonly DiscoveryEvaluationCase[] = [
  {
    intent: "reserve dinner",
    expectedProvider: "atlas-dining",
    expectedCapability: "make_reservation",
  },
  {
    intent: "book a restaurant",
    expectedProvider: "atlas-dining",
    expectedCapability: "make_reservation",
  },
  {
    intent: "check if a restaurant has space",
    expectedProvider: "atlas-dining",
    expectedCapability: "check_availability",
  },
  {
    intent: "find flights",
    expectedProvider: "orbit-travel",
    expectedCapability: "search_flights",
  },
  {
    intent: "compare plane tickets",
    expectedProvider: "orbit-travel",
    expectedCapability: "compare_flights",
  },
  {
    intent: "reserve a flight",
    expectedProvider: "orbit-travel",
    expectedCapability: "reserve_flight",
  },
  {
    intent: "buy concert tickets",
    expectedProvider: "pulse-events",
    expectedCapability: "reserve_ticket",
  },
  {
    intent: "find something to attend",
    expectedProvider: "pulse-events",
    expectedCapability: "search_events",
  },
  {
    intent: "check ticket availability",
    expectedProvider: "pulse-events",
    expectedCapability: "check_tickets",
  },
  {
    intent: "search for products",
    expectedProvider: "northstar-commerce",
    expectedCapability: "search_products",
  },
  {
    intent: "put an item in my shopping basket",
    expectedProvider: "northstar-commerce",
    expectedCapability: "add_to_cart",
  },
  {
    intent: "look up product details",
    expectedProvider: "northstar-commerce",
    expectedCapability: "get_product",
  },
] as const;

export interface DiscoveryEvaluationSummary {
  readonly queries: number;
  readonly top1Provider: number;
  readonly top3Provider: number;
  readonly capabilityHit: number;
}

export async function evaluateDiscovery(
  discover: (intent: string) => Promise<
    readonly {
      readonly provider: { readonly slug: string };
      readonly capabilities: readonly {
        readonly candidate: { readonly capability: { readonly name: string } };
      }[];
    }[]
  >,
  cases = discoveryEvaluationCases,
): Promise<DiscoveryEvaluationSummary> {
  let top1Provider = 0;
  let top3Provider = 0;
  let capabilityHit = 0;
  for (const testCase of cases) {
    const results = await discover(testCase.intent);
    if (results[0]?.provider.slug === testCase.expectedProvider)
      top1Provider += 1;
    if (
      results
        .slice(0, 3)
        .some((result) => result.provider.slug === testCase.expectedProvider)
    )
      top3Provider += 1;
    const provider = results.find(
      (result) => result.provider.slug === testCase.expectedProvider,
    );
    if (
      provider?.capabilities.some(
        (match) =>
          match.candidate.capability.name === testCase.expectedCapability,
      )
    )
      capabilityHit += 1;
  }
  return { queries: cases.length, top1Provider, top3Provider, capabilityHit };
}
