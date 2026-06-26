"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface SubPageNavProps {
  backHref: string;
  closeHref: string;
  backLabel?: string;
}

export default function SubPageNav({
  backHref,
  closeHref,
  backLabel = "Geri",
}: SubPageNavProps) {
  const router = useRouter();

  return (
    <div className="mb-6 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => router.push(backHref)}
        className="inline-flex min-h-11 min-w-[44px] items-center rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-medium uppercase tracking-[0.18em] text-amber-300/85 transition hover:border-amber-400/25 hover:bg-white/[0.06]"
      >
        ← {backLabel}
      </button>

      <Link
        href={closeHref}
        prefetch
        aria-label="Kapat"
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-lg leading-none text-white/55 transition hover:border-amber-400/25 hover:text-amber-100"
      >
        ×
      </Link>
    </div>
  );
}
