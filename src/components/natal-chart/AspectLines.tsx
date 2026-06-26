import type { Aspect, ChartBodyId } from "@/lib/astrology/types";
import { EXTENDED_ASPECT_COLORS } from "@/lib/astrology/natal-extended-aspects";
import { ASPECT_COLORS } from "@/lib/astrology/aspects";
import { longitudeToPoint } from "@/lib/astrology/chart-geometry";
import {
  CHART_CENTER,
  INNER_RADIUS,
  MASTER_BODY_RADIUS,
  PLANET_RADIUS,
} from "./constants";

interface ChartBody {
  id: ChartBodyId;
  longitude: number;
}

interface AspectLinesProps {
  bodies: ChartBody[];
  aspects: Aspect[];
  ascendant: number;
  radiusOffsets?: Map<ChartBodyId, number>;
  useExtendedColors?: boolean;
}

function bodyRadius(id: ChartBodyId, offset: number, isMinorBody: boolean): number {
  const base = isMinorBody ? MASTER_BODY_RADIUS : PLANET_RADIUS;
  return base + offset;
}

function isMinorBodyId(id: ChartBodyId): boolean {
  return (
    id === "uranus" ||
    id === "neptune" ||
    id === "pluto" ||
    id === "north_node" ||
    id === "lilith"
  );
}

export default function AspectLines({
  bodies,
  aspects,
  ascendant,
  radiusOffsets = new Map(),
  useExtendedColors = false,
}: AspectLinesProps) {
  const bodyMap = new Map(bodies.map((body) => [body.id, body]));

  return (
    <g className="aspect-lines">
      {aspects.map((aspect) => {
        const bodyA = bodyMap.get(aspect.planetA);
        const bodyB = bodyMap.get(aspect.planetB);
        if (!bodyA || !bodyB) return null;

        const radiusA = bodyRadius(
          bodyA.id,
          radiusOffsets.get(bodyA.id) ?? 0,
          isMinorBodyId(bodyA.id)
        );
        const radiusB = bodyRadius(
          bodyB.id,
          radiusOffsets.get(bodyB.id) ?? 0,
          isMinorBodyId(bodyB.id)
        );

        const pointA = longitudeToPoint(
          bodyA.longitude,
          CHART_CENTER,
          CHART_CENTER,
          radiusA,
          ascendant
        );
        const pointB = longitudeToPoint(
          bodyB.longitude,
          CHART_CENTER,
          CHART_CENTER,
          radiusB,
          ascendant
        );

        const stroke =
          useExtendedColors || aspect.isMinor
            ? EXTENDED_ASPECT_COLORS[aspect.type]
            : ASPECT_COLORS[aspect.type as keyof typeof ASPECT_COLORS];

        return (
          <line
            key={aspect.id}
            x1={pointA.x}
            y1={pointA.y}
            x2={pointB.x}
            y2={pointB.y}
            stroke={stroke}
            strokeWidth={
              aspect.isMinor ? 0.85 : aspect.type === "conjunction" ? 1.4 : 1.1
            }
            strokeOpacity={aspect.isMinor ? 0.55 : 0.85}
            strokeDasharray={
              aspect.type === "opposition"
                ? "4 3"
                : aspect.type === "quincunx"
                  ? "2 4"
                  : aspect.type === "sextile"
                    ? "1 3"
                    : undefined
            }
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
