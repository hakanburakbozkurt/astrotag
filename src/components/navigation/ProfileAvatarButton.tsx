"use client";

import { memo, useCallback } from "react";
import { Colors } from "@/lib/navigation/dashboard-colors";

interface ProfileAvatarButtonProps {
  displayName: string;
  avatarUrl?: string | null;
  onClick: () => void;
  isOpen: boolean;
}

function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function ProfileAvatarButtonInner({
  displayName,
  avatarUrl,
  onClick,
  isOpen,
}: ProfileAvatarButtonProps) {
  const handleClick = useCallback(() => onClick(), [onClick]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Profil menüsü"
      aria-expanded={isOpen}
      className={`relative z-[100] flex h-9 w-9 items-center justify-center overflow-hidden ${Colors.avatar} transition hover:border-zinc-500`}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-xs font-medium">{initialsFromName(displayName) || "AT"}</span>
      )}
    </button>
  );
}

export default memo(ProfileAvatarButtonInner);
