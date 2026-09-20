"use client";

export type ExpertAvatarSize = "story" | "storyCompact" | "feed" | "grid" | "profile";

const SIZE_CLASS: Record<ExpertAvatarSize, string> = {
  story: "h-[68px] w-[68px]",
  storyCompact: "h-11 w-11",
  feed: "h-9 w-9",
  grid: "h-16 w-16",
  profile: "h-24 w-24 sm:h-28 sm:w-28",
};

const TEXT_CLASS: Record<ExpertAvatarSize, string> = {
  story: "text-sm",
  storyCompact: "text-[11px]",
  feed: "text-[10px]",
  grid: "text-sm",
  profile: "text-sm",
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
      className={`${SIZE_CLASS[size]} flex items-center justify-center overflow-hidden rounded-full bg-zinc-900 font-semibold text-zinc-300 ${TEXT_CLASS[size]}`}
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
