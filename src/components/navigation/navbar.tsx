import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { MobileNav } from "@/components/navigation/mobile-nav";

const navigation = [
  { href: "/discover", label: "Discover" },
  { href: "/developers", label: "Developers" },
  { href: "/docs", label: "Docs" },
] as const;

export function Navbar() {
  return (
    <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur-sm">
      <PageContainer className="relative flex h-16 items-center justify-between">
        <Link
          href="/"
          className="text-foreground font-mono text-[13px] font-medium tracking-[0.18em]"
        >
          AXIOM
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-8 sm:flex"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-secondary hover:text-foreground text-[13px] transition-colors duration-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden sm:block">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="text-secondary hover:text-foreground font-mono text-xs transition-colors duration-200"
          >
            GitHub <span aria-hidden>↗</span>
          </a>
        </div>
        <MobileNav links={navigation} />
      </PageContainer>
    </header>
  );
}
