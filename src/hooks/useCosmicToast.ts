"use client";

import { useCallback, useEffect, useState } from "react";
import type { CosmicToastApi } from "@/lib/cosmic-toast/api";
import { showCosmicToast } from "@/lib/cosmic-toast/show-cosmic-toast";
import type { CosmicToastNames, CosmicToastOptions, CosmicToastVariant } from "@/lib/cosmic-toast/types";
import { getUserProfile } from "@/lib/supabase-actions";

export interface UseCosmicToastResult extends CosmicToastApi {
  ready: boolean;
  profileNames: CosmicToastNames;
  show: (
    variant: CosmicToastVariant,
    userName?: string | null,
    partnerName?: string | null,
    options?: CosmicToastOptions
  ) => string;
}

export function useCosmicToast(): UseCosmicToastResult {
  const [ready, setReady] = useState(false);
  const [profileNames, setProfileNames] = useState<CosmicToastNames>({});

  useEffect(() => {
    let cancelled = false;

    void getUserProfile().then((profile) => {
      if (cancelled) {
        return;
      }

      if (profile) {
        setProfileNames({
          userName: profile.name?.trim() || undefined,
          partnerName: profile.partnerName?.trim() || undefined,
        });
      }

      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const resolveNames = useCallback(
    (userName?: string | null, partnerName?: string | null): CosmicToastNames => ({
      userName: userName?.trim() || profileNames.userName,
      partnerName: partnerName?.trim() || profileNames.partnerName || null,
    }),
    [profileNames]
  );

  const show = useCallback(
    (
      variant: CosmicToastVariant,
      userName?: string | null,
      partnerName?: string | null,
      options?: CosmicToastOptions
    ) => showCosmicToast(variant, resolveNames(userName, partnerName), options),
    [resolveNames]
  );

  const cosmic = useCallback(
    (
      userName?: string | null,
      partnerName?: string | null,
      variant: CosmicToastVariant = "cosmicSuccess",
      options?: CosmicToastOptions
    ) => show(variant, userName, partnerName, options),
    [show]
  );

  const cosmicSuccess = useCallback(
    (userName?: string | null, partnerName?: string | null, options?: CosmicToastOptions) =>
      show("cosmicSuccess", userName, partnerName, options),
    [show]
  );

  const tarotReady = useCallback(
    (userName?: string | null, partnerName?: string | null, options?: CosmicToastOptions) =>
      show("tarotReady", userName, partnerName, options),
    [show]
  );

  const compatibilityNudge = useCallback(
    (userName?: string | null, partnerName?: string | null, options?: CosmicToastOptions) =>
      show("compatibilityNudge", userName, partnerName, options),
    [show]
  );

  const energyPulse = useCallback(
    (userName?: string | null, partnerName?: string | null, options?: CosmicToastOptions) =>
      show("energyPulse", userName, partnerName, options),
    [show]
  );

  const welcome = useCallback(
    (userName?: string | null, partnerName?: string | null, options?: CosmicToastOptions) =>
      show("welcome", userName, partnerName, options),
    [show]
  );

  return {
    ready,
    profileNames,
    show,
    cosmic,
    cosmicSuccess,
    tarotReady,
    compatibilityNudge,
    energyPulse,
    welcome,
  };
}
