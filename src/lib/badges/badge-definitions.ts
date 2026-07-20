export type BadgeIconId = "eye" | "compass" | "sparkles";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  threshold: number;
  starReward: number;
  icon: BadgeIconId;
}

/** Milestone rozetleri — yalnızca tam eşikte (5, 10, 20) ve rating >= MIN_MILESTONE_RATING */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "observer_apprentice",
    name: "Gözlemci Çırak",
    description: "5 kaliteli geri bildirim — gökyüzünü dinlemeye başladın.",
    threshold: 5,
    starReward: 2,
    icon: "eye",
  },
  {
    id: "cosmic_oracle",
    name: "Kozmik Kahin",
    description: "10 geri bildirim — kozmik desenleri okumaya başladın.",
    threshold: 10,
    starReward: 5,
    icon: "sparkles",
  },
  {
    id: "star_architect",
    name: "Yıldız Mimarı",
    description: "20 geri bildirim — yıldızların dilini şekillendiriyorsun.",
    threshold: 20,
    starReward: 8,
    icon: "compass",
  },
];

export const MILESTONE_THRESHOLDS = [5, 10, 20] as const;

export function getBadgeDefinition(badgeId: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((badge) => badge.id === badgeId);
}

export function getMilestoneBadgeForCount(
  feedbackCount: number
): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((badge) => badge.threshold === feedbackCount);
}

export function getNextBadgeDefinition(
  feedbackCount: number,
  earnedBadgeIds: Set<string>
): { badge: BadgeDefinition; remaining: number } | null {
  const next = BADGE_DEFINITIONS.find((badge) => !earnedBadgeIds.has(badge.id));
  if (!next) {
    return null;
  }

  const remaining = Math.max(0, next.threshold - feedbackCount);
  return { badge: next, remaining };
}

export function toGrantedBadgePayload(definition: BadgeDefinition) {
  return {
    id: definition.id,
    name: definition.name,
    description: definition.description,
    starReward: definition.starReward,
    icon: definition.icon,
    threshold: definition.threshold,
  };
}

export type GrantedBadgePayload = ReturnType<typeof toGrantedBadgePayload>;
