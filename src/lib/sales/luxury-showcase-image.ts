/** Lüks vitrin — tek geçerli kaynak (public/assets/sales) */
export const LUXURY_SHOWCASE_IMAGE_FILE = "image_485027.png";
export const LUXURY_SHOWCASE_IMAGE_DIR = "/assets/sales";
export const LUXURY_SHOWCASE_IMAGE_VERSION = "4";

/** Orijinal kare vitrin görseli — bozulmasız yerleşim için 1:1 */
export const LUXURY_SHOWCASE_ASPECT_RATIO = 1;

export function getLuxuryShowcaseImagePath(version = LUXURY_SHOWCASE_IMAGE_VERSION): string {
  return `${LUXURY_SHOWCASE_IMAGE_DIR}/${LUXURY_SHOWCASE_IMAGE_FILE}?v=${version}`;
}

export const LUXURY_SHOWCASE_IMAGE_PATH = getLuxuryShowcaseImagePath();
