"use client";

import { create } from "zustand";
import type { UserData } from "@/types/user";

type SessionSnapshot = {
  authenticated: boolean;
  profileId: string | null;
  expiresAt: string | null;
};

type SessionStore = SessionSnapshot & {
  sessionChecked: boolean;
  userData: UserData | null;
  setSession: (session: SessionSnapshot) => void;
  setUserData: (userData: UserData | null) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionStore>((set) => ({
  sessionChecked: false,
  authenticated: false,
  profileId: null,
  expiresAt: null,
  userData: null,
  setSession: (session) =>
    set({
      ...session,
      sessionChecked: true,
    }),
  setUserData: (userData) => set({ userData }),
  clearSession: () =>
    set({
      sessionChecked: true,
      authenticated: false,
      profileId: null,
      expiresAt: null,
      userData: null,
    }),
}));
