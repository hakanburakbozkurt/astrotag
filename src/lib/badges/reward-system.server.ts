import "server-only";

import {
  getMilestoneBadgeForCount,
  toGrantedBadgePayload,
  type GrantedBadgePayload,
} from "@/lib/badges/badge-definitions";
import { grantMilestoneBadge } from "@/lib/badges/badge-engine.server";
import { MIN_MILESTONE_RATING } from "@/lib/constants/cosmic";

/**
 * Tam milestone eşiğinde (5 / 10 / 20) ve yeterli rating ile rozet + yıldız ödülü.
 * Her feedback'e ödül yok — yalnızca bu eşiklerde.
 */
export async function processFeedbackMilestones(input: {
  profileId: string;
  feedbackCount: number;
  rating: number;
}): Promise<GrantedBadgePayload[]> {
  if (input.rating < MIN_MILESTONE_RATING) {
    return [];
  }

  const definition = getMilestoneBadgeForCount(input.feedbackCount);
  if (!definition) {
    return [];
  }

  const result = await grantMilestoneBadge(input.profileId, definition.id);
  if (!result.granted) {
    return [];
  }

  return [result.badge];
}

export { toGrantedBadgePayload };
