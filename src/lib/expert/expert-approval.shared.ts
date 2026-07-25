export const EXPERT_APPROVAL_PENDING = "pending" as const;
export const EXPERT_APPROVAL_APPROVED = "approved" as const;
export const EXPERT_APPROVAL_REJECTED = "rejected" as const;

export type ExpertApprovalStatus =
  | typeof EXPERT_APPROVAL_PENDING
  | typeof EXPERT_APPROVAL_APPROVED
  | typeof EXPERT_APPROVAL_REJECTED;

export const EXPERT_TRADITION_OPTIONS = [
  "Tarot",
  "Astroloji",
  "Vedic Astroloji",
  "Numeroloji",
  "Horary",
  "Kombine",
  "Diğer",
] as const;
