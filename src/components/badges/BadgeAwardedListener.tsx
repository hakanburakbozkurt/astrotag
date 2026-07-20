"use client";

import { useEffect, useState } from "react";
import BadgeEarnedModal from "@/components/badges/BadgeEarnedModal";
import type { GrantedBadgePayload } from "@/lib/badges/badge-definitions";
import {
  BADGE_AWARDED_EVENT,
  type BadgeAwardedEventDetail,
} from "@/lib/energy-events";

/** Global milestone rozet modal — BADGE_AWARDED_EVENT dinler */
export default function BadgeAwardedListener() {
  const [badges, setBadges] = useState<GrantedBadgePayload[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<BadgeAwardedEventDetail>).detail;
      if (!detail?.badges?.length) return;
      setBadges(detail.badges as GrantedBadgePayload[]);
    };

    window.addEventListener(BADGE_AWARDED_EVENT, handler);
    return () => window.removeEventListener(BADGE_AWARDED_EVENT, handler);
  }, []);

  if (!badges.length) {
    return null;
  }

  return (
    <BadgeEarnedModal
      badges={badges}
      variant="milestone"
      onClose={() => setBadges([])}
    />
  );
}
