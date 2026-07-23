import AuthMobileShell from "@/components/auth/AuthMobileShell";
import ExpertLoginForm from "@/components/expert/ExpertLoginForm";

export default function ExpertLoginPage() {
  return (
    <AuthMobileShell
      title="Astro Uzman Girişi"
      subtitle="8 haneli uzman kodunuz ve PIN ile giriş yapın. Şifre sıfırlama WhatsApp üzerinden yapılır."
    >
      <section className="auth-glass-card w-full p-6 sm:p-8">
        <ExpertLoginForm />
      </section>
    </AuthMobileShell>
  );
}
