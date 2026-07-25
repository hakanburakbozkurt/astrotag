import AuthMobileShell from "@/components/auth/AuthMobileShell";
import ExpertRegisterForm from "@/components/expert/ExpertRegisterForm";

export default function ExpertRegisterPage() {
  return (
    <AuthMobileShell
      title="Astro Uzman Kaydı"
      subtitle="Davet kodunuz, adınız ve e-posta adresinizle kayıt olun. Doğrulama bağlantısı e-postanıza gönderilir."
    >
      <section className="auth-glass-card w-full p-6 sm:p-8">
        <ExpertRegisterForm />
      </section>
    </AuthMobileShell>
  );
}
