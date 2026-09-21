"use client";

import { useCallback, useEffect, useState } from "react";
import ExpertAvatar from "@/components/experts/ExpertAvatar";
import {
  createUserFeedPostAction,
  getFeedComposerStatusAction,
} from "@/lib/actions/expert-feed";
import {
  FEED_CONTEXT_TAGS,
  FEED_MAX_CAPTION_LENGTH,
  feedContextTagLabel,
  type FeedContextTag,
} from "@/lib/feed/feed-context-tags.shared";
import {
  DAILY_STATE_MAX_LENGTH,
  EMOTIONAL_STATE_TAGS,
  emotionalStateTagLabel,
  type EmotionalStateTag,
} from "@/lib/similar-stories/similar-stories.shared";
import type { FeedComposerStatus } from "@/lib/experts/feed.shared";

type FeedPostComposerProps = {
  onPosted?: () => void;
};

const fieldClass =
  "w-full rounded-sm border border-zinc-800 bg-[#09090b] px-2 py-1.5 text-[12px] text-zinc-200 outline-none focus:border-zinc-600";

export default function FeedPostComposer({ onPosted }: FeedPostComposerProps) {
  const [status, setStatus] = useState<FeedComposerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [caption, setCaption] = useState("");
  const [contextTag, setContextTag] = useState<FeedContextTag | "">("");
  const [dailyStateText, setDailyStateText] = useState("");
  const [emotionalStateTag, setEmotionalStateTag] = useState<EmotionalStateTag | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    const data = await getFeedComposerStatusAction();
    setStatus(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleSubmit = async () => {
    if (!contextTag) {
      setError("Paylaşmadan önce bir bağlam etiketi seçin.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    const result = await createUserFeedPostAction({
      caption,
      contextTag,
      dailyStateText: dailyStateText.trim() || undefined,
      emotionalStateTag: emotionalStateTag || null,
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? "Gönderi paylaşılamadı.");
      return;
    }

    setCaption("");
    setContextTag("");
    setDailyStateText("");
    setEmotionalStateTag("");
    setMessage("Gönderiniz paylaşıldı.");
    await loadStatus();
    onPosted?.();
  };

  if (loading) {
    return (
      <div className="rounded-sm border border-zinc-800 bg-[#09090b] px-3 py-2">
        <p className="text-[12px] text-zinc-500">Yükleniyor…</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="rounded-sm border border-zinc-800 bg-[#09090b] px-3 py-2">
        <p className="text-[12px] text-zinc-500">
          Gönderi paylaşmak için oturum açın.
        </p>
      </div>
    );
  }

  const remaining = status.remainingPostsToday;

  return (
    <div className="rounded-sm border border-zinc-800 bg-[#09090b] px-3 py-2.5">
      <div className="flex gap-2">
        <ExpertAvatar
          avatarUrl={status.avatarUrl}
          displayName={status.displayName}
          size="feed"
          ring={false}
        />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-serif text-[13px] text-zinc-300">Gönderi Paylaş</p>

          <select
            value={contextTag}
            onChange={(event) =>
              setContextTag(event.target.value as FeedContextTag | "")
            }
            className={fieldClass}
            aria-label="Bağlam etiketi"
          >
            <option value="">Etiket seçin…</option>
            {FEED_CONTEXT_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {feedContextTagLabel(tag)}
              </option>
            ))}
          </select>

          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            rows={2}
            maxLength={FEED_MAX_CAPTION_LENGTH}
            placeholder="Kozmik düşüncenizi paylaşın…"
            className={`${fieldClass} resize-none`}
          />

          <textarea
            value={dailyStateText}
            onChange={(event) => setDailyStateText(event.target.value)}
            rows={1}
            maxLength={DAILY_STATE_MAX_LENGTH}
            placeholder="Bugünkü haliniz (isteğe bağlı, max 140)…"
            className={`${fieldClass} resize-none`}
            aria-label="Bugünkü hal"
          />

          <select
            value={emotionalStateTag}
            onChange={(event) =>
              setEmotionalStateTag(event.target.value as EmotionalStateTag | "")
            }
            className={fieldClass}
            aria-label="Duygusal durum"
          >
            <option value="">Duygusal hal (isteğe bağlı)…</option>
            {EMOTIONAL_STATE_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {emotionalStateTagLabel(tag)}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] text-zinc-600">
              {remaining}/{status.dailyLimit} gönderi · {caption.length}/
              {FEED_MAX_CAPTION_LENGTH}
            </p>
            <button
              type="button"
              disabled={
                submitting || remaining <= 0 || !caption.trim() || !contextTag
              }
              onClick={() => void handleSubmit()}
              className="rounded-sm border border-zinc-700 px-2.5 py-1 text-[10px] uppercase tracking-wider text-zinc-300 transition hover:border-zinc-600 disabled:opacity-50"
            >
              {submitting ? "…" : "Paylaş"}
            </button>
          </div>

          {remaining <= 0 ? (
            <p className="text-[11px] text-zinc-500">
              Günlük gönderi limitiniz doldu.
            </p>
          ) : null}

          {message ? <p className="text-[11px] text-zinc-400">{message}</p> : null}
          {error ? <p className="text-[11px] text-zinc-500">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
