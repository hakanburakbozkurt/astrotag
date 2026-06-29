"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { SALES_MOTION_LAYER_CLASS } from "@/lib/sales/sales-motion";

type SalesMotionProps = HTMLMotionProps<"div">;

export default function SalesMotion({
  className = "",
  initial,
  animate,
  whileInView,
  transition,
  viewport,
  ...rest
}: SalesMotionProps) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : initial}
      animate={reducedMotion ? undefined : animate}
      whileInView={reducedMotion ? undefined : whileInView}
      transition={reducedMotion ? { duration: 0 } : transition}
      viewport={viewport}
      className={`${SALES_MOTION_LAYER_CLASS} ${className}`.trim()}
      style={{ willChange: "transform", ...rest.style }}
      {...rest}
    />
  );
}
