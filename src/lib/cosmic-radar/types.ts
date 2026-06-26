import type { PlanetId } from "@/lib/astrology/types";
import type { ZodiacSign } from "@/lib/astrology/zodiac-signs";
import type { WeeklyOverviewNarrative } from "./weekly-narrative";

export interface WeeklyTransitRow {
  id: PlanetId;
  name: string;
  symbol: string;
  positionLabel: string;
  house: number;
  houseLabel: string;
  inSelectedSign: boolean;
}

export interface WeeklyAnalysisCard {
  id: "overview" | "strategy";
  title: string;
  body: string;
  copyText: string;
  paragraphs?: WeeklyOverviewNarrative;
}

export interface WeeklyAnalysisContent {
  weekLabel: string;
  dateRangeLabel: string;
  weekStart: string;
  weekEnd: string;
  selectedSign: ZodiacSign;
  computedAt: string;
  transitRows: WeeklyTransitRow[];
  overview: WeeklyOverviewNarrative;
  cards: WeeklyAnalysisCard[];
  caution: {
    title: string;
    body: string;
    highlight: boolean;
    copyText: string;
  };
}

export interface CosmicRadarSharePayload {
  weekLabel: string;
  cardTitle: string;
  cardBody: string;
  sign: ZodiacSign;
}
