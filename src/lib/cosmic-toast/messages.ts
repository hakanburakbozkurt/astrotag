import type { CosmicToastNames, CosmicToastVariant } from "./types";

export const COSMIC_TOAST_DEFAULT_NAME = "Kozmos Yolcusu";

export const COSMIC_TOAST_ICONS: Record<CosmicToastVariant, string> = {
  cosmicSuccess: "✨",
  tarotReady: "🔮",
  compatibilityNudge: "💫",
  energyPulse: "🌙",
  welcome: "🌟",
};

type MessageBuilder = (userName: string, partnerName: string) => string;

const WITH_PARTNER: Record<CosmicToastVariant, MessageBuilder> = {
  cosmicSuccess: (userName, partnerName) =>
    `Selam ${userName}, yıldızlar bugün senin ve ${partnerName} için yeni bir enerji yakaladı!`,
  tarotReady: (userName, partnerName) =>
    `Hey ${userName}, ${partnerName} ile birlikte bir Tarot okumasına ne dersin?`,
  compatibilityNudge: (userName, partnerName) =>
    `Hey ${userName}, ${partnerName} ile olan uyumunu merak etmiyor musun?`,
  energyPulse: (userName, partnerName) =>
    `${userName}, ${partnerName} ile paylaştığınız kozmik frekans bugün yükseliyor.`,
  welcome: (userName, partnerName) =>
    `Hoş geldin ${userName}! ${partnerName} ile birlikte kozmik yolculuğunuz devam ediyor.`,
};

const SOLO: Record<CosmicToastVariant, (userName: string) => string> = {
  cosmicSuccess: (userName) => `${userName}, bugün evrenin senin için bir mesajı var!`,
  tarotReady: (userName) => `${userName}, kartlar seni bekliyor — bir çekilişe hazır mısın?`,
  compatibilityNudge: (userName) => `${userName}, yıldızlar bugün senin için yeni bir ipucu bıraktı!`,
  energyPulse: (userName) => `${userName}, bugünkü kozmik enerjin zirveye yaklaşıyor.`,
  welcome: (userName) => `Hoş geldin ${userName}! Kozmos seninle.`,
};

export function resolveCosmicToastName(name?: string | null): string {
  const trimmed = name?.trim();
  return trimmed || COSMIC_TOAST_DEFAULT_NAME;
}

export function buildCosmicToastMessage(
  variant: CosmicToastVariant,
  names?: CosmicToastNames
): string {
  const userName = resolveCosmicToastName(names?.userName);
  const partnerName = names?.partnerName?.trim();

  if (partnerName) {
    return WITH_PARTNER[variant](userName, partnerName);
  }

  return SOLO[variant](userName);
}
