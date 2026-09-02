"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ComponentProps } from "react";

export function Reveal({
  children,
  ...props
}: ComponentProps<typeof motion.div>) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduceMotion ? 0 : 0.28, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
