import type { PlanetId, PlanetPosition } from "./types";
import { normalizeLongitude } from "./zodiac";

const MIN_SEPARATION_DEG = 8;
const RADIAL_STEP = 11;

function angularDistance(a: number, b: number): number {
  const diff = Math.abs(normalizeLongitude(a) - normalizeLongitude(b));
  return Math.min(diff, 360 - diff);
}

function buildClusters(planets: PlanetPosition[]): PlanetPosition[][] {
  if (planets.length === 0) return [];

  const sorted = [...planets].sort((a, b) => a.longitude - b.longitude);
  const clusters: PlanetPosition[][] = [];
  let current: PlanetPosition[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const next = sorted[i];
    if (angularDistance(prev.longitude, next.longitude) <= MIN_SEPARATION_DEG) {
      current.push(next);
    } else {
      clusters.push(current);
      current = [next];
    }
  }
  clusters.push(current);

  if (clusters.length > 1) {
    const firstCluster = clusters[0];
    const lastCluster = clusters[clusters.length - 1];
    const wrapDistance = angularDistance(
      lastCluster[lastCluster.length - 1].longitude,
      firstCluster[0].longitude
    );

    if (wrapDistance <= MIN_SEPARATION_DEG) {
      clusters[0] = [...lastCluster, ...firstCluster];
      clusters.pop();
    }
  }

  return clusters;
}

/** Çakışan gezegen ikonlarını halka yarıçapında alternatif offset ile ayırır. */
export function resolvePlanetRadiusOffsets(
  planets: PlanetPosition[]
): Map<PlanetId, number> {
  const offsets = new Map<PlanetId, number>();
  planets.forEach((planet) => offsets.set(planet.id, 0));

  for (const cluster of buildClusters(planets)) {
    if (cluster.length <= 1) continue;

    cluster.forEach((planet, index) => {
      if (index === 0) {
        offsets.set(planet.id, 0);
        return;
      }

      const tier = Math.ceil(index / 2);
      const direction = index % 2 === 0 ? 1 : -1;
      offsets.set(planet.id, direction * tier * RADIAL_STEP);
    });
  }

  return offsets;
}
