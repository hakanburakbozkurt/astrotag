"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

const CONFETTI_COLORS = ["#fbbf24", "#34d399", "#38bdf8", "#f472b6", "#fde68a", "#c4b5fd"];

export default function ConfettiBurst() {
  const particles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => ({
        id: index,
        x: (Math.random() - 0.5) * 320,
        y: 120 + Math.random() * 220,
        rotate: Math.random() * 720 - 360,
        delay: Math.random() * 0.25,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 8,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          initial={{ opacity: 0, x: 0, y: -20, rotate: 0, scale: 0.6 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: particle.x,
            y: particle.y,
            rotate: particle.rotate,
            scale: [0.6, 1, 0.8],
          }}
          transition={{
            duration: 1.6,
            delay: particle.delay,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="absolute left-1/2 top-1/3 rounded-sm"
          style={{
            width: particle.size,
            height: particle.size * 0.55,
            backgroundColor: particle.color,
          }}
        />
      ))}
    </div>
  );
}
