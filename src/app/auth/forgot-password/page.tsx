import AuthMobileShell from "@/components/auth/AuthMobileShell";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;
  const initialEmail = params.email?.trim() ?? "";

  return (
    <AuthMobileShell
      title="Şifremi Unuttum"
      subtitle="Kayıtlı e-posta adresinize güvenli bir sıfırlama bağlantısı gönderilir."
    >
      <section className="auth-glass-card w-full p-6 sm:p-8">
        <ForgotPasswordForm initialEmail={initialEmail} />
      </section>
    </AuthMobileShell>
  );
}
