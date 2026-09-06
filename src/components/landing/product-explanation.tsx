import { PageContainer } from "@/components/layout/page-container";
import { Reveal } from "@/components/motion/reveal";

const principles = [
  {
    number: "01",
    title: "Expose",
    description:
      "Your website publishes actions through WebMCP. Axiom inspects those contracts and normalizes them into capabilities.",
  },
  {
    number: "02",
    title: "Discover",
    description:
      "Agents query Axiom by intent and find websites capable of performing the actions they need.",
  },
] as const;

export function ProductExplanation() {
  return (
    <section
      aria-labelledby="product-explanation-title"
      className="py-24 sm:py-32 lg:py-40"
    >
      <PageContainer>
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div>
              <p className="text-muted font-mono text-[10px] tracking-[0.15em] uppercase">
                Two sides. One index.
              </p>
              <h2
                id="product-explanation-title"
                className="text-foreground mt-5 max-w-sm text-3xl leading-tight font-normal tracking-[-0.04em] sm:text-4xl"
              >
                Index what your website can do.
              </h2>
            </div>

            <ol className="border-border border-t">
              {principles.map((principle) => (
                <li
                  key={principle.number}
                  className="border-border grid gap-5 border-b py-8 sm:grid-cols-[3rem_minmax(0,1fr)] sm:py-10"
                >
                  <span className="text-muted font-mono text-[10px]">
                    {principle.number}
                  </span>
                  <div>
                    <h3 className="text-foreground text-xl font-normal tracking-[-0.025em] sm:text-2xl">
                      {principle.title}
                    </h3>
                    <p className="text-secondary mt-3 max-w-xl text-sm leading-6 sm:text-base sm:leading-7">
                      {principle.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </PageContainer>
    </section>
  );
}
