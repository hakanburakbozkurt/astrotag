"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  dismissDailyCosmicModalAction,
  prepareDailyCosmicModalAction,
} from "@/lib/actions/manifesto";
import { fetchNexusTransitStressAction } from "@/lib/actions/nexus-transit-stress";
import DailyCosmicWidget from "@/components/home/daily-cosmic/DailyCosmicWidget";
import {
  pickCosmicAssistantNudge,
  type CosmicAssistantNudge,
} from "@/lib/dashboard/cosmic-assistant";
import {
  hasSeenManifestoToday,
  markManifestoSeenToday,
  todayDateKeyLocal,
} from "@/lib/manifesto/daily-cosmic-seen.client";
import {
  hideCosmicAssistantForToday,
  isCosmicAssistantHiddenToday,
} from "@/lib/manifesto/cosmic-assistant-dismiss.client";
import type { NexusTransitStress } from "@/lib/nexus/nexus-transit-stress.types";
import type { UserManifestoRecord } from "@/lib/manifesto/types";
import { useAuth } from "@/lib/auth";
import type { UserData } from "@/types/user";

interface DailyCosmicModalGateProps {
  user: UserData;
}

export default function DailyCosmicModalGate({ user }: DailyCosmicModalGateProps) {
  const router = useRouter();
  const { userId } = useAuth();
  const [manifesto, setManifesto] = useState<UserManifestoRecord | null>(null);
  const [transit, setTransit] = useState<NexusTransitStress | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(isCosmicAssistantHiddenToday());
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [payload, transitResult] = await Promise.all([
        prepareDailyCosmicModalAction(),
        fetchNexusTransitStressAction(user).catch(() => null),
      ]);

      if (cancelled) {
        return;
      }

      if (payload.manifesto) {
        setManifesto(payload.manifesto);
        const shouldAutoOpen = payload.showModal && !hasSeenManifestoToday();
        setExpanded(shouldAutoOpen);
      }

      setTransit(transitResult);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const nudge = useMemo<CosmicAssistantNudge>(
    () =>
      pickCosmicAssistantNudge({
        userName: user.name,
        userId: userId ?? undefined,
        todayKey: todayDateKeyLocal(),
        manifesto,
        transit,
      }),
    [manifesto, transit, user.name, userId]
  );

  const persistDismissal = useCallback(async () => {
    markManifestoSeenToday();
    if (manifesto) {
      await dismissDailyCosmicModalAction(manifesto.id);
    }
  }, [manifesto]);

  const handleDismiss = useCallback(() => {
    hideCosmicAssistantForToday();
    void persistDismissal();
    setHidden(true);
    setExpanded(false);
  }, [persistDismissal]);

  const handleAccept = useCallback(() => {
    void (async () => {
      await persistDismissal();
      setExpanded(false);
      router.push("/dashboard/manifest");
    })();
  }, [persistDismissal, router]);

  if (!ready || hidden) {
    return null;
  }

  return (
    <DailyCosmicWidget
      manifesto={manifesto}
      userName={user.name}
      nudge={nudge}
      expanded={expanded}
      onExpandedChange={setExpanded}
      onAccept={handleAccept}
      onDismiss={handleDismiss}
    />
  );
}
