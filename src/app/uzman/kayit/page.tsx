import AuthMobileShell from "@/components/auth/AuthMobileShell";
import ExpertRegisterForm from "@/components/expert/ExpertRegisterForm";

export default function ExpertRegisterPage() {
  return (
    <AuthMobileShell
      title="Astro Uzman Kaydı"
      subtitle="Tek kullanımlık 8 haneli davet kodunuz ve belirleyeceğiniz PIN ile kayıt olun."
    >
      <section className="auth-glass-card w-full p-6 sm:p-8">
        <ExpertRegisterForm />
      </section>
    </AuthMobileShell>
  );
}
