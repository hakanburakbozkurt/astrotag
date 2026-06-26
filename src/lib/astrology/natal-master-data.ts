import { Body, Ecliptic, GeoVector, MakeTime } from "astronomy-engine";
import type { MinorPointId, MinorPointPosition } from "./types";
import { buildPlanetDisplayFields } from "./planet-positions";
import { planetHouse } from "./ascendant";
import { normalizeLongitude } from "./zodiac";

const MINOR_POINT_META: Array<{
  id: MinorPointId;
  name: string;
  symbol: string;
  category: MinorPointPosition["category"];
  body?: Body;
}> = [
  { id: "uranus", name: "Uranüs", symbol: "♅", category: "outer", body: Body.Uranus },
  { id: "neptune", name: "Neptün", symbol: "♆", category: "outer", body: Body.Neptune },
  { id: "pluto", name: "Plüton", symbol: "♇", category: "outer", body: Body.Pluto },
  { id: "north_node", name: "Kuzey Düğüm", symbol: "☊", category: "node" },
  { id: "lilith", name: "Lilith", symbol: "⚸", category: "asteroid" },
];

function minorBodyLongitude(id: MinorPointId, date: Date): number {
  if (id === "north_node") {
    return meanNorthNodeLongitude(date);
  }

  if (id === "lilith") {
    return meanLilithLongitude(date);
  }

  const meta = MINOR_POINT_META.find((point) => point.id === id);
  if (!meta?.body) {
    throw new Error(`Unknown minor point: ${id}`);
  }

  const vector = GeoVector(meta.body, date, false);
  return normalizeLongitude(Ecliptic(vector).elon);
}

/** Mean North Node (tropical) — astronomy-engine tabanlı Julian dönüşümü */
function meanNorthNodeLongitude(date: Date): number {
  const time = MakeTime(date);
  const T = time.ut / 36525;
  const omega =
    125.044555 -
    1934.13618 * T +
    0.0020708 * T * T +
    (T * T * T) / 450000;
  return normalizeLongitude(omega);
}

/** Mean Black Moon Lilith (tropical yaklaşım) */
function meanLilithLongitude(date: Date): number {
  const time = MakeTime(date);
  const T = time.ut / 36525;
  const lilith =
    83.353246 +
    4069.013711 * T -
    0.0103238 * T * T -
    (T * T * T) / 80053;
  return normalizeLongitude(lilith);
}

export function computeMinorPoints(
  date: Date,
  ascendantLongitude: number
): MinorPointPosition[] {
  return MINOR_POINT_META.map((meta) => {
    const longitude = minorBodyLongitude(meta.id, date);
    const house = planetHouse(longitude, ascendantLongitude);
    const display = buildPlanetDisplayFields(longitude, house);

    return {
      id: meta.id,
      name: meta.name,
      symbol: meta.symbol,
      longitude,
      category: meta.category,
      ...display,
    };
  });
}

export function formatDegreeMinutes(degreeInSign: number): string {
  const degrees = Math.floor(degreeInSign);
  const minutes = Math.round((degreeInSign - degrees) * 60);
  if (minutes >= 60) {
    return `${degrees + 1}°00'`;
  }
  return `${degrees}°${String(minutes).padStart(2, "0")}'`;
}
