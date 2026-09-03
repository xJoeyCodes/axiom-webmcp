"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Plus, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { SchemaViewer } from "@/components/provider/schema-viewer";
import type { Capability } from "@/lib/types/axiom";

interface InspectionCapabilityProps {
  capability: Capability;
  index: number;
}

export function InspectionCapability({
  capability,
  index,
}: InspectionCapabilityProps) {
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();
  const panelId = `inspection-${capability.id}-schema`;
  const headingId = `inspection-${capability.id}-title`;
  const warning = capability.metadata.destructive;

  return (
    <article className="border-border border-b">
      <div className="grid min-w-0 gap-4 py-6 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:items-start sm:gap-6">
        <span className="text-muted hidden pt-0.5 font-mono text-[10px] sm:block">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h3
              id={headingId}
              className="text-foreground font-mono text-xs break-all sm:text-[13px]"
            >
              {capability.name}
            </h3>
            <span className="text-muted inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.08em] uppercase">
              {warning ? (
                <TriangleAlert aria-hidden size={11} strokeWidth={1.5} />
              ) : (
                <Check aria-hidden size={11} strokeWidth={1.7} />
              )}
              {warning ? "Valid · review action" : "Valid"}
            </span>
          </div>
          <p className="text-muted mt-2 max-w-2xl text-xs leading-5">
            {capability.description}
          </p>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={`${expanded ? "Hide" : "View"} schema for ${capability.name}`}
          onClick={() => setExpanded((value) => !value)}
          className="text-secondary hover:text-foreground flex min-h-10 items-center justify-between gap-3 text-xs transition-colors duration-200 sm:justify-end"
        >
          {expanded ? "Hide schema" : "Review schema"}
          <Plus
            aria-hidden
            size={14}
            strokeWidth={1.5}
            className={`transition-transform duration-200 ${expanded ? "rotate-45" : ""}`}
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
            className="overflow-hidden pb-7"
          >
            <SchemaViewer capability={capability} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}
