"use client";

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { AuthSessionSnapshot } from "@/lib/auth/auth-service.types";

function toSnapshot(session: Session | null): AuthSessionSnapshot | null {
  if (!session?.user?.id) {
    return null;
  }

  return {
    authUserId: session.user.id,
    email: session.user.email?.trim().toLowerCase() ?? null,
    isAnonymous: session.user.is_anonymous === true,
    expiresAt: session.expires_at ?? null,
  };
}

export function getAuthServiceClient() {
  return createBrowserSupabaseClient();
}

export async function getClientAuthSession(): Promise<AuthSessionSnapshot | null> {
  const supabase = getAuthServiceClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("[getClientAuthSession]", error.message);
    return null;
  }

  return toSnapshot(data.session);
}

export function subscribeToAuthSessionChanges(
  onChange: (payload: {
    event: AuthChangeEvent;
    session: AuthSessionSnapshot | null;
  }) => void
): () => void {
  const supabase = getAuthServiceClient();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    onChange({ event, session: toSnapshot(session) });
  });

  return () => {
    subscription.unsubscribe();
  };
}
