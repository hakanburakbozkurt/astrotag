import { redirect } from "next/navigation";
import { Suspense } from "react";
import AuthMobileShell from "@/components/auth/AuthMobileShell";
import AuthPathNav, { AuthAlternatePaths } from "@/components/auth/AuthPathNav";
import GuestAccessButton from "@/components/auth/GuestAccessButton";
import LoginForm from "@/components/auth/LoginForm";
import { getAuthProfileContext } from "@/lib/auth/require-profile.server";
import { DASHBOARD_PATH } from "@/lib/nfc/constants";
import { resolveInitialNfcId } from "@/lib/nfc/resolve-initial-nfc-id.server";

type PageProps = {
  searchParams: Promise<{ nfc?: string; email?: string; msg?: string }>;
};

export default async function AuthLoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const authProfile = await getAuthProfileContext();

  if (authProfile) {
    redirect(DASHBOARD_PATH);
  }

  const optionalNfcId = await resolveInitialNfcId(params.nfc);

  return (
    <AuthMobileShell
      title="Giriş Yap"
      subtitle="E-posta ve şifrenizle giriş yapın veya misafir olarak keşfedin."
    >
      <section className="auth-glass-card w-full p-6 sm:p-8">
        <AuthPathNav />
        <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-white/10" />}>
          <LoginForm optionalNfcId={optionalNfcId} />
        </Suspense>
        <div className="mt-6">
          <GuestAccessButton />
        </div>
        <AuthAlternatePaths />
      </section>
    </AuthMobileShell>
  );
}
