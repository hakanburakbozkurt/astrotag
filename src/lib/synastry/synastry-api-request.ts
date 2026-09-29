import type { PartnerProfileInput, UserData } from "@/types/user";

export type SynastryPartnerBirthPayload = {
  name?: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
};

export type SynastryApiRequestBody = {
  /** Varsayılan: kullanıcı oturum profili + profildeki partner alanları */
  source?: "profile";
  /** Oturum profilindeki partner yerine gönderilen doğum verisi */
  partner?: SynastryPartnerBirthPayload;
};

function coerceString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parsePartnerPayload(raw: unknown): SynastryPartnerBirthPayload | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const row = raw as Record<string, unknown>;
  const birthDate = coerceString(row.birthDate);
  const birthTime = coerceString(row.birthTime);
  const birthPlace = coerceString(row.birthPlace);

  if (!birthDate || !birthTime || !birthPlace) {
    return null;
  }

  return {
    name: coerceString(row.name) || undefined,
    birthDate,
    birthTime,
    birthPlace,
  };
}

export function parseSynastryApiRequestBody(
  raw: unknown
): { ok: true; body: SynastryApiRequestBody } | { ok: false; error: string } {
  if (raw === null || raw === undefined) {
    return { ok: true, body: { source: "profile" } };
  }

  if (typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Geçersiz istek gövdesi." };
  }

  const row = raw as Record<string, unknown>;
  const sourceRaw = coerceString(row.source);

  if (sourceRaw && sourceRaw !== "profile") {
    return { ok: false, error: "Desteklenmeyen source değeri." };
  }

  if (row.partner === undefined) {
    return { ok: true, body: { source: "profile" } };
  }

  const partner = parsePartnerPayload(row.partner);
  if (!partner) {
    return {
      ok: false,
      error: "Partner doğum tarihi, saati ve yeri zorunludur.",
    };
  }

  return { ok: true, body: { source: "profile", partner } };
}

export function mergePartnerIntoUserData(
  profile: UserData,
  partner: PartnerProfileInput
): UserData {
  return {
    ...profile,
    partnerName: partner.partnerName,
    partnerBirthDate: partner.partnerBirthDate,
    partnerBirthTime: partner.partnerBirthTime,
    partnerBirthPlace: partner.partnerBirthPlace,
  };
}

export function partnerPayloadToInput(
  partner: SynastryPartnerBirthPayload
): PartnerProfileInput {
  return {
    partnerName: partner.name?.trim() || "Partner",
    partnerBirthDate: partner.birthDate,
    partnerBirthTime: partner.birthTime,
    partnerBirthPlace: partner.birthPlace,
  };
}
