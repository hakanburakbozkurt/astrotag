export interface PublicNfcProfile {
  uniqueId: string;
  name: string;
  birthDate: string | null;
  birthTime: string | null;
  birthPlace: string | null;
  relationshipStatus: string | null;
  starPoints: number;
  hasOwner: boolean;
}
