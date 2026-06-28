export interface StarPackageProduct {
  id: string;
  stars: number;
  priceLabel: string;
  title: string;
  description: string;
  featured?: boolean;
  badge?: string;
}

export const NFC_KEYCHAIN_PRODUCT = {
  id: "nfc-keychain",
  title: "AstroTag NFC Anahtarlık",
  description:
    "Telefonunuza yaklaştırın — profiliniz anında açılır. Fiziksel anahtarlık + dijital kozmik erişim.",
  priceLabel: "₺899",
  featured: true,
  badge: "En Çok Tercih Edilen",
} as const;

export const STAR_PACKAGE_CATALOG: StarPackageProduct[] = [
  {
    id: "stars-7",
    stars: 7,
    priceLabel: "₺49",
    title: "7 Yıldız",
    description: "Kısa bir Kozmik Profil veya birkaç Oracle sorusu için ideal başlangıç.",
  },
  {
    id: "stars-15",
    stars: 15,
    priceLabel: "₺89",
    title: "15 Yıldız",
    description: "Haftalık keşifler ve hafif analizler için dengeli paket.",
  },
  {
    id: "stars-30",
    stars: 30,
    priceLabel: "₺159",
    title: "30 Yıldız",
    description: "Derin analizler ve düzenli Oracle kullanımı için en popüler seçim.",
    featured: true,
    badge: "En Çok Tercih Edilen",
  },
  {
    id: "stars-50",
    stars: 50,
    priceLabel: "₺249",
    title: "50 Yıldız",
    description: "Bonds ve Kozmik Profil derinlik seviyeleri için geniş alan.",
  },
  {
    id: "stars-75",
    stars: 75,
    priceLabel: "₺349",
    title: "75 Yıldız",
    description: "Yoğun kullanıcılar için uzun soluklu kozmik yolculuk.",
  },
  {
    id: "stars-100",
    stars: 100,
    priceLabel: "₺449",
    title: "100 Yıldız",
    description: "Maksimum kapasiteye yakın — tüm modüllerde özgürlük.",
  },
  {
    id: "stars-150",
    stars: 150,
    priceLabel: "₺649",
    title: "150 Yıldız",
    description: "Premium stok — uzun dönem analiz ve paylaşım odaklı kullanım.",
    badge: "Premium",
  },
];

export const SALES_ORDERS_PATH = "/siparislerim";
export const SALES_EXPERT_LOGIN_PATH = "/nfc-login";
export const KOZMIK_BASLANGIC_PATH = "/kozmik-baslangic";

export function buildPurchaseSuccessUrl(productId: string): string {
  const params = new URLSearchParams({ product: productId, purchased: "1" });
  return `${KOZMIK_BASLANGIC_PATH}?${params.toString()}`;
}
