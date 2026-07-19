"use client";

import { useCallback, useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import {
  runKozmicShare,
  type GenerateShareableCardInput,
  type KozmicShareResult,
  type OracleShareModuleId,
  type ShareableCardModuleContent,
} from "@/lib/utils/share-utils";

export type KozmicShareButtonProps = {
  executiveSummary: string;
  moduleId: OracleShareModuleId;
  moduleLabel: string;
  content?: ShareableCardModuleContent;
  disabled?: boolean;
  className?: string;
  onResult?: (result: KozmicShareResult) => void;
};

const RESULT_MESSAGES: Record<KozmicShareResult, string | null> = {
  shared: "Paylaşım menüsü açıldı",
  downloaded: "Görsel yeni sekmede — indirebilirsiniz",
  cancelled: null,
  failed: "Paylaşım başarısız",
};

export default function KozmicShareButton({
  executiveSummary,
  moduleId,
  moduleLabel,
  content,
  disabled = false,
  className = "",
  onResult,
}: KozmicShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleShare = useCallback(async () => {
    const summary = executiveSummary.trim();
    if (!summary || isSharing || disabled) {
      return;
    }

    setIsSharing(true);
    setStatus(null);

    const input: GenerateShareableCardInput = {
      executiveSummary: summary,
      moduleId,
      moduleLabel,
      content,
    };

    try {
      const { result } = await runKozmicShare(input);
      onResult?.(result);
      const message = RESULT_MESSAGES[result];
      if (message) {
        setStatus(message);
      }
    } catch {
      onResult?.("failed");
      setStatus(RESULT_MESSAGES.failed);
    } finally {
      setIsSharing(false);
    }
  }, [content, disabled, executiveSummary, isSharing, moduleId, moduleLabel, onResult]);

  return (
    <div className={`flex flex-col items-end gap-1 ${className}`}>
      <button
        type="button"
        onClick={() => void handleShare()}
        disabled={disabled || isSharing || !executiveSummary.trim()}
        aria-label="Kozmik Mesajı paylaş"
        title="Kozmik Paylaşım"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-400/25 bg-amber-400/10 text-amber-100/90 transition hover:border-amber-400/45 hover:bg-amber-400/18 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {isSharing ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Share2 className="h-4 w-4" aria-hidden />
        )}
      </button>
      {status ? (
        <p className="max-w-[160px] text-right text-[10px] leading-snug text-amber-200/65">
          {status}
        </p>
      ) : null}
    </div>
  );
}

export type { OracleShareModuleId, ShareableCardModuleContent };
