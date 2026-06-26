import { zodiacDegreeToPoint } from "./chart-alignment";

export {
  CHART_ASC_SCREEN_DEGREES,
  ENGINE_TO_CHART_OFFSET,
  engineDegreeToChartAngle,
  toChartLongitude,
  wheelRotationCssDegrees,
  zodiacDegreeToMarkerPercent,
  zodiacDegreeToPoint,
  validateAscendantScreenAlignment,
} from "./chart-alignment";

/** ASC sol tarafta olacak şekilde harita açısına çevirir. */
export function longitudeToPoint(
  longitude: number,
  centerX: number,
  centerY: number,
  radius: number,
  ascendant = 0
) {
  return zodiacDegreeToPoint(longitude, ascendant, centerX, centerY, radius);
}
