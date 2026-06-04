"use client";

import { Suspense } from "react";
import AuthMobileShell from "@/components/auth/AuthMobileShell";
import NfcLoginForm from "@/components/nfc/NfcLoginForm";

function LoginContent() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0f172a]/90 p-6 backdrop-blur-xl sm:p-8">
      <NfcLoginForm />
    </div>
  );
}

export default function AuthLoginPage() {
  return (
    <AuthMobileShell
      title="Giriş Yap"
      subtitle="Hesabınla giriş yap ve kozmik profiline devam et."
    >
      <Suspense
        fallback={
          <div className="h-32 animate-pulse rounded-2xl bg-white/10" />
        }
      >
        <LoginContent />
      </Suspense>
    </AuthMobileShell>
  );
}
