"use client";

export type ExpertAvatarSize = "story" | "grid";

const SIZE_CLASS: Record<ExpertAvatarSize, string> = {
  story: "h-[68px] w-[68px]",
  grid: "h-16 w-16",
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
      className={`${SIZE_CLASS[size]} flex items-center justify-center overflow-hidden rounded-full bg-[#1e293b] text-sm font-semibold text-amber-100/90`}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden="true">{initials || "✨"}</span>
      )}
    </div>
  );

  if (!ring) {
    return inner;
  }

  return (
    <div
      className={`rounded-full p-[2.5px] transition ${
        selected
          ? "bg-gradient-to-tr from-amber-300 via-violet-400 to-fuchsia-400 shadow-[0_0_18px_rgba(167,139,250,0.35)]"
          : "bg-gradient-to-tr from-amber-400/80 via-violet-500/70 to-fuchsia-500/60"
      }`}
    >
      <div className="rounded-full bg-[#0b1220] p-[2px]">{inner}</div>
    </div>
  );
}
