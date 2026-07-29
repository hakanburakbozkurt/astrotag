import type { ManifestoTechniqueId } from "@/lib/manifesto/types";

export type ManifestoTechniqueMeta = {
  id: ManifestoTechniqueId;
  label: string;
  shortLabel: string;
  maxDays: number;
  hint: string;
  philosophy: string;
  icon: "calendar" | "pen" | "zap" | "hash";
  accent: "violet" | "amber" | "cyan" | "rose";
};

export const MANIFESTO_TECHNIQUE_META: Record<
  ManifestoTechniqueId,
  ManifestoTechniqueMeta
> = {
  "21_days": {
    id: "21_days",
    label: "21 Gün Kuralı",
    shortLabel: "21 Gün",
    maxDays: 21,
    hint: "21 gün boyunca her sabah aynı manifesto cümlesini içselleştir.",
    philosophy:
      "Nöral yol alışkanlığı — 21 günde zihin niyeti gerçeklik filtresi olarak kodlar.",
    icon: "calendar",
    accent: "violet",
  },
  "5x55": {
    id: "5x55",
    label: "5×55 Tekniği",
    shortLabel: "5×55",
    maxDays: 5,
    hint: "5 gün boyunca aynı cümleyi günde 55 kez yaz — yoğun reprogramming.",
    philosophy:
      "Yazılı tekrarın bilinçaltına kazıdığı 55'lik nabız — 5 günde derin dönüşüm.",
    icon: "pen",
    accent: "amber",
  },
  "3x33": {
    id: "3x33",
    label: "Tesla 3-33 Metodu",
    shortLabel: "3×33",
    maxDays: 33,
    hint: "33 gün: sabah 3, öğle 6, akşam 9 kez yaz — Tesla'nın sayısal odak ritmi.",
    philosophy:
      "Tesla'nın 3-6-9 evren anahtarı: üç zaman diliminde artan yoğunlukla 33 gün boyunca frekansı kilitle.",
    icon: "zap",
    accent: "cyan",
  },
  "369_method": {
    id: "369_method",
    label: "3-6-9 Ritüeli",
    shortLabel: "3-6-9",
    maxDays: 9,
    hint: "9 gün: ilk 3 gün 3 kez, sonraki 3 gün 6 kez, son 3 gün 9 kez yaz.",
    philosophy:
      "Sayısal amplifikasyon döngüsü — 3'ten 6'ya, 6'dan 9'a; niyet her fazda katlanarak evrene kodlanır.",
    icon: "hash",
    accent: "rose",
  },
};

export type ManifestoRitualContext = {
  repetitionsToday: number | null;
  sessionPattern: string | null;
  phaseInstruction: string;
  toneHint: string;
};

export function getTechniqueMeta(id: ManifestoTechniqueId): ManifestoTechniqueMeta {
  return MANIFESTO_TECHNIQUE_META[id];
}

export function resolveTechniqueRitualContext(
  techniqueType: ManifestoTechniqueId,
  cycleDay: number,
  _maxDays: number
): ManifestoRitualContext {
  switch (techniqueType) {
    case "21_days":
      return {
        repetitionsToday: 1,
        sessionPattern: "Sabah, aynı cümle — 21 gün disiplini",
        phaseInstruction:
          cycleDay <= 7
            ? "Tohum fazı: cümleyi yavaşça ama kararlı tekrarla."
            : cycleDay <= 14
              ? "Derinleşme: cümleyi hissederek, nefesle birlikte söyle."
              : "Entegrasyon: cümle artık senin gerçeğin gibi aksın.",
        toneHint: "Sabırlı koç — alışkanlık inşası, her gün bir tuğla.",
      };

    case "5x55":
      return {
        repetitionsToday: 55,
        sessionPattern: "Tek oturumda 55 kez el yazısı",
        phaseInstruction: `Gün ${cycleDay}/5 — yazılı tekrar bilinçaltını deler; yorulmadan, ritimle yaz.`,
        toneHint: "Yoğun, ateşli koç — 55'nin nabzını hissettir.",
      };

    case "3x33":
      return {
        repetitionsToday: 18,
        sessionPattern: "Sabah 3 · Öğle 6 · Akşam 9 kez",
        phaseInstruction:
          cycleDay <= 11
            ? "Faz 1 (1-11): Tesla frekansına giriş — 3-6-9 ritmini eksiksiz uygula."
            : cycleDay <= 22
              ? "Faz 2 (12-22): Odak derinleşiyor — her tekrar daha keskin, daha inançlı."
              : "Faz 3 (23-33): Zirve — sayılar senin imzan; evren artık dinliyor.",
        toneHint: "Elektrikli, mistik — Tesla'nın sayısal büyüsü; keskin metaforlar.",
      };

    case "369_method": {
      const phaseIndex = Math.ceil(cycleDay / 3);
      const reps = phaseIndex === 1 ? 3 : phaseIndex === 2 ? 6 : 9;
      const phaseName =
        phaseIndex === 1 ? "Tohum (3)" : phaseIndex === 2 ? "Amplifikasyon (6)" : "Manifest (9)";

      return {
        repetitionsToday: reps,
        sessionPattern: `Gün ${cycleDay}: ${reps} kez yaz`,
        phaseInstruction: `${phaseName} fazı — bugün tam ${reps} tekrar; sayı gücünü hisset.`,
        toneHint: "Matematiksel ezoterizm — 3-6-9'ın kutsal geometrisi; net, ritmik, hipnotik ton.",
      };
    }
  }
}

export function resolveTechniqueCyclePhaseLabel(
  techniqueType: ManifestoTechniqueId,
  cycleDay: number,
  maxDays: number
): string {
  const ritual = resolveTechniqueRitualContext(techniqueType, cycleDay, maxDays);
  return `${ritual.phaseInstruction} · ${ritual.sessionPattern ?? ""}`.trim();
}

export function buildTechniquePromptBlock(
  techniqueType: ManifestoTechniqueId,
  cycleDay: number,
  maxDays: number
): string {
  const meta = getTechniqueMeta(techniqueType);
  const ritual = resolveTechniqueRitualContext(techniqueType, cycleDay, maxDays);

  return `TEKNİK FELSEFESİ (${meta.label}):
${meta.philosophy}

BUGÜNKÜ RİTÜEL BAĞLAMI:
- Döngü: Gün ${cycleDay} / ${maxDays}
- ${ritual.phaseInstruction}
- Oturum: ${ritual.sessionPattern ?? "—"}
- Tekrar sayısı: ${ritual.repetitionsToday ?? "içsel tekrar"}
- Ton ipucu: ${ritual.toneHint}

ritualWhisper alanı bu tekniğe özel somut eylem içermeli (${meta.shortLabel}).`;
}
