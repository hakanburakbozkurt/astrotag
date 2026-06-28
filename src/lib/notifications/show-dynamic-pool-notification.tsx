"use client";

import hotToast from "react-hot-toast";
import CosmicToastCard from "@/components/ui/CosmicToastCard";
import type { CosmicToastNames } from "@/lib/cosmic-toast/types";
import {
  DYNAMIC_NOTIFICATION_POOL,
  resolveNotificationMessage,
  type DynamicNotification,
} from "@/lib/notifications/dynamic-notification-pool";
import {
  markNotificationSeen,
  pickRandomUnseen,
} from "@/lib/notifications/seen-notifications";
import type { NexusTransitStress } from "@/lib/nexus/nexus-transit-stress.types";

export function pickDynamicNotification(
  stressLevel: NexusTransitStress["stressLevel"],
  names: CosmicToastNames = {}
): (DynamicNotification & { resolvedMessage: string }) | null {
  const candidates = DYNAMIC_NOTIFICATION_POOL.filter(
    (item) => item.stressLevel === stressLevel
  );
  const picked = pickRandomUnseen(candidates);

  if (!picked) {
    return null;
  }

  return {
    ...picked,
    resolvedMessage: resolveNotificationMessage(picked, names),
  };
}

export function showDynamicPoolNotification(
  notification: DynamicNotification & { resolvedMessage: string }
) {
  markNotificationSeen(notification.id);

  return hotToast.custom(
    (toastState) => (
      <CosmicToastCard
        toastState={toastState}
        title={notification.title}
        message={notification.resolvedMessage}
        icon={notification.icon}
        route={notification.route}
      />
    ),
    { duration: 5500 }
  );
}

export function showDynamicNotificationForStressLevel(
  stressLevel: NexusTransitStress["stressLevel"],
  names: CosmicToastNames = {}
) {
  const notification = pickDynamicNotification(stressLevel, names);

  if (!notification) {
    return null;
  }

  return showDynamicPoolNotification(notification);
}
