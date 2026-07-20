"use client";

import type { SubmitFeedbackResult } from "@/lib/actions/feedback";
import type { GrantedBadgePayload } from "@/lib/badges/badge-definitions";
import {
  BADGE_AWARDED_EVENT,
  type BadgeAwardedEventDetail,
  FEEDBACK_UPDATED_EVENT,
  STAR_POINTS_UPDATED_EVENT,
} from "@/lib/energy-events";

export function dispatchFeedbackGamificationEvents(result: SubmitFeedbackResult): void {
  if (result.feedbackCount !== undefined) {
    window.dispatchEvent(
      new CustomEvent(FEEDBACK_UPDATED_EVENT, {
        detail: { feedbackCount: result.feedbackCount },
      })
    );
  }

  if (result.totalStarPoints !== undefined) {
    window.dispatchEvent(
      new CustomEvent(STAR_POINTS_UPDATED_EVENT, {
        detail: { starPoints: result.totalStarPoints },
      })
    );
  }

  if (result.earnedBadges?.length) {
    const detail: BadgeAwardedEventDetail = {
      badges: result.earnedBadges as BadgeAwardedEventDetail["badges"],
      feedbackCount: result.feedbackCount,
      totalStarPoints: result.totalStarPoints,
    };
    window.dispatchEvent(new CustomEvent(BADGE_AWARDED_EVENT, { detail }));
  }
}

export type { GrantedBadgePayload };
