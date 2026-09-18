export type ManifestoCardDensity ="default" |"compact" |"dense";

export function resolveManifestoCardDensity(
 headline: string | null | undefined,
 bodyText: string | null | undefined,
 includeBody: boolean
): ManifestoCardDensity {
 const headlineChars = headline?.length ?? 0;
 const bodyChars =
 includeBody && bodyText ? bodyText.length : 0;
 const totalChars = headlineChars + bodyChars;

 if (totalChars > 320) {
 return"dense";
 }

 if (totalChars > 175) {
 return"compact";
 }

 return"default";
}

export function manifestoCardDensityClass(
 density: ManifestoCardDensity
): string {
 if (density ==="dense") {
 return"universe-tarot-card-body--dense";
 }

 if (density ==="compact") {
 return"universe-tarot-card-body--compact";
 }

 return"";
}
