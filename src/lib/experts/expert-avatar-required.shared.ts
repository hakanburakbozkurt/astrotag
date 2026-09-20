export const EXPERT_AVATAR_REQUIRED_MESSAGE =
  "Hizmet kartı veya gönderi oluşturabilmek için önce profil fotoğrafı yüklemelisiniz.";

export const EXPERT_AVATAR_REQUIRED_CODE = "EXPERT_AVATAR_REQUIRED" as const;

export type ExpertAvatarRequiredCode = typeof EXPERT_AVATAR_REQUIRED_CODE;

export const EXPERT_AVATAR_SETTINGS_PATH = "/profil/bilgiler" as const;

export function hasExpertAvatar(avatarUrl: string | null | undefined): boolean {
  return Boolean(avatarUrl?.trim());
}

export function isExpertAvatarRequiredError(
  error: string | undefined,
  code?: string
): boolean {
  return (
    code === EXPERT_AVATAR_REQUIRED_CODE ||
    error === EXPERT_AVATAR_REQUIRED_MESSAGE
  );
}
