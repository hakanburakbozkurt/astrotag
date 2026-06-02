"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  checkNfcSessionAction,
} from "@/lib/actions/nfc-auth";
import { getUserProfile } from "@/lib/supabase-actions";
import { SESSION_EXPIRED_PATH } from "@/lib/nfc/constants";
import type { UserData } from "@/types/user";

export { SESSION_EXPIRED_PATH as LOGIN_PATH };

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

export function useRequireAuth(redirectTo: string = SESSION_EXPIRED_PATH) {
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [auth.isAuthenticated, auth.isLoading, router, redirectTo]);

  useEffect(() => {
    if (!auth.expiresAt || auth.isLoading) {
      return;
    }

    const remainingMs = new Date(auth.expiresAt).getTime() - Date.now();

    if (remainingMs <= 0) {
      router.replace(SESSION_EXPIRED_PATH);
      return;
    }

    const timer = window.setTimeout(() => {
      router.replace(SESSION_EXPIRED_PATH);
    }, remainingMs);

    return () => window.clearTimeout(timer);
  }, [auth.expiresAt, auth.isLoading, router]);

  return auth;
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
