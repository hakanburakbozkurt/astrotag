"use client";

import ExpertAvatar from "@/components/experts/ExpertAvatar";
import ExpertFeedSessionCard from "@/components/experts/ExpertFeedSessionCard";
import type { ExpertFeedPost } from "@/lib/experts/feed.shared";

type ExpertFeedPostCardProps = {
  post: ExpertFeedPost;
  onSelectExpert?: (expertId: string) => void;
};

function formatFeedTimestamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function ExpertFeedPostCard({
  post,
  onSelectExpert,
}: ExpertFeedPostCardProps) {
  const isSharedSession = post.contentType === "shared_session";

  return (
    <article className="overflow-hidden rounded-sm border border-zinc-800 bg-[#09090b]">
      <header className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => onSelectExpert?.(post.expertId)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <ExpertAvatar
            avatarUrl={post.expert.avatarUrl}
            displayName={post.expert.displayName}
            size="grid"
            ring={false}
          />
          <div className="min-w-0">
            <p className="truncate font-serif text-sm text-zinc-200">
              {post.expert.displayName}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {post.expert.title}
              {isSharedSession && post.userDisplayName
                ? ` · ${post.userDisplayName} paylaştı`
                : null}
            </p>
          </div>
        </button>
        <time
          dateTime={post.createdAt}
          className="shrink-0 text-[11px] text-zinc-600"
        >
          {formatFeedTimestamp(post.createdAt)}
        </time>
      </header>

      {post.mediaUrl ? (
        <div className="border-y border-zinc-800/80 bg-zinc-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.mediaUrl}
            alt=""
            className="max-h-[420px] w-full object-cover"
          />
        </div>
      ) : null}

      <div className="space-y-4 px-4 py-4">
        {isSharedSession ? (
          <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">
            Paylaşılan seans
          </p>
        ) : null}

        {post.caption ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
            {post.caption}
          </p>
        ) : null}

        {isSharedSession && post.sessionOutputData ? (
          <ExpertFeedSessionCard output={post.sessionOutputData} />
        ) : null}
      </div>
    </article>
  );
}
