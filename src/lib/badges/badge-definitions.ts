export type BadgeIconId = "eye" | "compass" | "sparkles";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  threshold: number;
  starReward: number;
  icon: BadgeIconId;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "observer",
    name: "Gözlemci",
    description: "5 analiz geri bildirimi — gökyüzünü dinlemeye başladın.",
    threshold: 5,
    starReward: 3,
    icon: "eye",
  },
  {
    id: "guide",
    name: "Rehber",
    description: "20 geri bildirim — kozmik yolculuğunda rehber oldun.",
    threshold: 20,
    starReward: 8,
    icon: "compass",
  },
  {
    id: "sage",
    name: "Bilge",
    description: "50 geri bildirim — yıldızların dilini bilen Bilge.",
    threshold: 50,
    starReward: 15,
    icon: "sparkles",
  },
];

export function getBadgeDefinition(badgeId: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((badge) => badge.id === badgeId);
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
