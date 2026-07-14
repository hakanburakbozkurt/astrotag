"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useMotionReady } from "@/hooks/useMotionReady";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { PRODUCT_GUIDE_SECTIONS } from "@/lib/sales/guide-content";
import {
  SALES_MOTION_EASE,
  SALES_SECTION_CLASS,
} from "@/lib/sales/sales-motion";

function GuideAccordionItem({
  id,
  kicker,
  title,
  paragraphs,
  highlights,
  isOpen,
  onToggle,
}: {
  id: string;
  kicker?: string;
  title: string;
  paragraphs: string[];
  highlights?: string[];
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
        <span className="flex flex-col gap-2 pr-2">
          {kicker ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/65">
              {kicker}
            </span>
          ) : null}
          <span className="text-lg font-semibold leading-snug tracking-tight text-white sm:text-xl md:text-2xl">
            {title}
          </span>
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
            <div className="pb-8 sm:pb-10">
              <div className="space-y-5 text-[17px] leading-[1.9] text-white/62 sm:text-lg sm:leading-[1.95]">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>

              {highlights?.length ? (
                <ul className="mt-8 space-y-4 border-t border-white/[0.06] pt-8">
                  {highlights.map((line) => (
                    <li
                      key={line}
                      className="border-l-2 border-amber-400/45 pl-5 text-base italic leading-[1.85] text-amber-100/75 sm:text-[17px]"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function ProductGuideSection() {
  const [openId, setOpenId] = useState<string | null>(PRODUCT_GUIDE_SECTIONS[0]?.id ?? null);

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
          AstroTag ile Tanışın, Güvenle Kullanın
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-[1.85] text-white/50 sm:text-lg sm:leading-[1.9]">
          Teknik detaylarla değil; anlaşılır rehberlikle. Aşağıdaki başlıklarda sistemin
          nasıl çalıştığını, yıldız ekonomisini ve gizliliğinizi nasıl koruduğumuzu
          adım adım bulabilirsiniz.
        </p>

        <div className="mt-10 rounded-[28px] border border-white/10 bg-[#0f172a]/35 px-5 backdrop-blur-xl sm:mt-12 sm:px-8 md:px-10">
          {PRODUCT_GUIDE_SECTIONS.map((section) => (
            <GuideAccordionItem
              key={section.id}
              id={section.id}
              kicker={section.kicker}
              title={section.title}
              paragraphs={section.paragraphs}
              highlights={section.highlights}
              isOpen={openId === section.id}
              onToggle={() => handleToggle(section.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
