import { longitudeToPoint } from "@/lib/astrology/chart-geometry";

/** Synastry-Focus: her iki tekerlek aynı ekliptik referans (radix ASC dönüşümü yok). */
export const SYNASTRY_FOCUS_ASCENDANT = 0;

export interface SynastryWheelLayout {
  centerX: number;
  centerY: number;
  radius: number;
  ascendant: number;
}

export const SYNASTRY_LEFT_WHEEL: SynastryWheelLayout = {
  centerX: 92,
  centerY: 118,
  radius: 72,
  ascendant: SYNASTRY_FOCUS_ASCENDANT,
};

export const SYNASTRY_RIGHT_WHEEL: SynastryWheelLayout = {
  centerX: 268,
  centerY: 118,
  radius: 72,
  ascendant: SYNASTRY_FOCUS_ASCENDANT,
};

export function synastryPlanetPoint(
  longitude: number,
  layout: SynastryWheelLayout = SYNASTRY_LEFT_WHEEL
) {
  return longitudeToPoint(
    longitude,
    layout.centerX,
    layout.centerY,
    layout.radius,
    layout.ascendant
  );
}

/** Sol/sağ tekerlek için normalize SVG transform — aynı ölçek matrisi. */
export function synastryWheelGroupTransform(layout: SynastryWheelLayout): string {
  return `translate(${layout.centerX} ${layout.centerY})`;
}

export function synastryLocalPlanetPoint(
  longitude: number,
  layout: SynastryWheelLayout
) {
  const absolute = longitudeToPoint(
    longitude,
    0,
    0,
    layout.radius,
    layout.ascendant
  );

  return absolute;
}
