import { SuggestedIntents } from "@/components/discovery/suggested-intents";

const popularIntents = ["Book a flight", "Reserve dinner", "Find an event"];
const alternativeIntents = [
  "Book accommodation",
  "Schedule an appointment",
  "Find event tickets",
];

interface DiscoveryEmptyProps {
  query?: string;
}

export function DiscoveryEmpty({ query }: DiscoveryEmptyProps) {
  if (!query) {
    return (
      <section className="border-border mt-14 border-t pt-9 sm:mt-16 sm:pt-10">
        <p className="text-muted font-mono text-[10px] tracking-[0.13em] uppercase">
          Popular intents
        </p>
        <div className="mt-4">
          <SuggestedIntents intents={popularIntents} />
        </div>
      </section>
    );
  }

  return (
    <section
      className="border-border mt-14 border-t py-14 sm:mt-16 sm:py-16"
      aria-labelledby="no-results-title"
    >
      <p className="text-muted font-mono text-[10px] tracking-[0.13em] uppercase">
        No match
      </p>
      <h2
        id="no-results-title"
        className="text-foreground mt-5 text-2xl font-normal tracking-[-0.03em]"
      >
        No matching capabilities.
      </h2>
      <p className="text-secondary mt-3 max-w-md text-sm leading-6">
        Try describing the action differently or start with one of these
        intents.
      </p>
      <div className="mt-7">
        <SuggestedIntents intents={alternativeIntents} />
      </div>
    </section>
  );
}
