"use client";

import { useState } from "react";
import { shareSessionToFeedAction } from "@/lib/actions/expert-feed";
import type { ExpertFeedSessionOutput } from "@/lib/experts/feed.shared";

type ShareSessionToFeedButtonProps = {
  serviceRequestId: string;
  sessionOutputData: ExpertFeedSessionOutput;
  onShared?: () => void;
};

export default function ShareSessionToFeedButton({
  serviceRequestId,
  sessionOutputData,
  onShared,
}: ShareSessionToFeedButtonProps) {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleShare = async () => {
    if (!consent) {
      setError("Paylaşım için onay kutusunu işaretleyin.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await shareSessionToFeedAction({
      serviceRequestId,
      caption,
      sessionOutputData,
      shareConsent: consent,
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? "Paylaşım başarısız.");
      return;
    }

    setSuccess(true);
    onShared?.();
  };

  if (success) {
    return (
      <p className="text-xs text-zinc-400">
        Seans çıktınız uzman akışında paylaşıldı.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-sm border border-zinc-700 px-3 py-2 text-[11px] uppercase tracking-wider text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-300"
      >
        Akışta paylaş
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-sm border border-zinc-800 bg-[#09090b] p-4">
      <p className="font-serif text-sm text-zinc-300">Akışta paylaş</p>
      <p className="text-xs leading-relaxed text-zinc-500">
        Seans çıktınız yalnızca onayınızla uzman akışında görünür. Kişisel
        bilgileriniz gizli tutulur.
      </p>

      <textarea
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        rows={3}
        placeholder="İsteğe bağlı not…"
        className="w-full resize-none rounded-sm border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 outline-none placeholder:text-zinc-600 focus:border-zinc-700"
      />

      <label className="flex items-start gap-2 text-xs text-zinc-500">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-0.5 rounded-sm border-zinc-700 bg-zinc-950"
        />
        <span>
          Bu seans çıktısını uzman akışında paylaşmayı onaylıyorum.
        </span>
      </label>

      {error ? <p className="text-xs text-zinc-400">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={submitting}
          onClick={() => void handleShare()}
          className="rounded-sm border border-zinc-700 px-3 py-2 text-[11px] uppercase tracking-wider text-zinc-300 transition hover:border-zinc-600 disabled:opacity-50"
        >
          {submitting ? "Paylaşılıyor…" : "Paylaş"}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="rounded-sm px-3 py-2 text-[11px] uppercase tracking-wider text-zinc-600 transition hover:text-zinc-500"
        >
          İptal
        </button>
      </div>
    </div>
  );
}
