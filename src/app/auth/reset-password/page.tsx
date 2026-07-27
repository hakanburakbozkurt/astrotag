import { Suspense } from "react";
import AuthMobileShell from "@/components/auth/AuthMobileShell";
import ResetPasswordContent from "@/components/auth/ResetPasswordContent";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthMobileShell title="Yükleniyor..." subtitle="Sıfırlama doğrulanıyor.">
          <section className="auth-glass-card w-full p-6 sm:p-8">
            <div className="h-24 animate-pulse rounded-2xl bg-white/10" />
          </section>
        </AuthMobileShell>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
