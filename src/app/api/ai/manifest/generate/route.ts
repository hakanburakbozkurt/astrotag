import { NextResponse } from "next/server";
import { generateDailyManifestoForProfile } from "@/lib/actions/manifesto";
import {
  MANIFESTO_CATEGORIES,
  MANIFESTO_TECHNIQUES,
  type GenerateManifestoInput,
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

export const POST = withNfcApiRoute("api/ai/manifest/generate", async (request, access) => {
  const body = await request.json();
  const category = body?.category as string | undefined;
  const techniqueType = body?.techniqueType as string | undefined;
  const intention = (body?.intention as string | undefined)?.trim() ?? "";

  if (!category || !techniqueType || !isValidCategory(category) || !isValidTechnique(techniqueType)) {
    return NextResponse.json(
      { ok: false, error: "Geçersiz kategori veya teknik.", debugCode: "INVALID_INPUT" },
      { status: 400 }
    );
  }

  if (!intention) {
    return NextResponse.json(
      {
        ok: false,
        error: "Niyetini birkaç kelimeyle yaz — portal seni duysun.",
        debugCode: "MISSING_INTENTION",
      },
      { status: 400 }
    );
  }

  if (intention.length > 280) {
    return NextResponse.json(
      { ok: false, error: "Niyet en fazla 280 karakter olabilir.", debugCode: "INTENTION_TOO_LONG" },
      { status: 400 }
    );
  }

  const input: GenerateManifestoInput = { category, techniqueType, intention };
  const result = await generateDailyManifestoForProfile(access.profileId, input);

  if (!result.ok) {
    const status = result.debugCode === "AUTH_FAILED" ? 403 : 422;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
});
