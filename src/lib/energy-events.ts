export const STAR_POINTS_UPDATED_EVENT = "star-points-updated";

/** Rozet / feedback_count güncellendiğinde AchievementsSection yeniler */
export const FEEDBACK_UPDATED_EVENT = "feedback-updated";

/** Milestone rozet kazanıldığında global modal tetikler */
export const BADGE_AWARDED_EVENT = "badge-awarded";

export type BadgeAwardedEventDetail = {
  badges: Array<{
    id: string;
    name: string;
    description: string;
    starReward: number;
    icon: string;
    threshold: number;
  }>;
  feedbackCount?: number;
  totalStarPoints?: number;
};

/** @deprecated Use STAR_POINTS_UPDATED_EVENT */
export const COSMIC_ENERGY_UPDATED_EVENT = STAR_POINTS_UPDATED_EVENT;
