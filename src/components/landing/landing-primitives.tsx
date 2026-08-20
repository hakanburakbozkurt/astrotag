"use client";

import SalesMotion from "@/components/sales/SalesMotion";
import { LANDING_CONTAINER_CLASS, LANDING_SECTION_CLASS } from "@/components/landing/landing-motion";

interface LandingSectionProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
  bordered?: boolean;
}

export function LandingSection({
  id,
  className = "",
  children,
  bordered = false,
}: LandingSectionProps) {
  return (
    <section
      id={id}
      className={`${LANDING_SECTION_CLASS} ${bordered ? "border-b border-white/[0.06]" : ""} ${className}`.trim()}
    >
      <div className={LANDING_CONTAINER_CLASS}>{children}</div>
    </section>
  );
}

interface SectionHeaderProps {
  kicker: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}

export function SectionHeader({
  kicker,
  title,
  subtitle,
  align = "left",
}: SectionHeaderProps) {
  const alignClass = align === "center" ? "text-center" : "text-left";

  return (
    <SalesMotion className={alignClass}>
      <p className="landing-kicker">{kicker}</p>
      <h2 className="landing-serif mt-2 text-3xl leading-tight text-white sm:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className={`mt-3 text-sm leading-relaxed text-white/55 ${align === "center" ? "mx-auto max-w-sm" : "max-w-md"}`}>
          {subtitle}
        </p>
      ) : null}
    </SalesMotion>
  );
}

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  spotlight?: boolean;
}

export function GlassCard({ children, className = "", spotlight = false }: GlassCardProps) {
  return (
    <div
      className={`landing-glass rounded-[28px] p-5 backdrop-blur-xl sm:p-6 ${
        spotlight ? "landing-spotlight-card border-amber-300/40 bg-gradient-to-br from-amber-400/[0.12] via-white/[0.03] to-violet-950/20" : ""
      } ${className}`.trim()}
    >
      {children}
    </div>
  );
}
