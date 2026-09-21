import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/service";

export type CrystalCheckoutBuyer = {
  profileId: string;
  authUserId: string | null;
  email: string;
  name: string;
  surname: string;
  gsmNumber: string;
  city: string;
  ip: string;
};

function splitDisplayName(fullName: string): { name: string; surname: string } {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { name: "AstroTag", surname: "Gezgin" };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { name: parts[0], surname: "Gezgin" };
  }

  return {
    name: parts[0],
    surname: parts.slice(1).join(" "),
  };
}

function normalizePhone(raw: string | null | undefined): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.startsWith("90") ? `+${digits}` : `+90${digits.slice(-10)}`;
  }
  return "+905555555555";
}

export async function loadCrystalCheckoutBuyer(
  profileId: string,
  clientIp = "127.0.0.1"
): Promise<CrystalCheckoutBuyer | null> {
  const admin = createServiceRoleClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, name, user_id, phone_number, birth_city, birth_place")
    .eq("id", profileId)
    .maybeSingle();

  if (error || !profile) {
    return null;
  }

  let email = `gezgin+${profileId.slice(0, 8)}@astrotag.local`;

  if (profile.user_id) {
    const { data: authData } = await admin.auth.admin.getUserById(profile.user_id);
    if (authData.user?.email?.trim()) {
      email = authData.user.email.trim();
    }
  }

  const { name, surname } = splitDisplayName(profile.name ?? "Gezgin");
  const city =
    profile.birth_city?.trim() ||
    profile.birth_place?.trim()?.split(",")[0]?.trim() ||
    "Istanbul";

  return {
    profileId: profile.id,
    authUserId: profile.user_id,
    email,
    name,
    surname,
    gsmNumber: normalizePhone(profile.phone_number),
    city,
    ip: clientIp,
  };
}
