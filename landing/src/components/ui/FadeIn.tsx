"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { motionTransition, viewportOnce } from "@/lib/motion";

type FadeInProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variants?: Variants;
  as?: "div" | "section" | "li";
};

const motionByTag = {
  div: motion.div,
  section: motion.section,
  li: motion.li,
} as const;

export default function FadeIn({
  children,
  className,
  delay = 0,
  variants,
  as = "div",
}: FadeInProps) {
  const reduceMotion = useReducedMotion();
  const Component = motionByTag[as];

  return (
    <Component
      className={className}
      initial={reduceMotion ? false : "hidden"}
      whileInView={reduceMotion ? undefined : "visible"}
      viewport={viewportOnce}
      variants={
        variants ?? {
          hidden: { opacity: 0, y: 18 },
          visible: { opacity: 1, y: 0 },
        }
      }
      transition={{ ...motionTransition, delay }}
    >
      {children}
    </Component>
  );
}
