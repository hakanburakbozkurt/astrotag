"use client";

import { useEffect, useRef, useState } from "react";
import { useSafeRouter } from "@/lib/auth/safe-router-nav.client";
import { checkNfcSessionAction } from "@/lib/actions/nfc-auth";
import { getUserProfile } from "@/lib/supabase-actions";
import { DASHBOARD_PATH, HOME_PATH } from "@/lib/nfc/constants";
import type { UserData } from "@/types/user";

export { HOME_PATH as LOGIN_PATH };

export type ProfileStatus = "loading" | "ready" | "empty" | "error";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void checkNfcSessionAction().then((session) => {
      if (!isMounted) {
        return;
      }

      setIsAuthenticated(session.authenticated);
      setProfileId(session.profileId);
      setExpiresAt(session.expiresAt);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    user: isAuthenticated ? { id: profileId } : null,
    isLoading,
    isAuthenticated,
    isDevBypass: false,
    userId: profileId,
    expiresAt,
  };
}

/** Oturum yoksa ana sayfaya (public); giriş sonrası hedef ayrıca dashboard */
export function useRequireAuth(redirectTo: string = HOME_PATH) {
  const { safeReplace, isRouterReady, isNavigating } = useSafeRouter();
  const auth = useAuth();
  const redirectStartedRef = useRef(false);

  useEffect(() => {
    if (
      auth.isLoading ||
      auth.isAuthenticated ||
      !isRouterReady ||
      redirectStartedRef.current
    ) {
      return;
    }

    redirectStartedRef.current = true;
    void safeReplace(redirectTo);
  }, [
    auth.isAuthenticated,
    auth.isLoading,
    isRouterReady,
    safeReplace,
    redirectTo,
  ]);

  return {
    ...auth,
    isAuthPending: auth.isLoading || isNavigating || (!auth.isAuthenticated && !auth.isLoading && !isRouterReady),
  };
}

export function useUserProfile() {
  const auth = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.isLoading) {
      return;
    }

    if (!auth.isAuthenticated) {
      setUserData(null);
      setProfileStatus("empty");
      setError(null);
      return;
    }

    let isMounted = true;
    setProfileStatus("loading");
    setError(null);

    getUserProfile()
      .then((profile) => {
        if (!isMounted) {
          return;
        }

        if (profile) {
          setUserData(profile);
          setProfileStatus("ready");
          return;
        }

        setUserData(null);
        setProfileStatus("empty");
      })
      .catch((err: unknown) => {
        if (!isMounted) {
          return;
        }

        setUserData(null);
        setProfileStatus("error");
        setError(err instanceof Error ? err.message : "Profil yüklenemedi.");
      });

    return () => {
      isMounted = false;
    };
  }, [auth.isAuthenticated, auth.isLoading, auth.userId]);

  const isLoading = profileStatus === "loading" || auth.isLoading;

  return {
    user: auth.user,
    userData,
    profileStatus,
    isLoading,
    isAuthenticated: auth.isAuthenticated,
    isDevBypass: false,
    error,
    refreshProfile: async () => {
      if (!auth.isAuthenticated) {
        setUserData(null);
        setProfileStatus("empty");
        return null;
      }

      try {
        const profile = await getUserProfile();
        setUserData(profile);
        setProfileStatus(profile ? "ready" : "empty");
        setError(null);
        return profile;
      } catch (err) {
        setUserData(null);
        setProfileStatus("error");
        setError(err instanceof Error ? err.message : "Profil yüklenemedi.");
        return null;
      }
    },
  };
}
