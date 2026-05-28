"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  DEV_MOCK_PROFILE,
  getDevTestUserId,
  isDevAuthBypassActive,
} from "@/lib/dev-mode";
import { getUserProfile, LOGIN_PATH } from "@/lib/supabase-actions";
import type { UserData } from "@/types/user";

export { LOGIN_PATH };

export type ProfileStatus = "loading" | "ready" | "empty" | "error";

function createDevMockUser(): User {
  return {
    id: getDevTestUserId(),
    aud: "authenticated",
    role: "authenticated",
    email: "dev@test.local",
    email_confirmed_at: new Date().toISOString(),
    phone: "",
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: "dev", providers: ["dev"] },
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
  };
}

export function useAuth() {
  const [devBypass] = useState(() => isDevAuthBypassActive());
  const [user, setUser] = useState<User | null>(() =>
    devBypass ? createDevMockUser() : null
  );
  const [isLoading, setIsLoading] = useState(() => !devBypass);

  useEffect(() => {
    if (devBypass) {
      return;
    }

    let isMounted = true;

    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!isMounted) return;

      setUser(error ? null : (data.user ?? null));
      setIsLoading(false);
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [devBypass]);

  return {
    user,
    isLoading,
    isAuthenticated: devBypass || !!user,
    isDevBypass: devBypass,
    userId: user?.id ?? null,
  };
}

export function useRequireAuth(redirectTo: string = LOGIN_PATH) {
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (auth.isDevBypass) {
      return;
    }

    if (!auth.isLoading && !auth.user) {
      router.replace(redirectTo);
    }
  }, [auth.isDevBypass, auth.isLoading, auth.user, router, redirectTo]);

  return auth;
}

export function useUserProfile() {
  const auth = useAuth();
  const [userData, setUserData] = useState<UserData | null>(() =>
    auth.isDevBypass ? DEV_MOCK_PROFILE : null
  );
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>(() =>
    auth.isDevBypass ? "ready" : "loading"
  );
  const [error, setError] = useState<string | null>(null);
  const fetchAttemptedRef = useRef(auth.isDevBypass);

  useEffect(() => {
    if (auth.isDevBypass) {
      setUserData(DEV_MOCK_PROFILE);
      setProfileStatus("ready");
      setError(null);
      fetchAttemptedRef.current = true;
      return;
    }

    if (auth.isLoading) {
      return;
    }

    if (!auth.userId) {
      setUserData(null);
      setProfileStatus("empty");
      setError(null);
      return;
    }

    if (fetchAttemptedRef.current) {
      return;
    }

    fetchAttemptedRef.current = true;
    setProfileStatus("loading");
    setError(null);

    let isMounted = true;

    getUserProfile()
      .then((profile) => {
        if (!isMounted) return;

        if (profile) {
          setUserData(profile);
          setProfileStatus("ready");
          return;
        }

        setUserData(null);
        setProfileStatus("empty");
      })
      .catch((err: unknown) => {
        if (!isMounted) return;

        setUserData(null);
        setProfileStatus("error");
        setError(err instanceof Error ? err.message : "Profil yüklenemedi.");
      });

    return () => {
      isMounted = false;
    };
  }, [auth.isDevBypass, auth.isLoading, auth.userId]);

  const isLoading = profileStatus === "loading" || auth.isLoading;

  return {
    user: auth.user,
    userData,
    profileStatus,
    isLoading,
    isAuthenticated: auth.isAuthenticated,
    isDevBypass: auth.isDevBypass,
    error,
    refreshProfile: async () => {
      if (auth.isDevBypass) {
        setUserData(DEV_MOCK_PROFILE);
        setProfileStatus("ready");
        setError(null);
        return DEV_MOCK_PROFILE;
      }

      if (!auth.userId) {
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
