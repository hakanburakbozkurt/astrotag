"use client";

import { FormEvent, useState } from "react";
import { updateUserPassword } from "@/lib/actions/update-password";

const fieldClass =
  "mt-2 h-12 w-full min-w-0 max-w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-amber-400/30 [color-scheme:dark]";

export default function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    const result = await updateUserPassword({ password, confirmPassword });

    if (!result.success) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setMessage("Şifreniz güncellendi.");
    setIsSaving(false);
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex w-full min-w-0 flex-col gap-5"
    >
      <label className="block w-full min-w-0">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">
          Yeni Şifre
        </span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setMessage(null);
          }}
          required
          minLength={8}
          placeholder="En az 8 karakter"
          className={fieldClass}
        />
      </label>

      <label className="block w-full min-w-0">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">
          Yeni Şifre (Tekrar)
        </span>
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setMessage(null);
          }}
          required
          minLength={8}
          placeholder="Şifreyi tekrar girin"
          className={fieldClass}
        />
      </label>

      {error ? <p className="text-sm text-red-300/80">{error}</p> : null}
      {message ? <p className="text-sm text-amber-200/80">{message}</p> : null}

      <button
        type="submit"
        disabled={isSaving}
        className="w-full rounded-xl border border-amber-400/30 bg-amber-400/10 py-3 text-sm font-medium text-amber-100 disabled:opacity-60"
      >
        {isSaving ? "Güncelleniyor..." : "Şifreyi Güncelle"}
      </button>
    </form>
  );
}
