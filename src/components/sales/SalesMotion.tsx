"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { useMotionReady } from "@/hooks/useMotionReady";
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
  const motionReady = useMotionReady();
  const reducedMotion = usePrefersReducedMotion();

  const useScrollReveal = scrollReveal && animate === undefined;
  const canAnimate = motionReady && !reducedMotion;

  const resolvedInitial = initial ?? (useScrollReveal ? SALES_IN_VIEW_INITIAL : undefined);
  const resolvedWhileInView = useScrollReveal
    ? (whileInView ?? SALES_IN_VIEW_VISIBLE)
    : whileInView;
  const resolvedTransition = { ...SALES_IN_VIEW_TRANSITION, ...transition };
  const resolvedViewport = { ...SALES_IN_VIEW_VIEWPORT, ...viewport };

  return (
    <motion.div
      initial={canAnimate ? resolvedInitial : false}
      animate={canAnimate ? animate : undefined}
      whileInView={canAnimate && useScrollReveal ? resolvedWhileInView : undefined}
      transition={canAnimate ? resolvedTransition : { duration: 0 }}
      viewport={useScrollReveal ? resolvedViewport : viewport}
      onViewportEnter={onViewportEnter}
      onAnimationStart={onAnimationStart}
      className={`${SALES_MOTION_LAYER_CLASS} ${className}`.trim()}
      style={{ willChange: canAnimate ? "transform" : undefined, ...style }}
      {...rest}
    />
  );
}
