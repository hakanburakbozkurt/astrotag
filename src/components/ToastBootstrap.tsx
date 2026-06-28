"use client";

import { useEffect } from "react";
import { fetchNexusTransitStressAction } from "@/lib/actions/nexus-transit-stress";
import { getUserProfile } from "@/lib/supabase-actions";
import { showDynamicNotificationForStressLevel } from "@/lib/notifications/show-dynamic-pool-notification";

const POOL_TOAST_SESSION_KEY = "astrotag:dynamic-pool-toast-session";
const POOL_TOAST_DELAY_MS = 10_000;

export default function ToastBootstrap() {
  useEffect(() => {
    if (sessionStorage.getItem(POOL_TOAST_SESSION_KEY)) {
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const profile = await getUserProfile();

          if (cancelled || !profile) {
            return;
          }

          let stressLevel: "calm" | "moderate" | "high" = "calm";

          try {
            const stress = await fetchNexusTransitStressAction(profile);
            stressLevel = stress.stressLevel;
          } catch {
            stressLevel = "calm";
          }

          if (cancelled) {
            return;
          }

          showDynamicNotificationForStressLevel(stressLevel, {
            userName: profile.name,
            partnerName: profile.partnerName,
          });

          sessionStorage.setItem(POOL_TOAST_SESSION_KEY, "1");
        } catch {
          // Sessizce atla — bildirim opsiyonel
        }
      })();
    }, POOL_TOAST_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
