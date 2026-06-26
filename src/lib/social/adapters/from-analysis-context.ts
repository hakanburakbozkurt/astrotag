import type { AnalysisContextEnvelope } from "@/lib/astrology/analysis-context/types";
import type { SocialSharePayload } from "../types";
import { relationshipSliceToSharePayload } from "./relationship";

export function sharePayloadFromAnalysisEnvelope(
  envelope: AnalysisContextEnvelope
): SocialSharePayload {
  switch (envelope.slice.module) {
    case "relationship":
      return relationshipSliceToSharePayload(envelope.slice);
    default:
      throw new Error(
        `SocialShare adapter henüz desteklenmiyor: ${envelope.slice.module}`
      );
  }
}
