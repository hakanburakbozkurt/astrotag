import { normalizeLongitude } from "./zodiac";

/** ASC sol tarafta olacak şekilde harita açısına çevirir. */
export function toChartLongitude(
  longitude: number,
  ascendant: number
): number {
  return normalizeLongitude(270 - (longitude - ascendant));
}

export function longitudeToPoint(
  longitude: number,
  centerX: number,
  centerY: number,
  radius: number,
  ascendant = 0
) {
  const chartLongitude = toChartLongitude(longitude, ascendant);
  const radians = ((90 - chartLongitude) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY - radius * Math.sin(radians),
  };
}
