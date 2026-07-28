"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AUTH_LOGIN_PATH,
  AUTH_SIGNUP_PATH,
} from "@/lib/nfc/constants";
import { EXPERT_REGISTER_PATH } from "@/lib/expert/expert-paths";

const tabClass = (active: boolean) =>
  `flex-1 rounded-xl px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-widest transition ${
    active
      ? "bg-amber-400/15 text-amber-200 border border-amber-400/30"
      : "text-white/45 hover:text-white/70"
  }`;

export default function AuthPathNav() {
  const pathname = usePathname();
  const isSignup = pathname === AUTH_SIGNUP_PATH;

  return (
    <nav className="mb-6 flex gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
      <Link href={AUTH_LOGIN_PATH} className={tabClass(!isSignup)}>
        Giriş
      </Link>
      <Link href={AUTH_SIGNUP_PATH} className={tabClass(isSignup)}>
        Kayıt
      </Link>
    </nav>
  );
}

export function AuthAlternatePaths() {
  return (
    <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
      <p className="text-center text-[10px] uppercase tracking-[0.28em] text-white/35">
        Diğer yollar
      </p>
      <Link
        href={EXPERT_REGISTER_PATH}
        className="flex min-h-[48px] items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-950/20 text-xs font-medium uppercase tracking-widest text-violet-200/90 transition hover:border-violet-400/40"
      >
        Uzman / Astrolog Başvurusu
      </Link>
    </div>
  );
}
