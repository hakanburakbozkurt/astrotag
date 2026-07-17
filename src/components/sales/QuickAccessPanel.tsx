"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  KeyRound,
  Loader2,
  Nfc,
  Search,
  UserCog,
  X,
} from "lucide-react";
import SalesMotion from "@/components/sales/SalesMotion";
import {
  finalizeGuestAccessAction,
  redeemDigitalAccessCodeAction,
  redeemExpertAccessCodeAction,
} from "@/lib/actions/quick-access";
import { QUICK_ACCESS_ITEMS } from "@/lib/sales/landing-nav";
import {
  formatExpertAccessCodeInput,
  normalizeDigitalAccessCode,
} from "@/lib/sales/quick-access-codes";
import { SALES_EXPERT_APPLY_PATH } from "@/lib/sales/star-packages-catalog";
import { SALES_IN_VIEW_TRANSITION, SALES_SECTION_CLASS } from "@/lib/sales/sales-motion";
import { supabase } from "@/lib/supabase";

const ICONS = {
  nfc: Nfc,
  code: KeyRound,
  guest: Search,
  expert: UserCog,
} as const;

type PanelFlow = "digital" | "expert" | "expert-code" | null;

const INPUT_CLASS =
  "w-full rounded-xl border border-white/10 bg-[#070b14]/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-amber-400/35 focus:ring-1 focus:ring-amber-400/20";

