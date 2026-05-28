import type { Aspect, PlanetPosition } from "@/lib/astrology/types";
import { ASPECT_COLORS } from "@/lib/astrology/aspects";
import { longitudeToPoint } from "@/lib/astrology/chart-geometry";
import { resolvePlanetRadiusOffsets } from "@/lib/astrology/planet-offset";
import {
  CHART_CENTER,
  INNER_RADIUS,
  PLANET_RADIUS,
} from "./constants";

interface AspectLinesProps {
  planets: PlanetPosition[];
  aspects: Aspect[];
  ascendant: number;
}

export default function AspectLines({
  planets,
  aspects,
  ascendant,
}: AspectLinesProps) {
  const radiusOffsets = resolvePlanetRadiusOffsets(planets);
  const planetMap = new Map(planets.map((planet) => [planet.id, planet]));

  return (
    <g className="aspect-lines">
      {aspects.map((aspect) => {
        const planetA = planetMap.get(aspect.planetA);
        const planetB = planetMap.get(aspect.planetB);
        if (!planetA || !planetB) return null;

        const radiusA = PLANET_RADIUS + (radiusOffsets.get(planetA.id) ?? 0);
        const radiusB = PLANET_RADIUS + (radiusOffsets.get(planetB.id) ?? 0);

        const pointA = longitudeToPoint(
          planetA.longitude,
          CHART_CENTER,
          CHART_CENTER,
          radiusA,
          ascendant
        );
        const pointB = longitudeToPoint(
          planetB.longitude,
          CHART_CENTER,
          CHART_CENTER,
          radiusB,
          ascendant
        );

        return (
          <line
            key={aspect.id}
            x1={pointA.x}
            y1={pointA.y}
            x2={pointB.x}
            y2={pointB.y}
            stroke={ASPECT_COLORS[aspect.type]}
            strokeWidth={aspect.type === "conjunction" ? 1.4 : 1.1}
            strokeOpacity={0.85}
            strokeDasharray={aspect.type === "opposition" ? "4 3" : undefined}
          />
        );
      })}

      <circle
        cx={CHART_CENTER}
        cy={CHART_CENTER}
        r={INNER_RADIUS - 6}
        fill="none"
        stroke="rgba(255,255,255,0.04)"
        strokeWidth={1}
      />
    </g>
  );
}
