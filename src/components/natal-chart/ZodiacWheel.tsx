import { ZODIAC_SIGNS, signMidpointLongitude } from "@/lib/astrology/zodiac";
import { toChartLongitude } from "@/lib/astrology/chart-geometry";
import {
  ASC_MARKER_OFFSET,
  CHART_CENTER,
  INNER_RADIUS,
  OUTER_RADIUS,
} from "./constants";

interface ZodiacWheelProps {
  ascendant: number;
}

export default function ZodiacWheel({ ascendant }: ZodiacWheelProps) {
  const signTicks = ZODIAC_SIGNS.map((sign, index) => {
    const cuspLongitude = index * 30;
    const labelLongitude = signMidpointLongitude(index);
    const cuspChart = toChartLongitude(cuspLongitude, ascendant);
    const labelChart = toChartLongitude(labelLongitude, ascendant);
    const cuspRadians = ((90 - cuspChart) * Math.PI) / 180;
    const labelRadians = ((90 - labelChart) * Math.PI) / 180;
    const x1 = CHART_CENTER + INNER_RADIUS * Math.cos(cuspRadians);
    const y1 = CHART_CENTER - INNER_RADIUS * Math.sin(cuspRadians);
    const x2 = CHART_CENTER + OUTER_RADIUS * Math.cos(cuspRadians);
    const y2 = CHART_CENTER - OUTER_RADIUS * Math.sin(cuspRadians);
    const labelRadius = OUTER_RADIUS + 12;
    const labelX = CHART_CENTER + labelRadius * Math.cos(labelRadians);
    const labelY = CHART_CENTER - labelRadius * Math.sin(labelRadians);

    return { sign, x1, y1, x2, y2, labelX, labelY };
  });

  const ascLeft = CHART_CENTER - OUTER_RADIUS - ASC_MARKER_OFFSET;
  const ascArrowTip = CHART_CENTER - OUTER_RADIUS + 8;

  return (
    <g>
      <circle
        cx={CHART_CENTER}
        cy={CHART_CENTER}
        r={OUTER_RADIUS}
        fill="none"
        stroke="rgba(251,191,36,0.35)"
        strokeWidth={1.5}
      />
      <circle
        cx={CHART_CENTER}
        cy={CHART_CENTER}
        r={INNER_RADIUS}
        fill="rgba(15,23,42,0.55)"
        stroke="rgba(251,191,36,0.2)"
        strokeWidth={1}
      />
      <circle
        cx={CHART_CENTER}
        cy={CHART_CENTER}
        r={4}
        fill="rgba(251,191,36,0.85)"
      />

      <line
        x1={ascLeft}
        y1={CHART_CENTER}
        x2={CHART_CENTER + OUTER_RADIUS}
        y2={CHART_CENTER}
        stroke="rgba(251,191,36,0.55)"
        strokeWidth={1.25}
        strokeDasharray="5 4"
      />

      <g aria-label="Yükselen burç">
        <polygon
          points={`${ascLeft},${CHART_CENTER} ${ascArrowTip},${CHART_CENTER - 7} ${ascArrowTip},${CHART_CENTER + 7}`}
          fill="rgba(251,191,36,0.95)"
        />
        <text
          x={ascLeft - 6}
          y={CHART_CENTER - 10}
          textAnchor="end"
          className="fill-amber-300 text-[11px] font-bold tracking-[0.2em]"
        >
          ASC
        </text>
      </g>

      {Array.from({ length: 12 }).map((_, index) => {
        const longitude = index * 30;
        const chartLongitude = toChartLongitude(longitude, ascendant);
        const radians = ((90 - chartLongitude) * Math.PI) / 180;
        const x = CHART_CENTER + OUTER_RADIUS * Math.cos(radians);
        const y = CHART_CENTER - OUTER_RADIUS * Math.sin(radians);
        return (
          <line
            key={`degree-${index}`}
            x1={CHART_CENTER}
            y1={CHART_CENTER}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        );
      })}

      {signTicks.map(({ sign, x1, y1, x2, y2, labelX, labelY }) => (
        <g key={sign}>
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgba(251,191,36,0.45)"
            strokeWidth={1.25}
          />
          <text
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-amber-200/70 text-[8px] font-medium tracking-wide sm:text-[9px]"
          >
            {sign}
          </text>
        </g>
      ))}
    </g>
  );
}
