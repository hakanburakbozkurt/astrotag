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
import type { FeedComposerStatus } from "@/lib/experts/feed.shared";

type FeedPostComposerProps = {
  onPosted?: () => void;
};

const selectClass =
  "w-full rounded-sm border border-zinc-800 bg-[#09090b] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600";

export default function FeedPostComposer({ onPosted }: FeedPostComposerProps) {
  const [status, setStatus] = useState<FeedComposerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [caption, setCaption] = useState("");
  const [contextTag, setContextTag] = useState<FeedContextTag | "">("");
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
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? "Gönderi paylaşılamadı.");
      return;
    }

    setCaption("");
    setContextTag("");
    setMessage("Gönderiniz paylaşıldı.");
    await loadStatus();
    onPosted?.();
  };

  if (loading) {
    return (
      <div className="rounded-sm border border-zinc-800 bg-[#09090b] p-4">
        <p className="text-sm text-zinc-500">Paylaşım alanı yükleniyor…</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="rounded-sm border border-zinc-800 bg-[#09090b] p-4">
        <p className="text-sm text-zinc-500">
          Gönderi paylaşmak için oturum açın.
        </p>
      </div>
    );
  }

  const remaining = status.remainingPostsToday;

  return (
    <div className="rounded-sm border border-zinc-800 bg-[#09090b] p-4">
      <div className="flex gap-3">
        <ExpertAvatar
          avatarUrl={status.avatarUrl}
          displayName={status.displayName}
          size="grid"
          ring={false}
        />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="font-serif text-sm text-zinc-300">Gönderi Paylaş</p>

          <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-600">
            Bağlam etiketi
            <select
              value={contextTag}
              onChange={(event) =>
                setContextTag(event.target.value as FeedContextTag | "")
              }
              className={`${selectClass} mt-1`}
            >
              <option value="">Etiket seçin…</option>
              {FEED_CONTEXT_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {feedContextTagLabel(tag)}
                </option>
              ))}
            </select>
          </label>

          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            rows={3}
            maxLength={FEED_MAX_CAPTION_LENGTH}
            placeholder="Kozmik düşüncenizi, deneyiminizi veya gözleminizi paylaşın…"
            className={`${selectClass} resize-none`}
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-zinc-600">
              {remaining}/{status.dailyLimit} günlük gönderi ·{" "}
              {caption.length}/{FEED_MAX_CAPTION_LENGTH}
            </p>
            <button
              type="button"
              disabled={submitting || remaining <= 0 || !caption.trim() || !contextTag}
              onClick={() => void handleSubmit()}
              className="rounded-sm border border-zinc-700 px-4 py-2 text-[11px] uppercase tracking-wider text-zinc-300 transition hover:border-zinc-600 disabled:opacity-50"
            >
              {submitting ? "Paylaşılıyor…" : "Paylaş"}
            </button>
          </div>

          {remaining <= 0 ? (
            <p className="text-xs text-zinc-500">
              Bugünkü paylaşım limitiniz doldu. Yarın tekrar deneyebilirsiniz.
            </p>
          ) : null}

          {message ? <p className="text-xs text-zinc-400">{message}</p> : null}
          {error ? <p className="text-xs text-zinc-500">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
