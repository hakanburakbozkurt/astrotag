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
        className="inline-flex min-h-11 min-w-[44px] items-center rounded-sm border border-zinc-800 bg-zinc-950 px-3 text-xs font-medium uppercase tracking-[0.18em] text-stone-300 transition hover:border-zinc-600 hover:text-white"
      >
        ← {backLabel}
      </button>

      <Link
        href={closeHref}
        prefetch
        aria-label="Kapat"
        className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-zinc-800 bg-zinc-950 text-lg leading-none text-stone-500 transition hover:border-zinc-600 hover:text-stone-300"
      >
        ×
      </Link>
    </div>
  );
}
