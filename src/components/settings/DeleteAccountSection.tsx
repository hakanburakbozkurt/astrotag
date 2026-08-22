"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { invalidateAuthCache } from "@/lib/auth";
import { clearClientLastLogin } from "@/lib/nfc/last-login-persist.client";
import { HOME_PATH } from "@/lib/nfc/constants";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const CONFIRMATION_PHRASE = "HESABIMI SİL";

type DeleteAccountModalProps = {
  open: boolean;
  onClose: () => void;
};

function DeleteAccountModal({ open, onClose }: DeleteAccountModalProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phraseMatches =
    confirmationText.trim().toLocaleUpperCase("tr-TR") === CONFIRMATION_PHRASE;
  const canDelete = acknowledged && phraseMatches && !busy;

  const resetForm = () => {
    setConfirmationText("");
    setAcknowledged(false);
    setError(null);
    setBusy(false);
  };

  const handleClose = () => {
    if (busy) {
      return;
    }
    resetForm();
    onClose();
  };

  const handleDelete = async () => {
    if (!canDelete) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error: rpcError } = await supabase.rpc("delete_user_account");

      if (rpcError) {
        setError(
          rpcError.message.includes("Not authenticated")
            ? "Oturumunuz sona ermiş. Lütfen tekrar giriş yapın."
            : "Hesap silinemedi. Lütfen daha sonra tekrar deneyin."
        );
        setBusy(false);
        return;
      }

      if (data && typeof data === "object" && "ok" in data && !data.ok) {
        setError("Hesap silinemedi. Lütfen daha sonra tekrar deneyin.");
        setBusy(false);
        return;
      }

      clearClientLastLogin();

      try {
        await invalidateAuthCache();
      } catch {
        // Oturum zaten silinmiş olabilir — yönlendirme devam eder
      }

      try {
        await supabase.auth.signOut();
      } catch {
        // auth.users silindiyse signOut başarısız olabilir
      }

      window.location.assign(HOME_PATH);
    } catch {
      setError("Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/75 p-4 sm:items-center"
          onClick={handleClose}
          role="presentation"
        >
          <motion.div
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 28, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            aria-describedby="delete-account-description"
            className="w-full max-w-md overflow-hidden rounded-[20px] border border-red-500/30 bg-[#0b1220] shadow-2xl"
          >
            <div className="border-b border-red-500/20 bg-red-950/30 px-5 py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="mt-0.5 h-5 w-5 shrink-0 text-red-400"
                  aria-hidden
                />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-red-300/70">
                    KVKK · Unutulma Hakkı
                  </p>
                  <h2
                    id="delete-account-title"
                    className="mt-1 text-base font-semibold text-red-100"
                  >
                    Hesabınız kalıcı olarak silinecek
                  </h2>
                </div>
              </div>
            </div>

            <div
              id="delete-account-description"
              className="space-y-4 px-5 py-4 text-sm leading-relaxed text-white/70"
            >
              <p>
                Bu işlem <strong className="text-white/90">geri alınamaz</strong>.
                Onayladığınızda hesabınıza bir daha giriş yapamazsınız.
              </p>

              <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-3 text-xs text-red-100/85">
                <p className="font-medium text-red-200/95">Kalıcı olarak silinecek:</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-red-100/75">
                  <li>Tarot geçmişi ve okuma kayıtları</li>
                  <li>Manifesto ve horary soruları</li>
                  <li>Kozmik günlük, rozetler ve profil bilgileriniz</li>
                  <li>NFC eşleştirme ve oturum verileri</li>
                </ul>
              </div>

              <p className="text-xs text-white/50">
                Ödeme ve sözleşme onay kayıtları, yasal yükümlülükler gereği
                kişisel kimliğinizden ayrıştırılarak saklanmaya devam edebilir
                (KVKK / TTK / VUK).
              </p>

              <label className="flex min-h-11 cursor-pointer items-start gap-3 text-xs text-white/65">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                  disabled={busy}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-red-500"
                />
                <span>
                  Bu işlemin geri alınamayacağını ve tüm kişisel içeriklerimin
                  silineceğini anladım.
                </span>
              </label>

              <div>
                <label
                  htmlFor="delete-account-confirmation"
                  className="text-[10px] uppercase tracking-[0.2em] text-white/45"
                >
                  Onaylamak için{" "}
                  <span className="font-mono text-red-300/90">{CONFIRMATION_PHRASE}</span>{" "}
                  yazın
                </label>
                <input
                  id="delete-account-confirmation"
                  type="text"
                  value={confirmationText}
                  onChange={(event) => setConfirmationText(event.target.value)}
                  disabled={busy}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={CONFIRMATION_PHRASE}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 font-mono text-sm text-white/90 outline-none transition focus:border-red-400/40 disabled:opacity-60"
                />
              </div>

              {error ? (
                <p className="text-xs text-red-300/90" role="alert">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 border-t border-white/10 p-4 sm:flex-row-reverse">
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={!canDelete}
                className="min-h-11 flex-1 rounded-xl bg-red-600/90 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {busy ? "Siliniyor…" : "Hesabımı Kalıcı Olarak Sil"}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={busy}
                className="min-h-11 flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-xs uppercase tracking-[0.16em] text-white/55 transition hover:border-white/20 disabled:opacity-45"
              >
                Vazgeç
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function DeleteAccountSection() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] border border-red-500/20 bg-red-950/10 p-5 backdrop-blur-2xl sm:p-6"
      >
        <p className="text-[10px] uppercase tracking-[0.3em] text-red-400/80">
          Tehlikeli Bölge
        </p>
        <p className="mt-2 text-xs leading-relaxed text-white/50">
          Hesabınızı kalıcı olarak silmek tüm kişisel içeriklerinizi siler ve
          giriş yapmanızı engeller. Bu işlem geri alınamaz.
        </p>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-red-500/35 bg-red-600/15 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-red-200 transition hover:border-red-400/50 hover:bg-red-600/25"
        >
          Hesabımı Kalıcı Olarak Sil
        </button>
      </motion.section>

      <DeleteAccountModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
