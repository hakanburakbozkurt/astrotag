import type { UserData } from "@/types/user";
import { STARTING_STAR_POINTS } from "@/lib/constants/cosmic";

export const DEV_MODE_LOGGED_IN_KEY = "dev_mode_logged_in";
export const DEV_TEST_USER_ID = "9b32b79a-d916-45d0-adba-99f9e3ffb35e";

export const DEV_MOCK_PROFILE: UserData = {
  name: "Dev Test",
  birthDate: "1990-01-01",
  birthTime: "12:00",
  birthPlace: "İstanbul, Türkiye",
  relationshipStatus: "İlişki Yok",
  starPoints: STARTING_STAR_POINTS,
  starPointsBonus: 0,
  referralCode: "REFASTRO-DEV001",
};

export function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === "true";
}

export function isDevAuthBypassActive(): boolean {
  if (!isDevMode() || typeof window === "undefined") {
    return false;
  }

  return localStorage.getItem(DEV_MODE_LOGGED_IN_KEY) === "true";
}

export function setDevModeLoggedIn(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(DEV_MODE_LOGGED_IN_KEY, "true");
}

export function getDevTestUserId(): string {
  return process.env.NEXT_PUBLIC_DEV_TEST_USER_ID ?? DEV_TEST_USER_ID;
}
