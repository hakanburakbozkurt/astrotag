export interface Session {
  id: string;
  user_id: string | null;
  expires_at: string | null;
  started_at: string | null;
  is_active: boolean | null;
}

export interface HoraryQuestion {
  id: string;
  user_id: string | null;
  question: string;
  ai_answer: string | null;
  planet_positions: Record<string, unknown> | null;
  created_at: string | null;
}

export interface SessionInsert {
  user_id: string;
  expires_at: string;
}

export interface HoraryQuestionInsert {
  user_id: string;
  question: string;
  ai_answer?: string | null;
}

export type CosmicReadingType = "Tarot" | "Horary" | "Synastry";

export interface CosmicReadingRecord {
  id: string;
  user_id: string;
  type: CosmicReadingType;
  question: string;
  reading_result: string;
  cards_json: unknown | null;
  created_at: string;
}
