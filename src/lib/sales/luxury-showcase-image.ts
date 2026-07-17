/** Lüks vitrin — tek geçerli kaynak: public/image_485027.png */
export const LUXURY_SHOWCASE_IMAGE_FILE = "image_485027.png";
export const LUXURY_SHOWCASE_IMAGE_VERSION = "6";

/** Orijinal banner boyutu (yatay vitrin — burç koleksiyonu + marka) */
export const LUXURY_SHOWCASE_WIDTH = 1584;
export const LUXURY_SHOWCASE_HEIGHT = 672;
export const LUXURY_SHOWCASE_ASPECT_RATIO = `${LUXURY_SHOWCASE_WIDTH} / ${LUXURY_SHOWCASE_HEIGHT}`;

/** Kart grid — kare kırpım; görselin sol tarafı (anahtarlıklar) */
export const LUXURY_SHOWCASE_CARD_ASPECT_RATIO = "1 / 1";

export function getLuxuryShowcaseImagePath(
  version = LUXURY_SHOWCASE_IMAGE_VERSION
): string {
  return `/${LUXURY_SHOWCASE_IMAGE_FILE}?v=${version}`;
}

export const LUXURY_SHOWCASE_IMAGE_PATH = getLuxuryShowcaseImagePath();

export const LUXURY_SHOWCASE_IMAGE_PUBLIC_PATH = `/${LUXURY_SHOWCASE_IMAGE_FILE}`;

/** Hero: sol taraftaki ürün vitrini; sağdaki gömülü yazı HTML metniyle çakışmasın */
export const LUXURY_SHOWCASE_HERO_IMAGE_CLASS =
  "object-cover object-left sm:object-[18%_center]";

/** Paket kartları: koleksiyon odaklı sıkı kırpım */
export const LUXURY_SHOWCASE_CARD_IMAGE_CLASS =
  "object-cover object-[22%_center]";

/** Dijital yıldız paketleri */
export const STAR_PACKAGE_IMAGE_PATH = "/assets/sales/star-digital.svg";
export const STAR_PACKAGE_IMAGE_CLASS = "object-contain object-center p-3 sm:p-4";
