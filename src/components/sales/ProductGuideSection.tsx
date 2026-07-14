"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useMotionReady } from "@/hooks/useMotionReady";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { guideSections } from "@/lib/sales/guide-content";
import {
  SALES_MOTION_EASE,
  SALES_SECTION_CLASS,
} from "@/lib/sales/sales-motion";

function GuideAccordionItem({
  id,
  title,
  content,
  isOpen,
  onToggle,
}: {
  id: string;
  title: string;
  content: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const motionReady = useMotionReady();
  const reducedMotion = usePrefersReducedMotion();
  const canAnimate = motionReady && !reducedMotion;

  return (
    <div className="border-b border-white/[0.08] last:border-b-0">
      <button
        type="button"
        id={`guide-trigger-${id}`}
        aria-expanded={isOpen}
        aria-controls={`guide-panel-${id}`}
        onClick={onToggle}
        className="flex min-h-14 w-full items-start justify-between gap-4 py-6 text-left transition-colors duration-200 hover:text-amber-50 sm:min-h-16 sm:py-8"
      >
        <span className="pr-2 text-lg font-semibold leading-snug tracking-tight text-white sm:text-xl md:text-2xl">
          {title}
        </span>
        <span
          className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-[border-color,background-color,transform] duration-300 ${
            isOpen
              ? "border-amber-400/35 bg-amber-400/10 text-amber-200"
              : "border-white/10 bg-white/[0.03] text-white/45"
          }`}
          aria-hidden
        >
          <ChevronDown
            className={`h-5 w-5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            id={`guide-panel-${id}`}
            role="region"
            aria-labelledby={`guide-trigger-${id}`}
            initial={canAnimate ? { height: 0, opacity: 0 } : false}
            animate={canAnimate ? { height: "auto", opacity: 1 } : undefined}
            exit={canAnimate ? { height: 0, opacity: 0 } : undefined}
            transition={{ duration: 0.45, ease: SALES_MOTION_EASE }}
            className="overflow-hidden"
          >
            <p className="pb-8 text-[17px] leading-[1.9] text-white/62 sm:pb-10 sm:text-lg sm:leading-[1.95]">
              {content}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function ProductGuideSection() {
  const [openId, setOpenId] = useState<string | null>(guideSections[0]?.id ?? null);

  const handleToggle = useCallback((id: string) => {
    setOpenId((current) => (current === id ? null : id));
  }, []);

  return (
    <section
      id="urun-rehberi"
      className={`${SALES_SECTION_CLASS} border-b border-white/[0.06]`}
    >
      <div className="mx-auto max-w-3xl">
        <p className="sales-kicker font-mono text-[10px] uppercase tracking-[0.34em] text-amber-400/70">
          Ürün Rehberi ve Güven Merkezi
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl md:leading-tight">
          AstroTag ile Tanış, Güvenle Kullan
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-[1.85] text-white/50 sm:text-lg sm:leading-[1.9]">
          Aşağıdaki başlıklarda AstroTag&apos;in ne olduğunu, günlük ritüelini, yıldız
          ekonomisini ve verilerinin nasıl korunduğunu sakin ve net bir dille
          okuyabilirsin.
        </p>

        <div className="mt-10 rounded-[28px] border border-white/10 bg-[#0f172a]/35 px-5 backdrop-blur-xl sm:mt-12 sm:px-8 md:px-10">
          {guideSections.map((section) => (
            <GuideAccordionItem
              key={section.id}
              id={section.id}
              title={section.title}
              content={section.content}
              isOpen={openId === section.id}
              onToggle={() => handleToggle(section.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
