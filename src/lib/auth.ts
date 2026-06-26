"use client";

import { useEffect, useRef, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { clientRedirect } from "@/lib/auth/client-redirect.client";
import { checkNfcSessionAction } from "@/lib/actions/nfc-auth";
import { getUserProfile } from "@/lib/supabase-actions";
import { SWR_KEYS } from "@/lib/auth/data-cache";
import { useSessionStore } from "@/lib/auth/session-store";
import { DASHBOARD_PATH, HOME_PATH } from "@/lib/nfc/constants";
import type { UserData } from "@/types/user";

export { HOME_PATH as LOGIN_PATH };

export type ProfileStatus = "loading" | "ready" | "empty" | "error";

export function useAuth() {
  const sessionChecked = useSessionStore((state) => state.sessionChecked);
  const cachedAuthenticated = useSessionStore((state) => state.authenticated);
  const cachedProfileId = useSessionStore((state) => state.profileId);
  const cachedExpiresAt = useSessionStore((state) => state.expiresAt);
  const setSession = useSessionStore((state) => state.setSession);

  const { data, isLoading, isValidating } = useSWR(
    SWR_KEYS.session,
    checkNfcSessionAction,
    {
      fallbackData: sessionChecked
        ? {
            authenticated: cachedAuthenticated,
            profileId: cachedProfileId,
            expiresAt: cachedExpiresAt,
          }
        : undefined,
      revalidateIfStale: true,
    }
  );

  useEffect(() => {
    if (!data) {
      return;
    }

    setSession({
      authenticated: data.authenticated,
      profileId: data.profileId,
      expiresAt: data.expiresAt,
    });
  }, [data, setSession]);

  const isAuthenticated = data?.authenticated ?? cachedAuthenticated;
  const profileId = data?.profileId ?? cachedProfileId;
  const expiresAt = data?.expiresAt ?? cachedExpiresAt;
  const authLoading = !sessionChecked && (isLoading || isValidating);

  return {
    user: isAuthenticated ? { id: profileId } : null,
    isLoading: authLoading,
    isAuthenticated,
    isDevBypass: false,
    userId: profileId,
    expiresAt,
  };
}

/** Oturum yoksa ana sayfaya (public); giriş sonrası hedef ayrıca dashboard */
export function useRequireAuth(redirectTo: string = HOME_PATH) {
  const auth = useAuth();
  const redirectStartedRef = useRef(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (auth.isLoading || auth.isAuthenticated || redirectStartedRef.current) {
      return;
    }

    redirectStartedRef.current = true;
    setIsRedirecting(true);
    clientRedirect(redirectTo);
  }, [auth.isAuthenticated, auth.isLoading, redirectTo]);

  return {
    ...auth,
    isAuthPending: auth.isLoading || isRedirecting,
  };
}

function resolveProfileStatus(
  isAuthenticated: boolean,
  isLoading: boolean,
  userData: UserData | null | undefined,
  error: unknown
): ProfileStatus {
  if (!isAuthenticated) {
    return "empty";
  }

  if (isLoading && userData === undefined) {
    return "loading";
  }

  if (error) {
    return "error";
  }

  return userData ? "ready" : "empty";
}

export function useUserProfile() {
  const auth = useAuth();
  const cachedUserData = useSessionStore((state) => state.userData);
  const setUserData = useSessionStore((state) => state.setUserData);

  const profileKey = auth.isAuthenticated ? SWR_KEYS.profile : null;

  const {
    data: userData,
    error,
    isLoading,
    isValidating,
    mutate: mutateProfile,
  } = useSWR(profileKey, getUserProfile, {
    fallbackData: cachedUserData ?? undefined,
    revalidateIfStale: true,
  });

  useEffect(() => {
    if (userData !== undefined) {
      setUserData(userData);
    }
  }, [userData, setUserData]);

  const resolvedUserData = userData ?? cachedUserData;
  const profileStatus = resolveProfileStatus(
    auth.isAuthenticated,
    auth.isLoading || (Boolean(profileKey) && isLoading && !resolvedUserData),
    resolvedUserData,
    error
  );

  const isProfileLoading =
    auth.isLoading ||
    (auth.isAuthenticated &&
      profileStatus === "loading" &&
      !resolvedUserData);

  return {
    user: auth.user,
    userData: resolvedUserData,
    profileStatus,
    isLoading: isProfileLoading,
    isValidating,
    isAuthenticated: auth.isAuthenticated,
    isDevBypass: false,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refreshProfile: async () => {
      if (!auth.isAuthenticated) {
        setUserData(null);
        await globalMutate(SWR_KEYS.profile, null, false);
        return null;
      }

      const profile = await mutateProfile();
      setUserData(profile ?? null);
      return profile ?? null;
    },
  };
}

/** Oturum + profil cache'ini temizle (çıkış sonrası) */
export async function invalidateAuthCache(): Promise<void> {
  useSessionStore.getState().clearSession();
  await globalMutate(SWR_KEYS.session, undefined, { revalidate: false });
  await globalMutate(SWR_KEYS.profile, undefined, { revalidate: false });
}

export { DASHBOARD_PATH };
