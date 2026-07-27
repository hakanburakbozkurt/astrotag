import { redirect } from "next/navigation";
import { Suspense } from "react";
import AuthMobileShell from "@/components/auth/AuthMobileShell";
import NfcLoginForm from "@/components/nfc/NfcLoginForm";
import { getAuthProfileContext } from "@/lib/auth/require-profile.server";
import { DASHBOARD_PATH } from "@/lib/nfc/constants";

type PageProps = {
  searchParams: Promise<{ nfc?: string; email?: string; msg?: string }>;
};

export default async function AuthLoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const authProfile = await getAuthProfileContext();

  if (authProfile) {
    redirect(DASHBOARD_PATH);
  }

  const initialNfcId = params.nfc?.trim() ?? "";

  return (
    <AuthMobileShell
      title="Giriş Yap"
      subtitle="E-posta ve şifrenizle giriş yapın. NFC etiketiniz sizi buraya yönlendirdi."
    >
      <section className="auth-glass-card w-full p-6 sm:p-8">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-white/10" />}>
          <NfcLoginForm initialNfcId={initialNfcId} />
        </Suspense>
      </section>
    </AuthMobileShell>
  );
}