const PRIMARY_BUTTON_CLASS =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-400/95 px-4 py-2.5 text-sm font-semibold text-[#0f172a] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60";

const GHOST_BUTTON_CLASS =
  "inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/12 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60";

function QuickAccessModal({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={SALES_IN_VIEW_TRANSITION}
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#070b14]/80 p-4 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={SALES_IN_VIEW_TRANSITION}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-access-modal-title"
            className="w-full max-w-md rounded-[24px] border border-white/10 bg-[#0f172a] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                  Hızlı Giriş
                </p>
                <h3 id="quick-access-modal-title" className="mt-1 text-lg font-semibold text-white">
                  {title}
                </h3>
                {subtitle ? (
                  <p className="mt-1 text-sm leading-relaxed text-white/45">{subtitle}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                className="rounded-lg p-2 text-white/45 transition hover:bg-white/[0.05] hover:text-white/75"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

async function ensureAuthenticatedSession(): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: sessionData } = await supabase.auth.getSession();

  if (sessionData.session?.user?.id) {
    return { ok: true };
  }

  const { error } = await supabase.auth.signInAnonymously();
  if (error) {
    return { ok: false, error: "Oturum açılamadı. Lütfen tekrar deneyin." };
  }

  return { ok: true };
}

export default function QuickAccessPanel() {
  const router = useRouter();
  const [activeFlow, setActiveFlow] = useState<PanelFlow>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestCode, setGuestCode] = useState<string | null>(null);
  const [digitalCode, setDigitalCode] = useState("");
  const [expertCode, setExpertCode] = useState("");

  const closeModal = useCallback(() => {
    if (loading) {
      return;
    }
    setActiveFlow(null);
    setError(null);
    setDigitalCode("");
    setExpertCode("");
  }, [loading]);

  const handleGuestExplore = useCallback(async () => {
    setLoading(true);
    setError(null);
    setGuestCode(null);

    try {
      const session = await ensureAuthenticatedSession();
      if (!session.ok) {
        setError(session.error);
        return;
      }

      const result = await finalizeGuestAccessAction();
      if (!result.success) {
        setError(result.error);
        return;
      }

      if (!result.guestCode) {
        setError("Misafir kodu oluşturulamadı. Lütfen tekrar deneyin.");
        return;
      }

      setGuestCode(result.guestCode);
    } catch {
      setError("Misafir oturumu başlatılamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDigitalSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const session = await ensureAuthenticatedSession();
      if (!session.ok) {
        setError(session.error);
        return;
      }

      const result = await redeemDigitalAccessCodeAction(digitalCode);
      if (!result.success) {
        setError(result.error);
        return;
      }

      setActiveFlow(null);
      router.push(result.redirectTo);
    } catch {
      setError("Kod doğrulanamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [digitalCode, router]);

  const handleExpertSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const session = await ensureAuthenticatedSession();
      if (!session.ok) {
        setError(session.error);
        return;
      }

      const result = await redeemExpertAccessCodeAction(expertCode);
      if (!result.success) {
        setError(result.error);
        return;
      }

      setActiveFlow(null);
      router.push(result.redirectTo);
    } catch {
      setError("Uzman kodu doğrulanamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [expertCode, router]);

  const handleCardClick = useCallback(
    (itemId: (typeof QUICK_ACCESS_ITEMS)[number]["id"]) => {
      setError(null);

      if (itemId === "code") {
        setActiveFlow("digital");
        return;
      }

      if (itemId === "expert") {
        setActiveFlow("expert");
        return;
      }
    },
    []
  );

  return (
    <>
      <section className={`${SALES_SECTION_CLASS} border-b border-white/[0.06] py-8`}>
        <div className="mx-auto max-w-5xl">
          <p className="sales-kicker text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
            Hızlı Giriş
          </p>
          <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
            Nereden Başlamak İstersin?
          </h2>

          {guestCode ? (
            <div className="mt-6 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-5">
              <p className="text-sm text-white/70">Misafir oturumun hazır. Kodun:</p>
              <p className="mt-2 font-mono text-2xl font-semibold tracking-[0.2em] text-amber-200">
                {guestCode}
              </p>
              <p className="mt-2 text-xs text-white/45">
                24 saat boyunca keşfedebilirsin. Tam erişim için dijital kodunu kullan.
              </p>
              <button
                type="button"
                onClick={() => router.push("/dashboard?guest=1")}
                className={`${PRIMARY_BUTTON_CLASS} mt-4 max-w-xs`}
              >
                Keşfe Başla
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
            {QUICK_ACCESS_ITEMS.map((item, index) => {
              const Icon = ICONS[item.id];

              if (item.id === "nfc") {
                return (
                  <SalesMotion key={item.id} transition={{ delay: index * 0.05 }}>
                    <Link
                      href={item.href}
                      className="flex min-h-[108px] flex-col justify-between rounded-2xl border border-white/10 bg-[#0f172a]/55 p-4 shadow-lg backdrop-blur-xl transition hover:border-amber-400/25 hover:bg-amber-400/[0.05] sm:min-h-[120px] sm:p-5"
                    >
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-200">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold leading-snug text-white sm:text-base">
                          {item.label}
                        </span>
                        <span className="mt-1 block text-[11px] leading-relaxed text-white/45 sm:text-xs">
                          {item.description}
                        </span>
                      </span>
                    </Link>
                  </SalesMotion>
                );
              }

              if (item.id === "guest") {
                return (
                  <SalesMotion key={item.id} transition={{ delay: index * 0.05 }}>
                    <button
                      type="button"
                      onClick={handleGuestExplore}
                      disabled={loading}
                      className="flex min-h-[108px] w-full flex-col justify-between rounded-2xl border border-white/10 bg-[#0f172a]/55 p-4 text-left shadow-lg backdrop-blur-xl transition hover:border-amber-400/25 hover:bg-amber-400/[0.05] disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-[120px] sm:p-5"
                    >
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-200">
                        {loading && !guestCode ? (
                          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                        ) : (
                          <Icon className="h-5 w-5" aria-hidden />
                        )}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold leading-snug text-white sm:text-base">
                          {item.label}
                        </span>
                        <span className="mt-1 block text-[11px] leading-relaxed text-white/45 sm:text-xs">
                          {item.description}
                        </span>
                      </span>
                    </button>
                  </SalesMotion>
                );
              }

              return (
                <SalesMotion key={item.id} transition={{ delay: index * 0.05 }}>
                  <button
                    type="button"
                    onClick={() => handleCardClick(item.id)}
                    className="flex min-h-[108px] w-full flex-col justify-between rounded-2xl border border-white/10 bg-[#0f172a]/55 p-4 text-left shadow-lg backdrop-blur-xl transition hover:border-amber-400/25 hover:bg-amber-400/[0.05] sm:min-h-[120px] sm:p-5"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-200">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold leading-snug text-white sm:text-base">
                        {item.label}
                      </span>
                      <span className="mt-1 block text-[11px] leading-relaxed text-white/45 sm:text-xs">
                        {item.description}
                      </span>
                    </span>
                  </button>
                </SalesMotion>
              );
            })}
          </div>

          {error && !activeFlow ? (
            <p className="mt-4 text-sm text-rose-300/90" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </section>

      <QuickAccessModal
        open={activeFlow === "digital"}
        title="Dijital Kod Gir"
        subtitle="Kart veya hediye paketindeki 8 haneli kodu gir."
        onClose={closeModal}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-white/55">8 Haneli Kod</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            value={digitalCode}
            onChange={(event) =>
              setDigitalCode(normalizeDigitalAccessCode(event.target.value))
            }
            placeholder="12345678"
            className={`${INPUT_CLASS} font-mono tracking-[0.25em]`}
          />
        </label>

        {error ? (
          <p className="mt-3 text-sm text-rose-300/90" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleDigitalSubmit}
          disabled={loading || digitalCode.length !== 8}
          className={`${PRIMARY_BUTTON_CLASS} mt-5`}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Kodu Doğrula
        </button>
      </QuickAccessModal>

      <QuickAccessModal
        open={activeFlow === "expert"}
        title="AstroTag Uzmanıyım"
        subtitle="Platforma katılmak veya mevcut uzman kodunla giriş yap."
        onClose={closeModal}
      >
        <div className="space-y-3">
          <Link
            href={SALES_EXPERT_APPLY_PATH}
            onClick={closeModal}
            className={`${PRIMARY_BUTTON_CLASS} text-center`}
          >
            Kayıt Ol
          </Link>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setActiveFlow("expert-code");
            }}
            className={GHOST_BUTTON_CLASS}
          >
            Kodum Var
          </button>
        </div>
      </QuickAccessModal>

      <QuickAccessModal
        open={activeFlow === "expert-code"}
        title="Uzman Kodu"
        subtitle="EXP-XXXX-XXXX formatındaki davet kodunu gir."
        onClose={closeModal}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-white/55">Uzman Kodu</span>
          <input
            type="text"
            autoComplete="off"
            value={expertCode}
            onChange={(event) =>
              setExpertCode(formatExpertAccessCodeInput(event.target.value))
            }
            placeholder="EXP-1234-5678"
            className={`${INPUT_CLASS} font-mono uppercase tracking-wider`}
          />
        </label>

        {error ? (
          <p className="mt-3 text-sm text-rose-300/90" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={handleExpertSubmit}
            disabled={loading || expertCode.length < 13}
            className={PRIMARY_BUTTON_CLASS}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Uzman Olarak Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setActiveFlow("expert");
            }}
            className={GHOST_BUTTON_CLASS}
            disabled={loading}
          >
            Geri
          </button>
        </div>
      </QuickAccessModal>
    </>
  );
}
