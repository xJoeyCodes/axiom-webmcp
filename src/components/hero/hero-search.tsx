import { ArrowRight } from "lucide-react";

export function HeroSearch() {
  return (
    <form
      action="/discover"
      method="get"
      role="search"
      className="relative w-full"
    >
      <label htmlFor="hero-discovery-query" className="sr-only">
        Search websites by capability
      </label>
      <input
        id="hero-discovery-query"
        name="q"
        type="search"
        required
        pattern=".*\S.*"
        title="Enter a capability to discover"
        placeholder="What does your agent need to do?"
        autoComplete="off"
        className="text-foreground placeholder:text-muted focus-visible:ring-foreground focus-visible:ring-offset-background h-14 w-full rounded-[6px] border border-white/15 bg-[#0b0c0f]/88 px-4 pr-14 text-sm shadow-[0_18px_70px_rgba(0,0,0,0.36)] backdrop-blur-md transition-[border-color,background-color] duration-200 hover:border-white/20 focus:border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:h-16 sm:px-5 sm:pr-16 sm:text-base"
      />
      <button
        type="submit"
        aria-label="Discover capabilities"
        className="bg-foreground text-background absolute top-1/2 right-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-[4px] transition-colors duration-200 hover:bg-white/85 sm:right-2.5 sm:size-11"
      >
        <ArrowRight aria-hidden size={17} strokeWidth={1.7} />
      </button>
    </form>
  );
}
