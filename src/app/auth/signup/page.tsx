"use client";

import { Suspense } from "react";
import AuthMobileShell from "@/components/auth/AuthMobileShell";
import NfcSignupForm from "@/components/nfc/NfcSignupForm";

function SignupContent() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0f172a]/90 p-6 backdrop-blur-xl sm:p-8">
      <NfcSignupForm />
    </div>
  );
}

export default function AuthSignupPage() {
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
        <SignupContent />
      </Suspense>
    </AuthMobileShell>
  );
}
