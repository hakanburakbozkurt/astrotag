import type { ManifestoCategoryId } from "@/lib/manifesto/types";

/** Kategori → natal odak evleri ve gezegenler (Emph paketi zenginleştirme) */
export const MANIFESTO_CATEGORY_FOCUS: Record<
  ManifestoCategoryId,
  { houses: number[]; planets: string[]; theme: string }
> = {
  para: {
    houses: [2, 8, 11],
    planets: ["venus", "jupiter", "saturn"],
    theme: "Değer, bolluk akışı ve maddi özgüven",
  },
  is_kariyer: {
    houses: [6, 10, 2],
    planets: ["sun", "saturn", "mars", "mercury"],
    theme: "Vocation, itibar ve stratejik yükseliş",
  },
  ask: {
    houses: [5, 7, 8],
    planets: ["venus", "mars", "moon"],
    theme: "Çekim, bağ ve kalpteki gerçek arzu",
  },
  saglik: {
    houses: [1, 6, 12],
    planets: ["mars", "moon", "sun"],
    theme: "Beden, ritim ve yaşam enerjisi",
  },
  ozguven: {
    houses: [1, 5, 10],
    planets: ["sun", "mars", "jupiter"],
    theme: "Öz imaj, cesaret ve iç ateş",
  },
  ruhsal: {
    houses: [9, 12, 4],
    planets: ["jupiter", "moon", "saturn"],
    theme: "Ruh yolu, sezgi ve derin hizalanma",
  },
};

export type ManifestoPresentation = {
  cosmicHook: string;
  natalMirror: string;
  manifestoClaim: string;
  ritualWhisper: string;
};

export function formatManifestoForDisplay(
  presentation: ManifestoPresentation
): string {
  return [
    presentation.cosmicHook,
    presentation.natalMirror,
    presentation.manifestoClaim,
    presentation.ritualWhisper,
  ].join("\n\n");
}

export function parseManifestoPresentation(
  raw: string | null | undefined
): ManifestoPresentation | null {
  if (!raw?.trim()) {
    return null;
  }

  const trimmed = raw.trim();

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "cosmicHook" in parsed &&
      "natalMirror" in parsed &&
      "manifestoClaim" in parsed &&
      "ritualWhisper" in parsed
    ) {
      const p = parsed as ManifestoPresentation;
      if (
        p.cosmicHook?.trim() &&
        p.natalMirror?.trim() &&
        p.manifestoClaim?.trim() &&
        p.ritualWhisper?.trim()
      ) {
        return {
          cosmicHook: p.cosmicHook.trim(),
          natalMirror: p.natalMirror.trim(),
          manifestoClaim: p.manifestoClaim.trim(),
          ritualWhisper: p.ritualWhisper.trim(),
        };
      }
    }
  } catch {
    // legacy düz metin
  }

  return {
    cosmicHook: "",
    natalMirror: "",
    manifestoClaim: trimmed.replace(/^["']|["']$/g, ""),
    ritualWhisper: "",
  };
}
