"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { generateDailyManifestoAction, loadManifestoStateAction } from "@/lib/actions/manifesto";
import type { NebulaPortalPhase } from "@/components/home/manifesto/AstrotagNebulaPortal";
import type { OrbitStep } from "@/components/home/manifesto/manifesto-portal-orbit";
import ManifestoArchivePanel from "@/components/home/manifesto/ManifestoArchivePanel";
import ManifestoIntentForm from "@/components/home/manifesto/ManifestoIntentForm";
import ManifestoRitualModule from "@/components/home/manifesto/ManifestoRitualModule";
import UniverseMessageReveal from "@/components/home/manifesto/UniverseMessageReveal";
import {
  type ManifestoCategoryId,
  type ManifestoTechniqueId,
  type UserManifestoRecord,
} from "@/lib/manifesto/types";
import type { UserData } from "@/types/user";

interface ManifestoWidgetProps {
  user: UserData;
}

export default function ManifestoWidget({ user }: ManifestoWidgetProps) {
  const [category, setCategory] = useState<ManifestoCategoryId>("para");
  const [techniqueType, setTechniqueType] =
    useState<ManifestoTechniqueId>("21_days");
  const [previewTechniqueId, setPreviewTechniqueId] =
    useState<ManifestoTechniqueId | null>(null);
  const [intention, setIntention] = useState("");
  const [manifesto, setManifesto] = useState<UserManifestoRecord | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portalPhase, setPortalPhase] = useState<NebulaPortalPhase>("idle");
  const [showUniverseMessage, setShowUniverseMessage] = useState(false);
  const [revealDismissed, setRevealDismissed] = useState(true);
  const [orbitStep, setOrbitStep] = useState<OrbitStep>("category");

  const ritualActive =
    apiLoading || portalPhase === "playing" || portalPhase === "dissolving";

  const runManifestoRitual = useCallback(
    async (overrides?: {
      category?: ManifestoCategoryId;
      techniqueType?: ManifestoTechniqueId;
    }) => {
      if (ritualActive) {
        return;
      }

      const nextCategory = overrides?.category ?? category;
      const nextTechnique = overrides?.techniqueType ?? techniqueType;

      if (overrides?.category) {
        setCategory(nextCategory);
      }
      if (overrides?.techniqueType) {
        setTechniqueType(nextTechnique);
      }

      if (!intention.trim()) {
        setError("Niyetini birkaç kelimeyle yaz — portal seni duysun.");
        return;
      }

      setError(null);
      setApiLoading(true);
      setRevealDismissed(false);
      setShowUniverseMessage(false);
      setPortalPhase("playing");

      const result = await generateDailyManifestoAction({
        category: nextCategory,
        techniqueType: nextTechnique,
        intention,
      });

      if (!result.ok) {
        setError(result.error);
        setApiLoading(false);
        return;
      }

      setManifesto(result.manifesto);
      setApiLoading(false);
    },
    [category, intention, ritualActive, techniqueType]
  );

  const handleCategorySatellite = useCallback(
    (nextCategory: ManifestoCategoryId) => {
      if (ritualActive) {
        return;
      }
      setCategory(nextCategory);
      setError(null);
      setPreviewTechniqueId(null);
      setOrbitStep("technique");
    },
    [ritualActive]
  );

  const handleTechniqueSatellite = useCallback(
    (nextTechnique: ManifestoTechniqueId) => {
      setTechniqueType(nextTechnique);
      setPreviewTechniqueId(null);
      void runManifestoRitual({ techniqueType: nextTechnique });
    },
    [runManifestoRitual]
  );

  const handleBackToCategories = useCallback(() => {
    if (ritualActive) {
      return;
    }
    setPreviewTechniqueId(null);
    setOrbitStep("category");
  }, [ritualActive]);

  const handleRitualPlaybackComplete = useCallback(() => {
    setPortalPhase("dissolving");
    setShowUniverseMessage(true);
    setRevealDismissed(false);
  }, []);

  const handleDissolveComplete = useCallback(() => {
    setPortalPhase("gone");
  }, []);

  const handleSubmit = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault();
      if (orbitStep === "category") {
        setOrbitStep("technique");
      }
      await runManifestoRitual();
    },
    [orbitStep, runManifestoRitual]
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const state = await loadManifestoStateAction({ category, techniqueType });
      if (!cancelled && state) {
        setManifesto(state);
        if (state.intention) {
          setIntention(state.intention);
        }
      } else if (!cancelled) {
        setManifesto(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [category, techniqueType]);

  const progress =
    manifesto && manifesto.maxDays > 0
      ? Math.min(100, (manifesto.currentDay / manifesto.maxDays) * 100)
      : 0;

  const showDetailedManifesto =
    Boolean(manifesto) &&
    revealDismissed &&
    !showUniverseMessage &&
    portalPhase !== "playing" &&
    portalPhase !== "dissolving";

  const uiHidden = showUniverseMessage;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
      className={`relative mb-8 space-y-6 ${showUniverseMessage ? "overflow-hidden" : ""}`}
      id="manifesto-panel"
    >
      <UniverseMessageReveal
        open={showUniverseMessage}
        loading={apiLoading}
        error={error}
        manifesto={manifesto}
        onClose={() => {
          setShowUniverseMessage(false);
          setRevealDismissed(true);
          if (portalPhase === "gone") {
            setPortalPhase("idle");
          }
          setOrbitStep("category");
          setPreviewTechniqueId(null);
        }}
      />

      <header
        className={`transition-opacity duration-300 ${
          uiHidden ? "pointer-events-none invisible opacity-0" : ""
        }`}
        aria-hidden={uiHidden}
      >
        <p className="text-xs tracking-wide text-stone-500">Manifesto Motoru</p>
        <h2 className="mt-1 font-[family-name:var(--font-serif-display)] text-xl font-normal text-white sm:text-2xl">
          Günlük Kozmik Niyetin
        </h2>
        <p className="mt-2 text-sm text-stone-400">
          Çarktan kategori ve tekniğini seç, niyetini yaz.
        </p>
      </header>

      <ManifestoRitualModule
        step={orbitStep}
        category={category}
        techniqueType={techniqueType}
        portalPhase={portalPhase}
        ritualActive={ritualActive}
        hidden={uiHidden}
        onCategorySelect={handleCategorySatellite}
        onTechniqueSelect={handleTechniqueSatellite}
        onTechniqueHover={setPreviewTechniqueId}
        onBackToCategories={handleBackToCategories}
        onRitualPlaybackComplete={handleRitualPlaybackComplete}
        onDissolveComplete={handleDissolveComplete}
      />

      <ManifestoIntentForm
        intention={intention}
        techniqueType={techniqueType}
        previewTechniqueId={previewTechniqueId}
        orbitStep={orbitStep}
        ritualActive={ritualActive}
        hidden={uiHidden}
        onIntentionChange={setIntention}
        onSubmit={handleSubmit}
      />

      {showDetailedManifesto && manifesto ? (
        <ManifestoArchivePanel
          manifesto={manifesto}
          progress={progress}
          userName={user.name ?? undefined}
        />
      ) : null}

      {error && !showUniverseMessage ? (
        <p className="text-sm text-stone-400" role="alert">
          {error}
        </p>
      ) : null}
    </motion.section>
  );
}
