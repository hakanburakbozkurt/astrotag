import type { NexusTransitStress } from "@/lib/nexus/nexus-transit-stress.types";
import type { CosmicToastNames } from "@/lib/cosmic-toast/types";
import { resolveCosmicToastName } from "@/lib/cosmic-toast/messages";

export type DynamicNotificationRoute =
  | "/dashboard/nexus"
  | "/dashboard/bonds"
  | "/dashboard/oracle"
  | "/dashboard/star-packages";

export interface DynamicNotification {
  id: string;
  stressLevel: NexusTransitStress["stressLevel"];
  title: string;
  message: string | ((names: CosmicToastNames) => string);
  icon: string;
  route: DynamicNotificationRoute;
}

export const DYNAMIC_NOTIFICATION_POOL: DynamicNotification[] = [
  {
    id: "calm-nexus-flow",
    stressLevel: "calm",
    title: "Gökyüzü Sakin",
    message: (names) =>
      `${resolveCosmicToastName(names.userName)}, bugün gökyüzü yumuşak — Nexus'ta günlük akışını oku.`,
    icon: "🌙",
    route: "/dashboard/nexus",
  },
  {
    id: "calm-tarot-draw",
    stressLevel: "calm",
    title: "Kartlar Hazır",
    message: (names) =>
      `${resolveCosmicToastName(names.userName)}, sakin enerjide Tarot çekmek için ideal bir an.`,
    icon: "🔮",
    route: "/dashboard/oracle",
  },
  {
    id: "calm-bonds-check",
    stressLevel: "calm",
    title: "Uyum Penceresi",
    message: (names) => {
      const partner = names.partnerName?.trim();
      return partner
        ? `${partner} ile uyum haritanızı Bonds sekmesinde güncelleyin.`
        : "Bonds sekmesinde kozmik uyum analizine göz at.";
    },
    icon: "💫",
    route: "/dashboard/bonds",
  },
  {
    id: "moderate-nexus-flex",
    stressLevel: "moderate",
    title: "Hareketli Gün",
    message: (names) =>
      `${resolveCosmicToastName(names.userName)}, gökyüzü biraz hareketli — Nexus'ta günün taktiklerini oku.`,
    icon: "🌊",
    route: "/dashboard/nexus",
  },
  {
    id: "moderate-bonds-sync",
    stressLevel: "moderate",
    title: "Rezonans Kontrolü",
    message: (names) => {
      const partner = names.partnerName?.trim();
      return partner
        ? `${partner} ile rezonans detaylarını Bonds'ta incele.`
        : "Partner ekleyerek Bonds uyum analizini aç.";
    },
    icon: "🔗",
    route: "/dashboard/bonds",
  },
  {
    id: "moderate-oracle-guide",
    stressLevel: "moderate",
    title: "Oracle Rehberi",
    message: () => "Esnek plan günlerinde Oracle araçları netlik getirir — Tarot veya Horary dene.",
    icon: "✨",
    route: "/dashboard/oracle",
  },
  {
    id: "high-nexus-strategy",
    stressLevel: "high",
    title: "Stres Uyarısı",
    message: (names) =>
      `${resolveCosmicToastName(names.userName)}, gökyüzü baskısı yükseliyor — Nexus'ta strateji belirle.`,
    icon: "⚡",
    route: "/dashboard/nexus",
  },
  {
    id: "high-bonds-anchor",
    stressLevel: "high",
    title: "Denge Noktası",
    message: (names) => {
      const partner = names.partnerName?.trim();
      return partner
        ? `${partner} ile bağını güçlendirmek için Bonds rezonansına bak.`
        : "Zorlu transitlerde Bonds uyum analizi denge sağlar.";
    },
    icon: "🛡️",
    route: "/dashboard/bonds",
  },
  {
    id: "high-oracle-reset",
    stressLevel: "high",
    title: "Kozmik Reset",
    message: () => "Yoğun gökyüzünde Tarot veya Horary ile net bir soru sor.",
    icon: "🔮",
    route: "/dashboard/oracle",
  },
];

export function resolveNotificationMessage(
  notification: DynamicNotification,
  names: CosmicToastNames = {}
): string {
  return typeof notification.message === "function"
    ? notification.message(names)
    : notification.message;
}
