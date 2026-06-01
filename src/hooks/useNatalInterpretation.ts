"use client";

import { useCallback, useState } from "react";
import type { UserData } from "@/types/user";
import { fetchNatalInterpretation } from "@/lib/ai/natal-interpretation-client";
import { consumeCosmicEnergy } from "@/lib/supabase-actions";
import { SupabaseActionError } from "@/lib/supabase-action-error";

type InterpretationStatus = "idle" | "loading" | "ready" | "error";

export function useNatalInterpretation(userData: UserData | null) {
  const [status, setStatus] = useState<InterpretationStatus>("idle");
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestInterpretation = useCallback(async () => {
    if (!userData?.birthDate || !userData?.birthTime || !userData?.birthPlace) {
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      await consumeCosmicEnergy();
      const result = await fetchNatalInterpretation(userData);
      setInterpretation(result.interpretation);
      setStatus("ready");
    } catch (err) {
      setInterpretation(null);
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

  return { status, interpretation, error, requestInterpretation };
}

export function splitInterpretationParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
