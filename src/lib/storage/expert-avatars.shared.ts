/** Supabase Storage — uzman avatar bucket sabitleri (client + server) */

export const EXPERT_AVATARS_BUCKET = "expert-avatars" as const;

export const EXPERT_AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export const EXPERT_AVATAR_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ExpertAvatarMimeType = (typeof EXPERT_AVATAR_ALLOWED_MIME_TYPES)[number];

export function isExpertAvatarMimeType(value: string): value is ExpertAvatarMimeType {
  return (EXPERT_AVATAR_ALLOWED_MIME_TYPES as readonly string[]).includes(value);
}
