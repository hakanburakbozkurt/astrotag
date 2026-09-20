"use client";

import { useState } from "react";
import ExpertAvatar from "@/components/experts/ExpertAvatar";
import ExpertFeedSessionCard from "@/components/experts/ExpertFeedSessionCard";
import FeedLikeButton from "@/components/experts/FeedLikeButton";
import {
  createFeedReplyAction,
  toggleFeedLikeAction,
} from "@/lib/actions/expert-feed";
import {
  FEED_MAX_REPLY_LENGTH,
  feedContextTagLabel,
} from "@/lib/feed/feed-context-tags.shared";
import {
  feedPostTypeLabel,
  type FeedPost,
} from "@/lib/experts/feed.shared";

type SocialFeedPostCardProps = {
  post: FeedPost;
  onSelectExpert?: (expertId: string) => void;
  onEngagementChange?: () => void;
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

export default function SocialFeedPostCard({
  post,
  onSelectExpert,
  onEngagementChange,
}: SocialFeedPostCardProps) {
  const [liked, setLiked] = useState(post.likedByViewer);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [replyCount, setReplyCount] = useState(post.replyCount);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUserPost = post.contentType === "user_post";
  const isSharedSession = post.contentType === "shared_session";
  const isExpertAnnouncement = post.contentType === "expert_announcement";

  const headerName = isUserPost
    ? post.author.displayName
    : post.expert?.displayName ?? post.author.displayName;

  const headerAvatar = isUserPost
    ? post.author.avatarUrl
    : post.expert?.avatarUrl ?? post.author.avatarUrl;

  const headerSubtitle = isUserPost
    ? post.contextTagLabel ?? feedPostTypeLabel(post.contentType)
    : [
        post.expert?.title,
        isSharedSession && post.author.displayName
          ? `${post.author.displayName} paylaştı`
          : null,
      ]
        .filter(Boolean)
        .join(" · ");

  const handleLike = async () => {
    setLikeBusy(true);
    setError(null);
    const result = await toggleFeedLikeAction(post.id);
    setLikeBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setLiked(result.liked);
    setLikeCount(result.likeCount);
    onEngagementChange?.();
  };

  const handleReply = async () => {
    const body = replyBody.trim();
    if (!body) {
      return;
    }

    setReplyBusy(true);
    setError(null);
    const result = await createFeedReplyAction({ postId: post.id, body });
    setReplyBusy(false);

    if (!result.ok) {
      setError(result.error ?? "Yanıt gönderilemedi.");
      return;
    }

    setReplyBody("");
    setShowReplyBox(false);
    setReplyCount((count) => count + 1);
    onEngagementChange?.();
  };

  return (
    <article className="overflow-hidden rounded-sm border border-zinc-800 bg-[#09090b]">
      <header className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => {
            if (!isUserPost && post.expertId) {
              onSelectExpert?.(post.expertId);
            }
          }}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ExpertAvatar
            avatarUrl={headerAvatar}
            displayName={headerName}
            size="feed"
            ring={false}
          />
          <div className="min-w-0">
            <p className="truncate font-serif text-[13px] text-zinc-200">
              {headerName}
            </p>
            <p className="truncate text-[11px] text-zinc-500">{headerSubtitle}</p>
          </div>
        </button>
        <time
          dateTime={post.createdAt}
          className="shrink-0 text-[10px] text-zinc-600"
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
            className="max-h-56 w-full object-cover"
          />
        </div>
      ) : null}

      <div className="space-y-2 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-sm border border-zinc-800 px-1.5 py-px text-[9px] uppercase tracking-[0.16em] text-zinc-600">
            {isUserPost && post.contextTag
              ? feedContextTagLabel(post.contextTag)
              : feedPostTypeLabel(post.contentType)}
          </span>
          {isExpertAnnouncement ? (
            <span className="text-[9px] uppercase tracking-[0.16em] text-zinc-700">
              Uzman
            </span>
          ) : null}
        </div>

        {post.caption ? (
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-300">
            {post.caption}
          </p>
        ) : null}

        {isSharedSession && post.sessionOutputData ? (
          <ExpertFeedSessionCard output={post.sessionOutputData} compact />
        ) : null}

        <div className="flex items-center gap-3 border-t border-zinc-800/80 pt-2">
          <FeedLikeButton
            liked={liked}
            likeCount={likeCount}
            disabled={likeBusy}
            onClick={() => void handleLike()}
          />
          <button
            type="button"
            onClick={() => setShowReplyBox((open) => !open)}
            className="text-[11px] text-zinc-500 transition hover:text-zinc-400"
          >
            Yanıtla · {replyCount}
          </button>
        </div>

        {post.replies.length > 0 ? (
          <ul className="space-y-1.5 border-t border-zinc-800/80 pt-2">
            {post.replies.map((reply) => (
              <li
                key={reply.id}
                className="rounded-sm border border-zinc-800/80 px-2 py-1.5"
              >
                <div className="flex items-start gap-1.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-[9px] font-semibold text-zinc-400">
                    {reply.author.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={reply.author.avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      reply.author.displayName.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[10px] text-zinc-500">
                      {reply.author.displayName}
                    </p>
                    <p className="whitespace-pre-wrap text-[12px] leading-snug text-zinc-400">
                      {reply.body}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {showReplyBox ? (
          <div className="space-y-1.5 border-t border-zinc-800/80 pt-2">
            <textarea
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              rows={2}
              maxLength={FEED_MAX_REPLY_LENGTH}
              placeholder="Kısa yanıt…"
              className="w-full resize-none rounded-sm border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-[12px] text-zinc-300 outline-none placeholder:text-zinc-600 focus:border-zinc-700"
            />
            <button
              type="button"
              disabled={replyBusy || !replyBody.trim()}
              onClick={() => void handleReply()}
              className="rounded-sm border border-zinc-700 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-400 transition hover:border-zinc-600 disabled:opacity-50"
            >
              {replyBusy ? "Gönderiliyor…" : "Gönder"}
            </button>
          </div>
        ) : null}

        {error ? <p className="text-[11px] text-zinc-500">{error}</p> : null}
      </div>
    </article>
  );
}
