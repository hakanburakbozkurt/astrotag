import { ZODIAC_SIGNS } from "@/lib/astrology/zodiac";

export { LUXURY_SHOWCASE_IMAGE_PATH } from "@/lib/sales/luxury-showcase-image";

export interface KeychainBundleProduct {
  id: string;
  quantity: number;
  priceTry: number;
  priceLabel: string;
  giftStars: number;
  freeShipping: boolean;
  shippingNote: string;
  title: string;
  description: string;
  vip?: boolean;
  badge?: string;
}

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

export interface GiftOrderDetails {
  recipientName: string;
  note: string;
}

export const SALES_CTA_LABEL = "Sipariş Ver";
export const SALES_GIFT_CTA_LABEL = "Hediye Et";

export const ZODIAC_SIGN_OPTIONS = [...ZODIAC_SIGNS];

/** 100 yıldıza kadar sabit birim fiyat */
export const STAR_UNIT_PRICE_BASE_TRY = 1.8;
/** 2500 yıldızda ulaşılan minimum birim fiyat */
export const STAR_UNIT_PRICE_MIN_TRY = 1.4;
export const STAR_BULK_DISCOUNT_START = 100;
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

const KEYCHAIN_BUNDLE_TIERS = [
  {
    id: "keychain-1",
    quantity: 1,
    priceTry: 599,
    giftStars: 50,
    freeShipping: false,
    title: "Tekli Kozmik Anahtar",
    description: "İlk AstroTag deneyimi — kişisel NFC profilinizle tanışın.",
  },
  {
    id: "keychain-2",
    quantity: 2,
    priceTry: 960,
    giftStars: 150,
    freeShipping: true,
    title: "İkili Yıldız Seti",
    description: "Sevdiklerinizle paylaşın — çift profil, çift kozmik erişim.",
  },
  {
    id: "keychain-3",
    quantity: 3,
    priceTry: 1350,
    giftStars: 300,
    freeShipping: true,
    title: "Üçlü Galaksi Paketi",
    description: "Aile veya arkadaş grubu için ideal — üç ayrı burç kişiselleştirmesi.",
    badge: "En Çok Tercih Edilen",
  },
  {
    id: "keychain-4",
    quantity: 4,
    priceTry: 1680,
    giftStars: 500,
    freeShipping: true,
    title: "Dörtlü Kozmik Koleksiyon",
    description: "Geniş hediye listesi ve paylaşımlı kozmik erişim için premium set.",
  },
  {
    id: "keychain-6",
    quantity: 6,
    priceTry: 2160,
    giftStars: 1000,
    freeShipping: true,
    title: "Altılı VIP Koleksiyon",
    description: "En yüksek hediye yıldız bonusu — lüks vitrinin zirve seçimi.",
    vip: true,
    badge: "VIP SEÇİM",
  },
] as const;

function buildKeychainBundle(
  tier: (typeof KEYCHAIN_BUNDLE_TIERS)[number]
): KeychainBundleProduct {
  return {
    id: tier.id,
    quantity: tier.quantity,
    priceTry: tier.priceTry,
    priceLabel: formatTryPrice(tier.priceTry),
    giftStars: tier.giftStars,
    freeShipping: tier.freeShipping,
    shippingNote: tier.freeShipping
      ? "ÜCRETSİZ KARGO"
      : "Kargo ücreti hesaplanacaktır",
    title: tier.title,
    description: tier.description,
    vip: "vip" in tier ? tier.vip : undefined,
    badge: "badge" in tier ? tier.badge : undefined,
  };
}

export const KEYCHAIN_BUNDLE_CATALOG: KeychainBundleProduct[] =
  KEYCHAIN_BUNDLE_TIERS.map(buildKeychainBundle);

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
  priceLabel: formatTryPrice(599),
  featured: true,
  badge: "Lüks Vitrin",
} as const;

export const STAR_PACKAGE_CATALOG: StarPackageProduct[] =
  STAR_PACKAGE_TIERS.map(buildStarPackage);

export const SALES_ORDERS_PATH = "/siparislerim";
export const SALES_EXPERT_LOGIN_PATH = "/nfc-login";
export const KOZMIK_BASLANGIC_PATH = "/kozmik-baslangic";

export const SALES_ONLY_PATHS = new Set<string>([
  "/",
  KOZMIK_BASLANGIC_PATH,
  SALES_ORDERS_PATH,
]);

export interface PurchaseOptions {
  zodiacSigns?: string[];
  gift?: GiftOrderDetails;
}

export function buildPurchaseSuccessUrl(
  productId: string,
  options?: PurchaseOptions
): string {
  const params = new URLSearchParams({ product: productId, purchased: "1" });

  if (options?.zodiacSigns?.length) {
    params.set("signs", options.zodiacSigns.join(","));
  }

  if (options?.gift?.recipientName.trim()) {
    params.set("gift", "1");
    params.set("giftTo", options.gift.recipientName.trim());
    if (options.gift.note.trim()) {
      params.set("giftNote", options.gift.note.trim());
    }
  }

  return `${KOZMIK_BASLANGIC_PATH}?${params.toString()}`;
}

export function findKeychainBundle(productId: string): KeychainBundleProduct | undefined {
  return KEYCHAIN_BUNDLE_CATALOG.find((item) => item.id === productId);
}

export function createEmptyZodiacSelections(quantity: number): string[] {
  return Array.from({ length: quantity }, () => "");
}
