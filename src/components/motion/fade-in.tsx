"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ComponentProps } from "react";

type FadeInProps = ComponentProps<typeof motion.div> & {
  delay?: number;
};

export function FadeIn({ children, delay = 0, ...props }: FadeInProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.24, delay, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
