import { Suspense } from "react";
import AuthMobileShell from "@/components/auth/AuthMobileShell";
import ExpertLoginForm from "@/components/expert/ExpertLoginForm";

export default function ExpertLoginPage() {
  return (
    <AuthMobileShell
      title="Astro Uzman Girişi"
      subtitle="Kayıtlı e-posta adresinize giriş bağlantısı gönderilir. Şifre veya PIN gerekmez."
    >
      <section className="auth-glass-card w-full p-6 sm:p-8">
        <Suspense
          fallback={
            <div className="h-40 animate-pulse rounded-2xl bg-white/10" aria-hidden />
          }
        >
          <ExpertLoginForm />
        </Suspense>
      </section>
    </AuthMobileShell>
  );
}
