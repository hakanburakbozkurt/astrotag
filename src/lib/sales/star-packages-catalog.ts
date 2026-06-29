export interface StarPackageProduct {
  id: string;
  stars: number;
  priceTry: number;
  unitPriceTry: number;
  priceLabel: string;
  unitPriceLabel: string;
  title: string;
  description: string;
  featured?: boolean;
  spotlight?: boolean;
  badge?: string;
}

export const SALES_CTA_LABEL = "Sipariş Ver";

/** 100 yıldıza kadar sabit birim fiyat */
export const STAR_UNIT_PRICE_BASE_TRY = 1.8;
/** 2500 yıldızda ulaşılan minimum birim fiyat */
export const STAR_UNIT_PRICE_MIN_TRY = 1.4;
/** Toplu indirim bu miktardan itibaren başlar */
export const STAR_BULK_DISCOUNT_START = 100;
/** Minimum birim fiyatın geçerli olduğu üst paket */
export const STAR_BULK_DISCOUNT_END = 2500;

export function computeUnitPriceTry(stars: number): number {
  if (stars < STAR_BULK_DISCOUNT_START) {
    return STAR_UNIT_PRICE_BASE_TRY;
  }

  const span = STAR_BULK_DISCOUNT_END - STAR_BULK_DISCOUNT_START;
  const progress = Math.min(1, Math.max(0, (stars - STAR_BULK_DISCOUNT_START) / span));

  return (
    STAR_UNIT_PRICE_BASE_TRY -
    (STAR_UNIT_PRICE_BASE_TRY - STAR_UNIT_PRICE_MIN_TRY) * progress
  );
}

export function computePackagePriceTry(stars: number): number {
  return Math.round(stars * computeUnitPriceTry(stars));
}

export function formatTryPrice(amount: number): string {
  return `₺${amount.toLocaleString("tr-TR")}`;
}

export function formatUnitPriceTry(amount: number): string {
  return `₺${amount.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const STAR_PACKAGE_TIERS = [
  {
    id: "stars-15",
    stars: 15,
    title: "Toz Zerresi",
    description: "Kozmosa ilk adım — hafif okumalar ve keşifler için ideal başlangıç.",
  },
  {
    id: "stars-30",
    stars: 30,
    title: "Yıldız Taşlağı",
    description: "Düzenli kullanım için dengeli stok; haftalık ritminize uyum sağlar.",
    featured: true,
    badge: "En Çok Tercih Edilen",
  },
  {
    id: "stars-60",
    stars: 60,
    title: "Işık Kıvılcımı",
    description: "Derinleşen yolculuklar için genişleyen kozmik kapasite.",
  },
  {
    id: "stars-100",
    stars: 100,
    title: "Kozmik Küme",
    description: "100 yıldız eşiğinde birim fiyat avantajı devreye girer.",
    badge: "Toplu Avantaj",
  },
  {
    id: "stars-250",
    stars: 250,
    title: "Galaksi Yığını",
    description: "Yoğun analiz ve paylaşım döngüleri için güçlü stok.",
  },
  {
    id: "stars-750",
    stars: 750,
    title: "Süpernova",
    description: "Uzun vadeli kozmik yolculuk — maksimum esneklik ve derinlik.",
  },
  {
    id: "stars-2500",
    stars: 2500,
    title: "Evrenin Hakimi",
    description: "Platformun zirve paketi — sınırsıza yakın kozmik egemenlik.",
    spotlight: true,
    badge: "Zirve Paket",
  },
] as const;

function buildStarPackage(tier: (typeof STAR_PACKAGE_TIERS)[number]): StarPackageProduct {
  const unitPriceTry = computeUnitPriceTry(tier.stars);
  const priceTry = computePackagePriceTry(tier.stars);

  return {
    id: tier.id,
    stars: tier.stars,
    priceTry,
    unitPriceTry,
    priceLabel: formatTryPrice(priceTry),
    unitPriceLabel: `${formatUnitPriceTry(unitPriceTry)} / yıldız`,
    title: tier.title,
    description: tier.description,
    featured: "featured" in tier ? tier.featured : undefined,
    spotlight: "spotlight" in tier ? tier.spotlight : undefined,
    badge: "badge" in tier ? tier.badge : undefined,
  };
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

export const STAR_PACKAGE_CATALOG: StarPackageProduct[] =
  STAR_PACKAGE_TIERS.map(buildStarPackage);

export const SALES_ORDERS_PATH = "/siparislerim";
export const SALES_EXPERT_LOGIN_PATH = "/nfc-login";
export const KOZMIK_BASLANGIC_PATH = "/kozmik-baslangic";

/** Ana sayfa + satış sonrası rotalar — toast / güvenlik bootstrap atlanır */
export const SALES_ONLY_PATHS = new Set<string>([
  "/",
  KOZMIK_BASLANGIC_PATH,
  SALES_ORDERS_PATH,
]);

export function buildPurchaseSuccessUrl(productId: string): string {
  const params = new URLSearchParams({ product: productId, purchased: "1" });
  return `${KOZMIK_BASLANGIC_PATH}?${params.toString()}`;
}
