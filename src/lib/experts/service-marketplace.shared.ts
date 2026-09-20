/** Profilden otomatik doldurulan hizmet talebi bağlamı */
export type ServiceRequestContext = {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  relationshipStatus: string;
  partnerName: string | null;
  partnerBirthDate: string | null;
  partnerBirthTime: string | null;
  partnerBirthPlace: string | null;
};

export type ServicePurchaseCommissionPreview = {
  totalCrystals: number;
  grossTry: number;
  platformCommissionTry: number;
  expertPayoutTry: number;
  commissionRate: number;
};

export type ServicePurchasePreview = {
  expertProfileId: string;
  expertDisplayName: string;
  service: {
    id: string;
    name: string;
    description: string;
    crystalPrice: number;
    durationMinutes: number;
    imageUrl: string | null;
    categoryImageUrl: string | null;
    categoryTitle: string | null;
  };
  crystalBalance: number;
  profileContext: ServiceRequestContext;
  commission: ServicePurchaseCommissionPreview;
};
