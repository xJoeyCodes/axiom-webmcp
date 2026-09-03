"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { SchemaViewer } from "@/components/provider/schema-viewer";
import type { Capability } from "@/lib/types/axiom";

interface CapabilityItemProps {
  capability: Capability;
  index: number;
}

export function CapabilityItem({ capability, index }: CapabilityItemProps) {
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();
  const headingId = `${capability.id}-title`;
  const panelId = `${capability.id}-schema`;

  useEffect(() => {
    function openFromHash() {
      if (window.location.hash === `#${capability.name}`) {
        setExpanded(true);
      }
    }

    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [capability.name]);

  return (
    <article
      id={capability.name}
      className="border-border scroll-mt-24 border-b"
    >
      <div className="grid min-w-0 gap-5 py-8 sm:py-9 lg:grid-cols-[2.5rem_minmax(0,1fr)_12rem_8rem] lg:items-start lg:gap-8">
        <span className="text-muted hidden pt-1 font-mono text-[10px] lg:block">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="min-w-0">
          <h3
            id={headingId}
            className="text-foreground font-mono text-sm break-all sm:text-[15px]"
          >
            {capability.name}
          </h3>
          <p className="text-secondary mt-3 max-w-2xl text-sm leading-6">
            {capability.description}
          </p>
        </div>

        <p className="text-muted flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[9px] tracking-[0.08em] uppercase lg:pt-1">
          {capability.metadata.category}
          <span aria-hidden="true">·</span>
          {capability.metadata.destructive ? "Writes data" : "Read only"}
        </p>

        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={`${expanded ? "Hide" : "View"} schema for ${capability.name}`}
          onClick={() => setExpanded((value) => !value)}
          className="text-secondary hover:text-foreground flex min-h-10 w-full items-center justify-between gap-3 text-xs transition-colors duration-200 lg:justify-end lg:pt-0"
        >
          <span>{expanded ? "Hide schema" : "View schema"}</span>
          <Plus
            aria-hidden
            size={15}
            strokeWidth={1.5}
            className={`shrink-0 transition-transform duration-200 ${
              expanded ? "rotate-45" : "rotate-0"
            }`}
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={headingId}
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
            className="overflow-hidden pb-8 sm:pb-10"
          >
            <SchemaViewer capability={capability} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}
