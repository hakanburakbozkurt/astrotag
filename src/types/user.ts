export interface UserData {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  relationshipStatus: string;
  starPoints: number;
  starPointsBonus: number;
  referralCode?: string | null;
  partnerName?: string | null;
  partnerBirthDate?: string | null;
  partnerBirthTime?: string | null;
  partnerBirthPlace?: string | null;
  partnerMeetingDate?: string | null;
}

/** @deprecated Use starPoints */
export type UserDataLegacy = UserData & {
  cosmicEnergy: number;
  energyBonus: number;
};

export function hasPartnerData(user: UserData): boolean {
  return Boolean(
    user.partnerName?.trim() &&
      user.partnerBirthDate?.trim() &&
      user.partnerBirthTime?.trim() &&
      user.partnerBirthPlace?.trim()
  );
}

export function userDataToChartContext(user: UserData) {
  return {
    name: user.name,
    birthDate: user.birthDate,
    birthTime: user.birthTime,
    birthPlace: user.birthPlace,
    relationshipStatus: user.relationshipStatus,
  };
}

export interface PartnerProfileInput {
  partnerName: string;
  partnerBirthDate: string;
  partnerBirthTime: string;
  partnerBirthPlace: string;
}

export interface BondAdditionalInput {
  relationshipStatus: string;
  partnerMeetingDate: string;
}
