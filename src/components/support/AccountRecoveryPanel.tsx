"use client";

import Link from "next/link";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { AUTH_FORGOT_PASSWORD_PATH } from "@/lib/auth/auth-config";

type AccountRecoveryPanelProps = {
  initialEmail?: string;
};

export default function AccountRecoveryPanel({
  initialEmail,
}: AccountRecoveryPanelProps) {
  return (
    <div className="rounded-xl border border-amber-400/20 bg-amber-950/15 px-4 py-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-amber-300/80">
        Şifremi Unuttum
      </p>
      <p className="mt-2 text-sm leading-relaxed text-white/55">
        Kayıtlı e-posta adresinize güvenli bir sıfırlama bağlantısı gönderilir
        (Resend / noreply@astrotag.app).
      </p>
      <div className="mt-4">
        <ForgotPasswordForm initialEmail={initialEmail} compact />
      </div>
      <p className="mt-3 text-center text-[11px]">
        <Link
          href={AUTH_FORGOT_PASSWORD_PATH}
          className="font-medium text-amber-200/90 underline-offset-2 hover:underline"
        >
          Tam ekran sıfırlama sayfası
        </Link>
      </p>
    </div>
  );
}
