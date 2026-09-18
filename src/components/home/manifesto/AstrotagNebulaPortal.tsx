"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { motion } from "framer-motion";
import {
  MANIFESTO_DISSOLVE_SECONDS,
  MANIFESTO_IDLE_DUST_COUNT,
  MANIFESTO_RITUAL_DURATION_MS,
  type NebulaPortalPhase,
} from "@/components/home/manifesto/manifesto-portal.constants";
import {
  createPortalDustMatrix,
  STREAM_STAR_CLASS,
} from "@/components/home/manifesto/manifesto-energy-dust";
import {
  createStardustParticles,
  getStardustParticleClass,
  type StardustParticle,
} from "@/components/home/manifesto/manifesto-stardust";
import ManifestoPortalVideo from "@/components/home/manifesto/ManifestoPortalVideo";
import "@/components/home/manifesto/manifesto-energy-cone.css";

export type { NebulaPortalPhase };

interface AstrotagNebulaPortalProps {
  phase: NebulaPortalPhase;
  onRitualPlaybackComplete?: () => void;
  onDissolveComplete?: () => void;
}

export default function AstrotagNebulaPortal({
  phase,
  onRitualPlaybackComplete,
  onDissolveComplete,
}: AstrotagNebulaPortalProps) {
  const phaseRef = useRef(phase);
  const playbackCompleteRef = useRef(onRitualPlaybackComplete);
  const dissolveCompleteRef = useRef(onDissolveComplete);
  const playbackSessionRef = useRef(0);
  const endedHandledRef = useRef(false);
  const [dissolveParticles, setDissolveParticles] = useState<StardustParticle[]>([]);

  const fullDustMatrix = useMemo(() => createPortalDustMatrix(), []);
  const idleDustMatrix = useMemo(
    () => fullDustMatrix.slice(0, MANIFESTO_IDLE_DUST_COUNT),
    [fullDustMatrix]
  );

  phaseRef.current = phase;
  playbackCompleteRef.current = onRitualPlaybackComplete;
  dissolveCompleteRef.current = onDissolveComplete;

  const portalHidden = phase === "gone";
  const isIdle = phase === "idle";
  const isPlaying = phase === "playing";
  const isDissolving = phase === "dissolving";
  const showDust = isIdle || isPlaying || isDissolving;
  const activeDust = isPlaying || isDissolving ? fullDustMatrix : idleDustMatrix;
  const dustFieldMode = isPlaying || isDissolving ? "playing" : isIdle ? "idle" : "";

  const handleRitualEnded = useCallback(() => {
    if (phaseRef.current !== "playing" || endedHandledRef.current) {
      return;
    }
    endedHandledRef.current = true;
    playbackCompleteRef.current?.();
  }, []);

  useEffect(() => {
    if (phase !== "playing") {
      return;
    }

    endedHandledRef.current = false;
    playbackSessionRef.current += 1;
    const session = playbackSessionRef.current;

    const timer = window.setTimeout(() => {
      if (
        playbackSessionRef.current !== session ||
        phaseRef.current !== "playing" ||
        endedHandledRef.current
      ) {
        return;
      }
      handleRitualEnded();
    }, MANIFESTO_RITUAL_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [handleRitualEnded, phase]);

  useEffect(() => {
    if (phase !== "dissolving") {
      return;
    }
    setDissolveParticles(createStardustParticles(40));
  }, [phase]);

  useEffect(() => {
    if (phase !== "idle") {
      return;
    }
    endedHandledRef.current = false;
    playbackSessionRef.current += 1;
  }, [phase]);

  return (
    <div
      className={`relative w-full ${portalHidden ? "pointer-events-none opacity-0" : "opacity-100"}`}
      aria-hidden={portalHidden}
    >
      <motion.div
        initial={false}
        animate={{
          opacity: portalHidden ? 0 : isDissolving ? 0.65 : 1,
          scale: portalHidden ? 0.9 : isPlaying ? 1.02 : isDissolving ? 0.97 : 1,
        }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative aspect-square w-full"
      >
        <div className="absolute inset-0 overflow-hidden rounded-full border border-zinc-700 bg-zinc-950">
          <div
            className={`manifesto-portal-dust-field ${
              dustFieldMode ? `manifesto-portal-dust-field--${dustFieldMode}` : ""
            } ${isDissolving ? "opacity-80" : ""}`}
          >
            {showDust
              ? activeDust.map((particle) => (
                  <span
                    key={particle.id}
                    className={`manifesto-portal-dust-star ${STREAM_STAR_CLASS[particle.tone]}`}
                    style={
                      {
                        width: particle.size,
                        height: particle.size,
                        animationDelay: `${particle.delay}s`,
                        animationDuration: `${particle.duration}s`,
                        "--dust-duration": `${particle.duration}s`,
                        "--stream-rise-pct": `${particle.risePct}%`,
                        "--stream-fan-x-pct": `${particle.fanXPct}%`,
                        "--stream-peak": `${particle.peak}`,
                        "--stream-end-scale": `${particle.endScale}`,
                      } as CSSProperties
                    }
                    aria-hidden
                  />
                ))
              : null}

            {isDissolving
              ? dissolveParticles.map((particle) => (
                  <motion.span
                    key={particle.id}
                    className={`pointer-events-none absolute left-1/2 top-1/2 rounded-full ${getStardustParticleClass(particle.hue)}`}
                    style={{
                      width: particle.size,
                      height: particle.size,
                      marginLeft: particle.originX,
                      marginTop: particle.originY,
                    }}
                    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                    animate={{
                      opacity: [0, 1, 0.85, 0],
                      scale: [0, 1.2, 0.5, 0],
                      x: particle.driftX,
                      y: particle.driftY,
                    }}
                    transition={{
                      duration: particle.duration,
                      delay: particle.delay,
                      ease: [0.22, 0.8, 0.24, 1],
                    }}
                  />
                ))
              : null}
          </div>

          <ManifestoPortalVideo phase={phase} />

          <div
            className="pointer-events-none absolute inset-0 rounded-full border border-white/[0.06]"
            aria-hidden
          />
        </div>

        {isDissolving ? (
          <motion.div
            key="dissolve-complete"
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: MANIFESTO_DISSOLVE_SECONDS, ease: "easeOut" }}
            onAnimationComplete={() => dissolveCompleteRef.current?.()}
            aria-hidden
          />
        ) : null}
      </motion.div>
    </div>
  );
}
