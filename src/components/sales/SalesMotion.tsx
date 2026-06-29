"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import {
  SALES_IN_VIEW_INITIAL,
  SALES_IN_VIEW_TRANSITION,
  SALES_IN_VIEW_VIEWPORT,
  SALES_IN_VIEW_VISIBLE,
  SALES_MOTION_LAYER_CLASS,
} from "@/lib/sales/sales-motion";

type SalesMotionProps = HTMLMotionProps<"div"> & {
  /** false = animate/exit (panel, modal); true = whileInView scroll reveal */
  scrollReveal?: boolean;
};

export default function SalesMotion({
  className = "",
  scrollReveal = true,
  initial,
  animate,
  whileInView,
  transition,
  viewport,
  style,
  onViewportEnter,
  onAnimationStart,
  ...rest
}: SalesMotionProps) {
  const reducedMotion = usePrefersReducedMotion();

  const useScrollReveal = scrollReveal && animate === undefined;

  const resolvedInitial = initial ?? (useScrollReveal ? SALES_IN_VIEW_INITIAL : undefined);
  const resolvedWhileInView = useScrollReveal
    ? (whileInView ?? SALES_IN_VIEW_VISIBLE)
    : whileInView;
  const resolvedTransition = { ...SALES_IN_VIEW_TRANSITION, ...transition };
  const resolvedViewport = { ...SALES_IN_VIEW_VIEWPORT, ...viewport };

  const logAnimation = () => {
    console.log("Animasyon tetiklendi");
  };

  return (
    <motion.div
      initial={reducedMotion ? false : resolvedInitial}
      animate={reducedMotion ? undefined : animate}
      whileInView={reducedMotion || !useScrollReveal ? undefined : resolvedWhileInView}
      transition={reducedMotion ? { duration: 0 } : resolvedTransition}
      viewport={useScrollReveal ? resolvedViewport : viewport}
      onViewportEnter={
        useScrollReveal
          ? (...args) => {
              logAnimation();
              onViewportEnter?.(...args);
            }
          : onViewportEnter
      }
      onAnimationStart={
        !useScrollReveal
          ? (...args) => {
              logAnimation();
              onAnimationStart?.(...args);
            }
          : onAnimationStart
      }
      className={`${SALES_MOTION_LAYER_CLASS} ${className}`.trim()}
      style={{ willChange: "transform", ...style }}
      {...rest}
    />
  );
}
