import { redirect } from "next/navigation";
import { Suspense } from "react";
import AuthMobileShell from "@/components/auth/AuthMobileShell";
import NfcSignupForm from "@/components/nfc/NfcSignupForm";
import { getAuthProfileContext } from "@/lib/auth/require-profile.server";
import { DASHBOARD_PATH } from "@/lib/nfc/constants";
import { resolveInitialNfcId } from "@/lib/nfc/resolve-initial-nfc-id.server";

type PageProps = {
  searchParams: Promise<{ nfc?: string; email?: string; msg?: string }>;
};

export default async function AuthSignupPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const authProfile = await getAuthProfileContext();

  if (authProfile) {
    redirect(DASHBOARD_PATH);
  }

  const initialNfcId = await resolveInitialNfcId(params.nfc);

  return (
    <AuthMobileShell
      title="Kayıt Ol"
      subtitle="E-posta ve şifrenizle hesap oluşturun. Ardından doğum bilgilerinizi tamamlayacaksınız."
    >
      <section className="auth-glass-card w-full p-6 sm:p-8">
        <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-white/10" />}>
          <NfcSignupForm initialNfcId={initialNfcId} />
        </Suspense>
      </section>
    </AuthMobileShell>
  );
}
