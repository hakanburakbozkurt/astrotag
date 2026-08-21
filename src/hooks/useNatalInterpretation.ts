"use client";

import { useCallback, useState } from "react";
import { fetchNatalInterpretation } from "@/lib/ai/natal-interpretation-client";
import type { OracleAnalysisPresentation } from "@/lib/analysis/types";
import { SupabaseActionError } from "@/lib/supabase-action-error";
import { fetchWithRetry } from "@/lib/query/fetch-with-retry";
import { STAR_POINTS_UPDATED_EVENT } from "@/lib/energy-events";

type InterpretationStatus = "idle" | "loading" | "ready" | "error";

export function useNatalInterpretation(enabled: boolean) {
  const [status, setStatus] = useState<InterpretationStatus>("idle");
  const [presentation, setPresentation] = useState<OracleAnalysisPresentation | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [detailsUnlocked, setDetailsUnlocked] = useState(false);

  const requestInterpretation = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setStatus("loading");
    setError(null);
    setPresentation(null);
    setDetailsUnlocked(false);

    try {
      const result = await fetchWithRetry(() => fetchNatalInterpretation());
      setPresentation(result.presentation);
      setDetailsUnlocked(true);

      if (
        !result.cached &&
        typeof result.remainingStars === "number" &&
        typeof window !== "undefined"
      ) {
        window.dispatchEvent(
          new CustomEvent(STAR_POINTS_UPDATED_EVENT, {
            detail: { starPoints: result.remainingStars },
          })
        );
      }

      setStatus("ready");
    } catch (err) {
      setPresentation(null);
      setStatus("error");
      setError(
        err instanceof SupabaseActionError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Kozmik mesaj alınamadı."
      );
    }
  }, [enabled]);

  const resetInterpretation = useCallback(() => {
    setStatus("idle");
    setPresentation(null);
    setError(null);
    setDetailsUnlocked(false);
  }, []);

  return {
    status,
    presentation,
    error,
    detailsUnlocked,
    requestInterpretation,
    resetInterpretation,
  };
}

export function splitInterpretationParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
