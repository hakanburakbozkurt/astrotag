"use client";

import Link from "next/link";
import { useQuery } from "@/hooks/useQuery";
import TabPageScaffold from "@/components/navigation/TabPageScaffold";
import TabPageSkeleton, { SectionSkeleton } from "@/components/navigation/TabPageSkeleton";
import { compactSectionClass } from "@/components/navigation/compact-ui";
import NexusSignHeader from "@/components/nexus/NexusSignHeader";
import NexusHorizonCard from "@/components/nexus/NexusHorizonCard";
import NexusVisualizer from "@/components/nexus/NexusVisualizer";
import FormToast from "@/components/ui/FormToast";
import { useAuth, useUserProfile } from "@/lib/auth";
import {
  fetchNexusDailyCached,
  SWR_KEYS,
} from "@/lib/auth/data-cache";
import { resolveProfileSunSigns } from "@/lib/astrology/sun-sign";
import { getDailyCompatibilityDateKey } from "@/lib/compatibility/daily-questions";
import { PROFILE_SETUP_PATH } from "@/lib/nfc/constants";
import type { NexusDailyResponse } from "@/lib/ai/nexus";
import type { UserData } from "@/types/user";

const NEXUS_CACHE_PREFIX = "nexus_daily_";

function readCachedNexus(dateKey: string): NexusDailyResponse | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(`${NEXUS_CACHE_PREFIX}${dateKey}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as NexusDailyResponse;
  } catch {
    return null;
  }
}

function writeCachedNexus(data: NexusDailyResponse): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(`${NEXUS_CACHE_PREFIX}${data.date}`, JSON.stringify(data));
}

async function loadNexusDaily(
  userData: UserData,
  dateKey: string
): Promise<NexusDailyResponse> {
  const cached = readCachedNexus(dateKey);
  if (cached) {
    return cached;
  }

  const result = await fetchNexusDailyCached(userData);
  writeCachedNexus(result);
  return result;
}

export default function NexusTabContent() {
  const { userId } = useAuth();
  const { userData, isPending: isProfilePending, error: profileError } = useUserProfile();
  const dateKey = getDailyCompatibilityDateKey();

  const swrKey =
    userId && userData ? SWR_KEYS.nexusDaily(userId, dateKey) : null;

  const {
    data: nexus,
    error: nexusError,
    isPending: isNexusPending,
    showError: showNexusError,
  } = useQuery(swrKey, () => loadNexusDaily(userData!, dateKey), {
    fallbackData: readCachedNexus(dateKey) ?? undefined,
    revalidateIfStale: true,
  });

  if (isProfilePending) {
    return <TabPageSkeleton />;
  }

  if (!userData) {
    return null;
  }

  const signs = resolveProfileSunSigns(userData);
  const partnerName = userData.partnerName?.trim() || null;

  return (
    <div className="nexus-tab-root">
      <TabPageScaffold
        eyebrow="Nexus"
        title="Günlük Burç Akışı"
        description="Senin ve partnerinin Güneş burçlarına göre bugünkü kozmik sinyaller ve gökyüzü baskısı."
      >
        {profileError ? (
          <FormToast message={profileError} />
        ) : null}

        <NexusSignHeader
          userSign={signs.userSign ?? "—"}
          userName={userData.name}
          partnerSign={signs.partnerSign}
          partnerName={partnerName}
        />

        {!signs.userSign ? (
          <div className={`${compactSectionClass} text-center`}>
            <p className="text-sm text-white/55">
              Güneş burcun hesaplanamadı. Doğum tarihinizi profilde güncelleyin.
            </p>
            <Link
              href={`${PROFILE_SETUP_PATH}?mode=edit`}
              className="mt-4 inline-flex rounded-lg border border-amber-400/30 px-4 py-2 text-xs text-amber-100"
            >
              Profili Düzenle
            </Link>
          </div>
        ) : null}

        {isNexusPending && !nexus ? (
          <div className="space-y-4">
            <SectionSkeleton title="Senin Günün" />
            <SectionSkeleton title="Partnerinin Günün" />
          </div>
        ) : null}

        {showNexusError && nexusError ? (
          <div className={`${compactSectionClass} text-center`}>
            <p className="text-sm text-red-200/80">
              {nexusError instanceof Error
                ? nexusError.message
                : "Nexus yorumları yüklenemedi."}
            </p>
          </div>
        ) : null}

        {nexus ? (
          <>
            <div className="space-y-4">
              <NexusHorizonCard
                title="Senin Günün"
                sign={nexus.userSign}
                name={userData.name}
                reading={nexus.userDay}
              />

              {nexus.partnerSign && nexus.partnerDay ? (
                <NexusHorizonCard
                  title="Partnerinin Günün"
                  sign={nexus.partnerSign}
                  name={partnerName}
                  reading={nexus.partnerDay}
                  delay={0.08}
                />
              ) : (
                <div className={`${compactSectionClass} flex flex-col justify-center text-center`}>
                  <p className="text-sm text-white/55">
                    Partner burcu için profilde partner doğum tarihi gerekli.
                  </p>
                  <Link
                    href="/dashboard/profile#bond-partner"
                    className="mt-3 text-xs text-amber-200/80 underline-offset-2 hover:underline"
                  >
                    Profilden partner ekle
                  </Link>
                </div>
              )}
            </div>

            <NexusVisualizer userData={userData} />

            <p className="text-center text-[10px] uppercase tracking-[0.2em] text-white/30">
              {nexus.date}
            </p>
          </>
        ) : null}
      </TabPageScaffold>
    </div>
  );
}
