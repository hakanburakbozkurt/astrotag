import { SiderealTime } from "astronomy-engine";
import type { AscendantInfo, HouseCusp } from "./types";
import { longitudeToSign, normalizeLongitude } from "./zodiac";

const OBLIQUITY_DEG = 23.4392911;

export function calculateAscendant(
  date: Date,
  latitude: number,
  longitude: number
): AscendantInfo {
  const gstDeg = SiderealTime(date) * 15;
  let lstDeg = (gstDeg + longitude) % 360;
  if (lstDeg < 0) lstDeg += 360;

  const obliquity = (OBLIQUITY_DEG * Math.PI) / 180;
  const latRad = (latitude * Math.PI) / 180;
  const lstRad = (lstDeg * Math.PI) / 180;

  const y = -Math.cos(lstRad);
  const x =
    Math.sin(lstRad) * Math.cos(obliquity) +
    Math.tan(latRad) * Math.sin(obliquity);

  let ascLon = (Math.atan2(y, x) * 180) / Math.PI;
  ascLon = normalizeLongitude(ascLon);

  return {
    longitude: ascLon,
    ...longitudeToSign(ascLon),
  };
}

export function calculateEqualHouses(ascendant: AscendantInfo): HouseCusp[] {
  return Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const longitude = normalizeLongitude(ascendant.longitude + index * 30);
    const sign = longitudeToSign(longitude);

    return {
      house,
      longitude,
      signName: sign.signName,
      label: `${house}. Ev — ${sign.label}`,
    };
  });
}

export function planetHouse(longitude: number, ascendant: number): number {
  const diff = normalizeLongitude(longitude - ascendant);
  return Math.floor(diff / 30) + 1;
}
