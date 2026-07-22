import Link from "next/link";
import Starfield from "@/components/Starfield";
import { ACCOUNT_SUSPENDED_MESSAGE, HOME_PATH } from "@/lib/nfc/constants";
import { cardEntryPathForUniqueId } from "@/lib/nfc/card-paths";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

type PageProps = {
  searchParams: Promise<{ uid?: string }>;
};

export default async function NfcSuspendedPage({ searchParams }: PageProps) {
  const { uid: rawUid } = await searchParams;
  const uniqueId = rawUid ? normalizeNfcUniqueId(rawUid) : "";

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <Starfield />
      <div className="relative flex min-h-dvh items-center justify-center px-6 py-12">
        <div className="max-w-sm text-center">
          <p className="text-[10px] uppercase tracking-[0.28em] text-red-300/80">
            Erişim Engellendi
          </p>
          <p className="mt-4 text-sm text-red-200">{ACCOUNT_SUSPENDED_MESSAGE}</p>
          {uniqueId ? (
            <p className="mt-3 font-mono text-[11px] text-white/30">{uniqueId}</p>
          ) : null}
          <div className="mt-8 flex flex-col gap-3">
            {uniqueId ? (
              <Link
                href={cardEntryPathForUniqueId(uniqueId)}
                className="rounded-xl border border-white/15 px-5 py-2.5 text-xs uppercase tracking-widest text-white/60"
              >
                Destek için iletişim
              </Link>
            ) : null}
            <Link
              href={HOME_PATH}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-xs uppercase tracking-widest text-white/45"
            >
              Ana sayfa
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
