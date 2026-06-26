import Link from "next/link";
import Starfield from "@/components/Starfield";
import PublicNfcProfileView from "@/components/nfc/PublicNfcProfileView";
import { getPublicProfileByUniqueId } from "@/lib/nfc/public-profile.server";
import { HOME_PATH } from "@/lib/nfc/constants";

type PageProps = {
  params: Promise<{ unique_id: string }>;
};

export default async function PublicNfcProfilePage({ params }: PageProps) {
  const { unique_id: rawId } = await params;
  const { normalizeNfcUniqueId } = await import("@/lib/nfc/unique-id");
  const uniqueId = normalizeNfcUniqueId(rawId);
  const result = await getPublicProfileByUniqueId(uniqueId);

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <Starfield />

      <div className="relative flex min-h-dvh items-center justify-center px-6 py-12">
        {result.ok ? (
          <PublicNfcProfileView profile={result.profile} />
        ) : (
          <div className="max-w-sm text-center">
            <p className="text-sm text-red-300/90">{result.error}</p>
            <Link
              href={HOME_PATH}
              className="mt-8 inline-block rounded-xl border border-white/15 px-5 py-2.5 text-xs uppercase tracking-widest text-white/60"
            >
              Ana sayfa
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
