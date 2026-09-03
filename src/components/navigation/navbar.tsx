"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";

const navigation = [
  { href: "/discover", label: "Discover" },
  { href: "/developers", label: "Developers" },
  { href: "/docs", label: "Docs" },
] as const;

function subscribeToScroll(onStoreChange: () => void) {
  window.addEventListener("scroll", onStoreChange, { passive: true });
  return () => window.removeEventListener("scroll", onStoreChange);
}

function getScrollSnapshot() {
  return window.scrollY > 16;
}

function getServerScrollSnapshot() {
  return false;
}

function isActivePath(pathname: string, href: string) {
  if (href === "/discover" && pathname.startsWith("/site/")) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const scrolled = useSyncExternalStore(
    subscribeToScroll,
    getScrollSnapshot,
    getServerScrollSnapshot,
  );
  const isLandingPage = pathname === "/";

  return (
    <header
      className={cn(
        "top-0 z-50 w-full border-b transition-[background-color,border-color,backdrop-filter] duration-200",
        isLandingPage ? "fixed" : "sticky",
        isLandingPage && !scrolled
          ? "border-transparent bg-transparent"
          : "border-border bg-background/88 backdrop-blur-md",
      )}
    >
      <PageContainer className="relative flex h-16 items-center justify-between">
        <Link
          href="/"
          aria-label="Axiom home"
          className="text-foreground font-mono text-[12px] font-medium tracking-[0.2em]"
        >
          AXIOM
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-8 sm:flex"
        >
          {navigation.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-secondary hover:text-foreground text-[13px] transition-colors duration-200",
                  active && "text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden sm:block">
          <a
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Axiom on GitHub in a new tab"
            className="text-secondary hover:text-foreground font-mono text-[11px] transition-colors duration-200"
          >
            GitHub <span aria-hidden>↗</span>
          </a>
        </div>
        <MobileNav links={navigation} githubUrl={siteConfig.githubUrl} />
      </PageContainer>
    </header>
  );
}
