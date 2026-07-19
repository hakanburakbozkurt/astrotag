"use client";

import { useCallback, useState } from "react";
import type { UserData } from "@/types/user";
import { fetchNatalInterpretation } from "@/lib/ai/natal-interpretation-client";
import type { OracleAnalysisPresentation } from "@/lib/analysis/types";
import { SupabaseActionError } from "@/lib/supabase-action-error";
import { fetchWithRetry } from "@/lib/query/fetch-with-retry";

type InterpretationStatus = "idle" | "loading" | "ready" | "error";

export function useNatalInterpretation(userData: UserData | null) {
  const [status, setStatus] = useState<InterpretationStatus>("idle");
  const [presentation, setPresentation] = useState<OracleAnalysisPresentation | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const requestInterpretation = useCallback(async () => {
    if (!userData?.birthDate || !userData?.birthTime || !userData?.birthPlace) {
      return;
    }

    setStatus("loading");
    setError(null);
    setPresentation(null);

    try {
      const result = await fetchWithRetry(() => fetchNatalInterpretation(userData));
      setPresentation(result.presentation);
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
  }, [userData]);

  const resetInterpretation = useCallback(() => {
    setStatus("idle");
    setPresentation(null);
    setError(null);
  }, []);

  return {
    status,
    presentation,
    error,
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
