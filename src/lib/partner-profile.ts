import type { BondAdditionalInput, PartnerProfileInput, UserData } from "@/types/user";

export interface PartnerFormValues {
  partnerName: string;
  partnerBirthDate: string;
  partnerBirthTime: string;
  partnerBirthPlace: string;
}

export interface BondAdditionalFormValues {
  relationshipStatus: string;
  partnerMeetingDate: string;
}

export const BOND_RELATIONSHIP_OPTIONS = [
  "Flört",
  "İlişkisi Var",
  "Nişanlı",
  "Evli",
  "Karmaşık / Belirsiz",
] as const;

type PartnerRow = {
  partner_name?: string | null;
  partner_birth_date?: string | null;
  partner_birth_time?: string | null;
  partner_birth_place?: string | null;
  relationship_status?: string | null;
  partner_meeting_date?: string | null;
};

export function emptyBondAdditionalForm(): BondAdditionalFormValues {
  return {
    relationshipStatus: "İlişkisi Var",
    partnerMeetingDate: "",
  };
}

export function bondAdditionalFromUserData(user: UserData): BondAdditionalFormValues {
  return {
    relationshipStatus: user.relationshipStatus?.trim() || "İlişkisi Var",
    partnerMeetingDate: normalizeDateForInput(user.partnerMeetingDate),
  };
}

export function bondAdditionalToInput(
  form: BondAdditionalFormValues
): BondAdditionalInput {
  return {
    relationshipStatus: form.relationshipStatus.trim(),
    partnerMeetingDate: form.partnerMeetingDate,
  };
}

export function emptyPartnerForm(): PartnerFormValues {
  return {
    partnerName: "",
    partnerBirthDate: "",
    partnerBirthTime: "",
    partnerBirthPlace: "",
  };
}

export function normalizeDateForInput(value: string | null | undefined): string {
  if (!value?.trim()) {
    return "";
  }

  return value.trim().split("T")[0]?.slice(0, 10) ?? "";
}

export function normalizeTimeForInput(value: string | null | undefined): string {
  if (!value?.trim()) {
    return "";
  }

  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) {
    return "";
  }

  const hours = match[1].padStart(2, "0");
  return `${hours}:${match[2]}`;
}

export function partnerFormFromRow(row: PartnerRow | null | undefined): PartnerFormValues {
  if (!row) {
    return emptyPartnerForm();
  }

  return {
    partnerName: row.partner_name?.trim() ?? "",
    partnerBirthDate: normalizeDateForInput(row.partner_birth_date),
    partnerBirthTime: normalizeTimeForInput(row.partner_birth_time),
    partnerBirthPlace: row.partner_birth_place?.trim() ?? "",
  };
}

export function partnerFormFromUserData(user: UserData): PartnerFormValues {
  return {
    partnerName: user.partnerName?.trim() ?? "",
    partnerBirthDate: normalizeDateForInput(user.partnerBirthDate),
    partnerBirthTime: normalizeTimeForInput(user.partnerBirthTime),
    partnerBirthPlace: user.partnerBirthPlace?.trim() ?? "",
  };
}

export function partnerFormToInput(form: PartnerFormValues): PartnerProfileInput {
  return {
    partnerName: form.partnerName.trim(),
    partnerBirthDate: form.partnerBirthDate,
    partnerBirthTime: form.partnerBirthTime,
    partnerBirthPlace: form.partnerBirthPlace.trim(),
  };
}

export function hasPartnerFormData(form: PartnerFormValues): boolean {
  return Boolean(
    form.partnerName.trim() &&
      form.partnerBirthDate.trim() &&
      form.partnerBirthTime.trim() &&
      form.partnerBirthPlace.trim()
  );
}
