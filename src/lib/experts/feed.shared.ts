export const EXPERT_FEED_CONTENT_TYPES = [
  "expert_announcement",
  "shared_session",
] as const;

export type ExpertFeedContentType = (typeof EXPERT_FEED_CONTENT_TYPES)[number];

export type ExpertFeedSessionOutput = {
  sessionType?: "tarot" | "astrology" | "synastry" | "horary" | "qa" | "reading";
  serviceName?: string;
  summary?: string;
  expertResponse?: string;
  subjectName?: string;
  score?: number;
  scoreLabel?: string;
  cards?: Array<{ name: string; position?: string | null }>;
};

export type ExpertFeedPost = {
  id: string;
  expertId: string;
  userId: string | null;
  contentType: ExpertFeedContentType;
  caption: string;
  mediaUrl: string | null;
  sessionOutputData: ExpertFeedSessionOutput | null;
  serviceRequestId: string | null;
  shareConsent: boolean;
  createdAt: string;
  expert: {
    displayName: string;
    title: string;
    avatarUrl: string | null;
  };
  userDisplayName: string | null;
};

export function parseExpertFeedSessionOutput(
  value: unknown
): ExpertFeedSessionOutput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const cards = Array.isArray(row.cards)
    ? row.cards
        .map((card) => {
          if (!card || typeof card !== "object" || Array.isArray(card)) {
            return null;
          }
          const item = card as Record<string, unknown>;
          const name = typeof item.name === "string" ? item.name.trim() : "";
          if (!name) {
            return null;
          }
          return {
            name,
            position:
              typeof item.position === "string" ? item.position : null,
          };
        })
        .filter((card): card is { name: string; position: string | null } =>
          Boolean(card)
        )
    : undefined;

  return {
    sessionType:
      typeof row.sessionType === "string"
        ? (row.sessionType as ExpertFeedSessionOutput["sessionType"])
        : undefined,
    serviceName:
      typeof row.serviceName === "string" ? row.serviceName.trim() : undefined,
    summary: typeof row.summary === "string" ? row.summary.trim() : undefined,
    expertResponse:
      typeof row.expertResponse === "string"
        ? row.expertResponse.trim()
        : undefined,
    subjectName:
      typeof row.subjectName === "string" ? row.subjectName.trim() : undefined,
    score: typeof row.score === "number" ? row.score : undefined,
    scoreLabel:
      typeof row.scoreLabel === "string" ? row.scoreLabel.trim() : undefined,
    cards,
  };
}

export function sessionTypeLabel(
  sessionType: ExpertFeedSessionOutput["sessionType"]
): string {
  switch (sessionType) {
    case "tarot":
      return "Tarot Seansı";
    case "synastry":
      return "Synastry Seansı";
    case "horary":
      return "Horary Seansı";
    case "astrology":
      return "Astroloji Seansı";
    case "qa":
      return "Soru & Cevap";
    case "reading":
    default:
      return "Seans Çıktısı";
  }
}
