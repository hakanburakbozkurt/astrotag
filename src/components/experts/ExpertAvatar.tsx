"use client";

export type ExpertAvatarSize = "story" | "grid" | "profile";

const SIZE_CLASS: Record<ExpertAvatarSize, string> = {
  story: "h-[68px] w-[68px]",
  grid: "h-16 w-16",
  profile: "h-24 w-24 sm:h-28 sm:w-28",
};

interface ExpertAvatarProps {
  avatarUrl: string | null;
  displayName: string;
  size?: ExpertAvatarSize;
  ring?: boolean;
  selected?: boolean;
}

export default function ExpertAvatar({
  avatarUrl,
  displayName,
  size = "story",
  ring = true,
  selected = false,
}: ExpertAvatarProps) {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const inner = (
    <div
      className={`${SIZE_CLASS[size]} flex items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-sm font-semibold text-zinc-300`}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden="true">{initials || "—"}</span>
      )}
    </div>
  );

  if (!ring) {
    return inner;
  }

  return (
    <div
      className={`rounded-full p-[2px] transition ${
        selected ? "bg-zinc-500" : "bg-zinc-700"
      }`}
    >
      <div className="rounded-full bg-[#09090b] p-[2px]">{inner}</div>
    </div>
  );
}
