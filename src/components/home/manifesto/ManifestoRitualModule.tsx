"use client";

import AstrotagNebulaPortal, {
  type NebulaPortalPhase,
} from "@/components/home/manifesto/AstrotagNebulaPortal";
import ManifestoPortalOrbit from "@/components/home/manifesto/ManifestoPortalOrbit";
import type { OrbitStep } from "@/components/home/manifesto/manifesto-portal-orbit";
import type {
  ManifestoCategoryId,
  ManifestoTechniqueId,
} from "@/lib/manifesto/types";

interface ManifestoRitualModuleProps {
  step: OrbitStep;
  category: ManifestoCategoryId;
  techniqueType: ManifestoTechniqueId;
  portalPhase: NebulaPortalPhase;
  ritualActive: boolean;
  hidden: boolean;
  onCategorySelect: (category: ManifestoCategoryId) => void;
  onTechniqueSelect: (technique: ManifestoTechniqueId) => void;
  onTechniqueHover?: (technique: ManifestoTechniqueId | null) => void;
  onBackToCategories: () => void;
  onRitualPlaybackComplete: () => void;
  onDissolveComplete: () => void;
}

export default function ManifestoRitualModule({
  step,
  category,
  techniqueType,
  portalPhase,
  ritualActive,
  hidden,
  onCategorySelect,
  onTechniqueSelect,
  onTechniqueHover,
  onBackToCategories,
  onRitualPlaybackComplete,
  onDissolveComplete,
}: ManifestoRitualModuleProps) {
  return (
    <section
      className={`px-1 py-4 transition-opacity duration-300 sm:px-2 sm:py-6 ${
        hidden ? "pointer-events-none invisible opacity-0" : ""
      }`}
      aria-hidden={hidden}
      aria-label="Manifesto ritüeli"
    >
      <ManifestoPortalOrbit
        step={step}
        category={category}
        techniqueType={techniqueType}
        disabled={ritualActive}
        hideSatellites={ritualActive || hidden}
        onCategorySelect={onCategorySelect}
        onTechniqueSelect={onTechniqueSelect}
        onTechniqueHover={onTechniqueHover}
        onBackToCategories={onBackToCategories}
      >
        <AstrotagNebulaPortal
          phase={portalPhase}
          onRitualPlaybackComplete={onRitualPlaybackComplete}
          onDissolveComplete={onDissolveComplete}
        />
      </ManifestoPortalOrbit>

      <p className="mt-6 text-center text-xs text-stone-500">
        {step === "category"
          ? "Bir kategori seçerek başla"
          : "Tekniğini seç — ritüel başlar"}
      </p>
    </section>
  );
}
