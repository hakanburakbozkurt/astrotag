"use client";

import { useEffect } from "react";
import { subscribeToAuthSessionChanges } from "@/lib/auth/auth-service.client";

/**
 * Supabase Auth oturum dinleyicisi — silent refresh (TOKEN_REFRESHED) ve çıkış.
 */
export default function AuthSessionBootstrap() {
  useEffect(() => {
    return subscribeToAuthSessionChanges(({ event }) => {
      if (process.env.NODE_ENV === "development") {
        if (event === "TOKEN_REFRESHED") {
          console.debug("[AuthSessionBootstrap] access token yenilendi");
        }
        if (event === "SIGNED_OUT") {
          console.debug("[AuthSessionBootstrap] oturum sonlandı");
        }
      }
    });
  }, []);

  return null;
}
