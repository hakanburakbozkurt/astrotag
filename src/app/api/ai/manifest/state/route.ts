import { NextResponse } from "next/server";
import { loadManifestoStateForProfile } from "@/lib/actions/manifesto";
import {
  MANIFESTO_CATEGORIES,
  MANIFESTO_TECHNIQUES,
  type ManifestoCategoryId,
  type ManifestoTechniqueId,
} from "@/lib/manifesto/types";
import { withNfcApiRoute } from "@/lib/nfc/with-nfc-api-route";

function isValidCategory(value: string): value is ManifestoCategoryId {
  return MANIFESTO_CATEGORIES.some((item) => item.id === value);
}

function isValidTechnique(value: string): value is ManifestoTechniqueId {
  return MANIFESTO_TECHNIQUES.some((item) => item.id === value);
}

export const POST = withNfcApiRoute("api/ai/manifest/state", async (request, access) => {
  const body = await request.json();
  const category = body?.category as string | undefined;
  const techniqueType = body?.techniqueType as string | undefined;

  if (!category || !techniqueType || !isValidCategory(category) || !isValidTechnique(techniqueType)) {
    return NextResponse.json(
      { error: "Geçersiz kategori veya teknik.", manifesto: null },
      { status: 400 }
    );
  }

  const manifesto = await loadManifestoStateForProfile(access.profileId, {
    category,
    techniqueType,
  });

  return NextResponse.json({ manifesto });
});
