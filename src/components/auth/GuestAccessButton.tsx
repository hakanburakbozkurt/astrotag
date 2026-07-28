"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { finalizeGuestAccessAction } from "@/lib/actions/quick-access";
import { authSecondaryButtonClassName } from "@/components/auth/auth-field-styles";

export default function GuestAccessButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGuestAccess() {
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await finalizeGuestAccessAction();

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(result.redirectTo);
      router.refresh();
    } catch {
      setError("Misafir oturumu başlatılamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleGuestAccess()}
        className={authSecondaryButtonClassName}
      >
        {loading ? "Başlatılıyor..." : "Misafir Olarak Dene"}
      </button>
      <p className="text-center text-[10px] leading-relaxed text-white/35">
        12 saatlik geçici oturum. Süre bitince kayıt olmanız istenecektir.
      </p>
      {error ? (
        <p className="text-center text-xs text-red-300/90" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
