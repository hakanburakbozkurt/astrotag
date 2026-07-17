/** Lüks vitrin — tek geçerli kaynak: public/image_485027.png */
export const LUXURY_SHOWCASE_IMAGE_FILE = "image_485027.png";
/** public/ kökü (anasayfa hero + paket kartları) */
export const LUXURY_SHOWCASE_IMAGE_DIR = "";
export const LUXURY_SHOWCASE_IMAGE_VERSION = "5";

/** Orijinal kare vitrin görseli — bozulmasız yerleşim için 1:1 */
export const LUXURY_SHOWCASE_ASPECT_RATIO = 1;

export function getLuxuryShowcaseImagePath(
  version = LUXURY_SHOWCASE_IMAGE_VERSION
): string {
  return `/${LUXURY_SHOWCASE_IMAGE_FILE}?v=${version}`;
}

export const LUXURY_SHOWCASE_IMAGE_PATH = getLuxuryShowcaseImagePath();

/** manifest / PWA ikonları ile aynı dosya */
export const LUXURY_SHOWCASE_IMAGE_PUBLIC_PATH = `/${LUXURY_SHOWCASE_IMAGE_FILE}`;
