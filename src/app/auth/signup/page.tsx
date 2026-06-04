import { Suspense } from "react";
import AuthMobileShell from "@/components/auth/AuthMobileShell";
import NfcSignupForm from "@/components/nfc/NfcSignupForm";

type PageProps = {
  searchParams: Promise<{ nfc?: string; msg?: string }>;
};

/**
 * Kayıt sayfası — NFC akışı yalnızca ?nfc= query ile bağlanır.
 * Bu sayfa /c/ rotasına geri yönlendirme yapmaz (döngü önlenir).
 */
export default async function AuthSignupPage({ searchParams }: PageProps) {
  await searchParams;

  return (
    <AuthMobileShell
      title="Kayıt Ol"
      subtitle="AstroTag hesabını oluştur ve NFC kartını eşleştir."
    >
      <Suspense
        fallback={
          <div className="h-40 animate-pulse rounded-2xl bg-white/10" />
        }
      >
        <div className="rounded-[28px] border border-white/10 bg-[#0f172a]/90 p-6 backdrop-blur-xl sm:p-8">
          <NfcSignupForm />
        </div>
      </Suspense>
    </AuthMobileShell>
  );
}
