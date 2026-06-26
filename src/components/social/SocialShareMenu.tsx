"use client";

import { Copy, Download, Film, Share2 } from "lucide-react";
import type { RefObject } from "react";
import type { SocialSharePayload } from "@/lib/social/types";
import { useSocialShare } from "@/hooks/useSocialShare";

interface SocialShareMenuProps {
  payload: SocialSharePayload;
  chartRef: RefObject<HTMLElement | null>;
  includeVideo?: boolean;
  testId?: string;
}

export default function SocialShareMenu({
  payload,
  chartRef,
  includeVideo = false,
  testId = "social-share-menu",
}: SocialShareMenuProps) {
  const { status, isBusy, exportImage, exportBundle, shareNative } =
    useSocialShare({ payload, chartRef, includeVideo });

  return (
    <div data-testid={testId}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => void shareNative()}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/80 hover:border-amber-400/30 disabled:opacity-50"
        >
          <Share2 className="h-3.5 w-3.5" />
          Paylaş
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => void exportImage()}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/80 hover:border-amber-400/30 disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          Story PNG
        </button>
        {includeVideo ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void exportBundle()}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/80 hover:border-amber-400/30 disabled:opacity-50"
          >
            <Film className="h-3.5 w-3.5" />
            Video
          </button>
        ) : null}
        <button
          type="button"
          disabled={isBusy}
          onClick={() => void navigator.clipboard.writeText(payload.shareText)}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/80 hover:border-amber-400/30 disabled:opacity-50"
        >
          <Copy className="h-3.5 w-3.5" />
          Metin
        </button>
      </div>

      {status ? (
        <p className="mt-2 text-[10px] text-amber-300/70" data-testid={`${testId}-status`}>
          {status}
        </p>
      ) : null}
    </div>
  );
}
