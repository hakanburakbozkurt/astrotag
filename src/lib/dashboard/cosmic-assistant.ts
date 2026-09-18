import type { NexusTransitStress } from "@/lib/nexus/nexus-transit-stress.types";
import type { UserManifestoRecord } from "@/lib/manifesto/types";
import { MANIFESTO_TECHNIQUES } from "@/lib/manifesto/types";

export type CosmicAssistantNudgeKind =
  | "manifesto_pending"
  | "manifesto_streak"
  | "sky_transit"
  | "nexus_discovery"
  | "tarot_discovery";

export interface CosmicAssistantNudge {
  kind: CosmicAssistantNudgeKind;
  title: string;
  message: string;
  collapsedHint: string;
  ctaLabel?: string;
  ctaHref?: string;
  priority: number;
}

export interface CosmicAssistantContext {
  userName: string;
  userId?: string;
  todayKey: string;
  manifesto: UserManifestoRecord | null;
  transit: NexusTransitStress | null;
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? "";
}

function dayHash(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function isManifestoCheckedInToday(
  manifesto: UserManifestoRecord | null,
  todayKey: string
): boolean {
  return Boolean(manifesto?.lastCheckedDate === todayKey);
}

function techniqueLabel(techniqueType: UserManifestoRecord["techniqueType"]): string {
  return (
    MANIFESTO_TECHNIQUES.find((item) => item.id === techniqueType)?.label ?? "Manifesto"
  );
}

export function buildCosmicAssistantNudges(
  ctx: CosmicAssistantContext
): CosmicAssistantNudge[] {
  const nudges: CosmicAssistantNudge[] = [];
  const name = firstName(ctx.userName);
  const manifestoPending = !isManifestoCheckedInToday(ctx.manifesto, ctx.todayKey);

  if (manifestoPending) {
    const streakActive =
      ctx.manifesto &&
      ctx.manifesto.currentDay > 1 &&
      (ctx.manifesto.techniqueType === "3x33" ||
        ctx.manifesto.techniqueType === "369_method" ||
        ctx.manifesto.techniqueType === "21_days");

    if (streakActive && ctx.manifesto) {
      const label = techniqueLabel(ctx.manifesto.techniqueType);
      nudges.push({
        kind: "manifesto_streak",
        priority: 100,
        title: name ? `${name}, serin devam ediyor` : "Serin devam ediyor",
        message: `${label} · Gün ${ctx.manifesto.currentDay}/${ctx.manifesto.maxDays}. Bugün evrene mesaj göndermeye hazır mısın?`,
        collapsedHint: `Gün ${ctx.manifesto.currentDay}/${ctx.manifesto.maxDays} · niyetini gönder`,
        ctaLabel: "Manifesto'ya git",
        ctaHref: "/dashboard/manifest",
      });
    } else {
      nudges.push({
        kind: "manifesto_pending",
        priority: 100,
        title: name ? `${name}, bugün evrenle konuş` : "Bugün evrenle konuş",
        message:
          "Bugün evrene mesaj gönderdin mi? Küçük bir niyet, günün tonunu değiştirebilir.",
        collapsedHint: "Bugünkü manifesto niyetini henüz göndermedin",
        ctaLabel: "Niyetini yaz",
        ctaHref: "/dashboard/manifest",
      });
    }
  }

  if (ctx.transit?.stressLevel === "high") {
    nudges.push({
      kind: "sky_transit",
      priority: 75,
      title: "Gökyüzü bugün hareketli",
      message:
        ctx.transit.tactic ||
        "Bugün gökyüzü oldukça hareketli — içgörülerine kulak ver.",
      collapsedHint: ctx.transit.skySummary,
      ctaLabel: "Nexus'a bak",
      ctaHref: "/dashboard/nexus",
    });
  } else if (ctx.transit?.stressLevel === "moderate") {
    nudges.push({
      kind: "sky_transit",
      priority: 55,
      title: "Gökyüzünde hafif bir dalga",
      message:
        ctx.transit.tactic ||
        "Transitler nazikçe nabız atıyor; gününü buna göre ayarlamak iyi gelebilir.",
      collapsedHint: ctx.transit.skySummary,
      ctaLabel: "Günlük akış",
      ctaHref: "/dashboard/nexus",
    });
  } else if (ctx.transit?.skySummary) {
    nudges.push({
      kind: "sky_transit",
      priority: 40,
      title: "Gökyüzü sakin ama canlı",
      message: ctx.transit.skySummary,
      collapsedHint: "Kısa gökyüzü notu · dokun ve oku",
      ctaLabel: "Nexus",
      ctaHref: "/dashboard/nexus",
    });
  }

  nudges.push({
    kind: "nexus_discovery",
    priority: 28,
    title: "Burcuna baktın mı?",
    message:
      "Bugün günlük burç akışına göz atmak, günün tonunu belirlemene yardım eder.",
    collapsedHint: "Nexus · günlük burç rehberi",
    ctaLabel: "Nexus'u aç",
    ctaHref: "/dashboard/nexus",
  });

  nudges.push({
    kind: "tarot_discovery",
    priority: 24,
    title: "Enerjini tazele",
    message:
      "Uzun zamandır tarot bakmıyorsun gibi — üç kartlık hızlı bir açılım zihnini netleştirebilir.",
    collapsedHint: "Tarot · kozmik rastgele çek",
    ctaLabel: "Tarot'a git",
    ctaHref: "/dashboard/tarot",
  });

  return nudges;
}

export function pickCosmicAssistantNudge(
  ctx: CosmicAssistantContext
): CosmicAssistantNudge {
  const candidates = buildCosmicAssistantNudges(ctx).sort(
    (a, b) => b.priority - a.priority
  );

  if (candidates.length === 0) {
    return {
      kind: "nexus_discovery",
      priority: 0,
      title: "Kozmik rehberin burada",
      message: "Modüllere göz atarak günün enerjisini keşfet.",
      collapsedHint: "Günlük rehber · dokun",
      ctaLabel: "Keşfet",
      ctaHref: "/dashboard/manifest",
    };
  }

  const topPriority = candidates[0].priority;
  const topTier = candidates.filter((item) => item.priority === topPriority);

  if (topPriority >= 75 || topTier.length === 1) {
    return topTier[0];
  }

  const discoveryPool = candidates.filter((item) => item.priority <= 40);
  if (discoveryPool.length > 0) {
    const index =
      dayHash(`${ctx.todayKey}:${ctx.userId ?? "guest"}`) % discoveryPool.length;
    return discoveryPool[index];
  }

  const index = dayHash(`${ctx.todayKey}:${ctx.userId ?? "guest"}`) % topTier.length;
  return topTier[index];
}
