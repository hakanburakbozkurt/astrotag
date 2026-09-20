/** Supabase Storage — kullanıcı profil fotoğrafı bucket sabitleri */

export const USER_AVATARS_BUCKET = "user-avatars" as const;

export const USER_AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export const USER_AVATAR_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type UserAvatarMimeType = (typeof USER_AVATAR_ALLOWED_MIME_TYPES)[number];

export function isUserAvatarMimeType(value: string): value is UserAvatarMimeType {
  return (USER_AVATAR_ALLOWED_MIME_TYPES as readonly string[]).includes(value);
}
