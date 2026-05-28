export const CHART_VIEWBOX = 360;
export const CHART_CENTER = CHART_VIEWBOX / 2;
export const OUTER_RADIUS = 158;
export const INNER_RADIUS = 122;
export const PLANET_RADIUS = 136;
export const PLANET_ICON_SIZE = 24;
export const ASC_MARKER_OFFSET = 18;

export const ASPECT_LEGEND = [
  { type: "trine", label: "Üçgen", color: "rgba(59,130,246,0.85)" },
  { type: "square", label: "Kare", color: "rgba(239,68,68,0.85)" },
  { type: "opposition", label: "Karşıt", color: "rgba(168,85,247,0.85)" },
  { type: "conjunction", label: "Kavuşum", color: "rgba(251,191,36,0.9)" },
] as const;
