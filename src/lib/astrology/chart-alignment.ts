import { normalizeLongitude } from "./zodiac";

/**
 * Engine ecliptic 0° (Koç başlangıcı) ile grafik ASC ekseni arasındaki sabit ilişki.
 * ASC çizgisi ekranda saat 9 yönünde (270°) sabitlenir.
 */
export const CHART_ASC_SCREEN_DEGREES = 270 as const;
export const CHART_VIEWBOX_SIZE = 360 as const;
export const CHART_GEOMETRIC_CENTER = CHART_VIEWBOX_SIZE / 2;

/** @deprecated CHART_ASC_SCREEN_DEGREES kullanın */
export const ENGINE_TO_CHART_OFFSET = CHART_ASC_SCREEN_DEGREES;

/**
 * Engine yükselen derecesi → SVG tekerlek rotasyonu.
 * Negatif derece = burçlar saat yönünün tersine (CCW) dizilir.
 */
export function wheelRotationCssDegrees(ascendantDegree: number): number {
  return normalizeLongitude(-ascendantDegree);
}

/** SVG rotate(angle, cx, cy) — viewBox merkezinde, CSS transform-origin kayması yok. */
export function wheelRotationSvgTransform(
  ascendantDegree: number,
  centerX: number,
  centerY: number
): string {
  const angle = wheelRotationCssDegrees(ascendantDegree);
  return `rotate(${angle}, ${centerX}, ${centerY})`;
}

/**
 * Engine zodiacDegree + ascendantDegree → grafik açısı (0–360).
 * Burçlar ASC'den saat yönünün tersine (CCW) artar.
 */
export function engineDegreeToChartAngle(
  zodiacDegree: number,
  ascendantDegree: number
): number {
  return normalizeLongitude(
    CHART_ASC_SCREEN_DEGREES + zodiacDegree - ascendantDegree
  );
}

/** Natal ve haftalık haritalar için ortak dönüşüm (geriye dönük uyumluluk). */
export function toChartLongitude(
  longitude: number,
  ascendant: number
): number {
  return engineDegreeToChartAngle(longitude, ascendant);
}

/**
 * Tekerlek yerel çerçevesinde (rotate öncesi) engine derecesi → polar açı θ (0–360).
 * Koç 0° ASC hattında (270°); burçlar CCW artar.
 */
export function engineDegreeToWheelLocalAngle(zodiacDegree: number): number {
  return normalizeLongitude(CHART_ASC_SCREEN_DEGREES + zodiacDegree);
}

/** Tekerlek rotate sonrası ekran açısı: θ_local − ascendantDegree. */
export function wheelLocalAngleToScreenAngle(
  wheelLocalAngle: number,
  ascendantDegree: number
): number {
  return normalizeLongitude(wheelLocalAngle - ascendantDegree);
}

export function engineDegreeToWheelLocalPolar(
  zodiacDegree: number,
  radius: number
): { r: number; thetaDegrees: number } {
  return {
    r: radius,
    thetaDegrees: engineDegreeToWheelLocalAngle(zodiacDegree),
  };
}

export function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  thetaDegrees: number
): { x: number; y: number } {
  const radians = ((90 - thetaDegrees) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY - radius * Math.sin(radians),
  };
}

/** Tekerlek child'ları için: rotate öncesi yerel (x, y). */
export function engineDegreeToWheelLocalPoint(
  zodiacDegree: number,
  centerX: number,
  centerY: number,
  radius: number
): { x: number; y: number } {
  const { thetaDegrees } = engineDegreeToWheelLocalPolar(zodiacDegree, radius);
  return polarToCartesian(centerX, centerY, radius, thetaDegrees);
}

export function zodiacDegreeToPoint(
  zodiacDegree: number,
  ascendantDegree: number,
  centerX: number,
  centerY: number,
  radius: number
): { x: number; y: number } {
  const chartAngle = engineDegreeToChartAngle(zodiacDegree, ascendantDegree);
  return polarToCartesian(centerX, centerY, radius, chartAngle);
}

export function zodiacDegreeToMarkerPercent(
  zodiacDegree: number,
  ascendantDegree: number,
  viewBoxSize: number,
  radius: number
): { leftPct: number; topPct: number } {
  const point = zodiacDegreeToPoint(
    zodiacDegree,
    ascendantDegree,
    viewBoxSize / 2,
    viewBoxSize / 2,
    radius
  );

  return {
    leftPct: (point.x / viewBoxSize) * 100,
    topPct: (point.y / viewBoxSize) * 100,
  };
}

/** ASC burcu 0°'sinin sarı ok (270°) ile kilitlendiğini doğrular (geliştirme). */
export function validateAscendantScreenAlignment(
  signLabel: string,
  ascendantDegree: number
): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const wheelRotate = wheelRotationCssDegrees(ascendantDegree);
  const ascLocal = engineDegreeToWheelLocalAngle(ascendantDegree);
  const ascScreen = wheelLocalAngleToScreenAngle(ascLocal, ascendantDegree);
  const chartAngle = engineDegreeToChartAngle(ascendantDegree, ascendantDegree);

  console.log(`[weekly-chart-align] ${signLabel} ASC kilidi`, {
    ascendantDegree,
    wheelRotationDegrees: wheelRotate,
    wheelRotationSvg: wheelRotationSvgTransform(
      ascendantDegree,
      CHART_GEOMETRIC_CENTER,
      CHART_GEOMETRIC_CENTER
    ),
    ascLocalAngle: ascLocal,
    ascScreenAngle: ascScreen,
    chartAngle,
    expectedScreenAngle: CHART_ASC_SCREEN_DEGREES,
    zodiacDirection: auditZodiacWheelDirection(),
    ascLocked:
      Math.abs(ascScreen - CHART_ASC_SCREEN_DEGREES) < 0.001 &&
      Math.abs(chartAngle - CHART_ASC_SCREEN_DEGREES) < 0.001,
  });
}

/** Koç→Boğa→İkizler diziliminin CCW olduğunu doğrular (asc=0 referans). */
export function auditZodiacWheelDirection(): "counter-clockwise" | "clockwise" {
  const aries = engineDegreeToWheelLocalAngle(0);
  const taurus = engineDegreeToWheelLocalAngle(30);
  const gemini = engineDegreeToWheelLocalAngle(60);

  const forward = normalizeLongitude(taurus - aries);
  const step = normalizeLongitude(gemini - taurus);

  return forward === step && forward === 30
    ? "counter-clockwise"
    : "clockwise";
}
