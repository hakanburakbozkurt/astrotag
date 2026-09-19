import AuthMobileShell from "@/components/auth/AuthMobileShell";
import ExpertRegisterForm from "@/components/expert/ExpertRegisterForm";

export default function ExpertRegisterPage() {
  return (
    <AuthMobileShell
      title="Astro Uzman Başvurusu"
      subtitle="E-posta, şifre ve uzmanlık bilgilerinizle başvurun. Hesabınız oluşturulur ve başvurunuz incelemeye alınır."
    >
      <section className="auth-glass-card w-full p-6 sm:p-8">
        <ExpertRegisterForm />
      </section>
    </AuthMobileShell>
  );
}
