"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { invalidateAuthCache } from "@/lib/auth";
import { freezeSelfAccountAction } from "@/lib/actions/account-freeze";
import { clearClientLastLogin } from "@/lib/nfc/last-login-persist.client";
import { NFC_SUSPENDED_PATH } from "@/lib/nfc/constants";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Colors } from "@/lib/navigation/dashboard-colors";

const CONFIRMATION_PHRASE = "HESABIMI DONDUR";

type FreezeModalProps = {
  open: boolean;
  onClose: () => void;
};

function FreezeAccountModal({ open, onClose }: FreezeModalProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phraseMatches =
    confirmationText.trim().toLocaleUpperCase("tr-TR") === CONFIRMATION_PHRASE;
  const canFreeze = acknowledged && phraseMatches && !busy;

  const resetForm = () => {
    setConfirmationText("");
    setAcknowledged(false);
    setError(null);
    setBusy(false);
  };

  const handleClose = () => {
    if (busy) return;
    resetForm();
    onClose();
  };

  const handleFreeze = async () => {
    if (!canFreeze) return;

    setBusy(true);
    setError(null);

    const result = await freezeSelfAccountAction();
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }

    clearClientLastLogin();
    try {
      await invalidateAuthCache();
      await createBrowserSupabaseClient().auth.signOut();
    } catch {
      /* oturum temizliği best-effort */
    }

    window.location.assign(NFC_SUSPENDED_PATH);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-md ${Colors.card} p-5`}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-sm font-medium text-stone-300">Hesabı Dondur</h3>
        <p className="mt-2 text-xs leading-relaxed text-stone-500">
          Hesabınız askıya alınır; NFC girişi ve uygulama erişimi durdurulur. Verileriniz
          silinmez — tekrar aktifleştirmek için destek ile iletişime geçebilirsiniz.
        </p>
        <label className="mt-4 flex items-start gap-2 text-xs text-stone-400">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            className="mt-0.5"
          />
          Hesabımın geçici olarak dondurulmasını ve erişimin kesilmesini onaylıyorum.
        </label>
        <input
          type="text"
          value={confirmationText}
          onChange={(event) => setConfirmationText(event.target.value)}
          placeholder={CONFIRMATION_PHRASE}
          className="mt-3 w-full rounded-sm border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-stone-300 outline-none focus:border-zinc-500"
        />
        {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="flex-1 rounded-sm border border-zinc-700 px-3 py-2 text-sm text-stone-400"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={() => void handleFreeze()}
            disabled={!canFreeze}
            className="flex-1 rounded-sm border border-zinc-600 px-3 py-2 text-sm text-stone-300 disabled:opacity-40"
          >
            {busy ? "…" : "Dondur"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function FreezeAccountSection() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <section className={`${Colors.card} p-5`}>
        <p className="text-xs text-stone-500">Hesabı Dondur</p>
        <p className="mt-2 text-xs leading-relaxed text-stone-500">
          Geçici olarak erişimi durdurun. Kişisel verileriniz silinmez.
        </p>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="mt-4 w-full rounded-sm border border-zinc-700 px-4 py-2.5 text-sm text-stone-300 transition hover:border-zinc-500"
        >
          Hesabı Dondur
        </button>
      </section>
      <AnimatePresence>
        {modalOpen ? (
          <FreezeAccountModal open={modalOpen} onClose={() => setModalOpen(false)} />
        ) : null}
      </AnimatePresence>
    </>
  );
}
