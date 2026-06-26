import type { UserData } from "@/types/user";
import {
  buildCosmicAnalysisContext,
  type CosmicAnalysisContext,
} from "@/lib/astrology/cosmic-context";
import type { AnalysisContextEnvelope, AnalysisModuleSlice } from "./types";

export type { AnalysisContextEnvelope, AnalysisModuleSlice } from "./types";
export { buildRelationshipAnalysisSlice, relationshipSliceFromCosmicContext } from "./modules/relationship";

/**
 * CosmicAnalysisContext üretir; modül dilimi ayrı katmanda birleştirilir.
 * Mevcut cosmic-context.ts dosyasına dokunulmaz.
 */
export async function buildCosmicAnalysisEnvelope(
  userData: UserData,
  askedAt: Date = new Date()
): Promise<CosmicAnalysisContext> {
  return buildCosmicAnalysisContext(userData, askedAt);
}

export function mergeAnalysisEnvelope(
  cosmic: CosmicAnalysisContext,
  slice: AnalysisModuleSlice
): AnalysisContextEnvelope {
  return { cosmic, slice };
}
