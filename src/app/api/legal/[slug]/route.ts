import { NextResponse } from "next/server";
import { resolveLegalDocumentSlug } from "@/lib/legal/legal-documents.server";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const document = await resolveLegalDocumentSlug(slug);

  if (!document) {
    return NextResponse.json({ error: "Belge bulunamadı." }, { status: 404 });
  }

  return NextResponse.json(document, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
