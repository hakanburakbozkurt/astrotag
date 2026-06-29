"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import Starfield from "@/components/Starfield";
import SalesNav from "@/components/sales/SalesNav";
import {
  findKeychainBundle,
  NFC_KEYCHAIN_PRODUCT,
  STAR_PACKAGE_CATALOG,
} from "@/lib/sales/star-packages-catalog";
import { NFC_LOGIN_PATH } from "@/lib/nfc/constants";

function resolveProductLabel(productId: string | null): string {
  if (!productId) {
    return "Siparişiniz";
  }

  if (productId === NFC_KEYCHAIN_PRODUCT.id) {
    return NFC_KEYCHAIN_PRODUCT.title;
  }

  const keychainBundle = productId ? findKeychainBundle(productId) : undefined;
  if (keychainBundle) {
    return keychainBundle.title;
  }

  const starPack = STAR_PACKAGE_CATALOG.find((item) => item.id === productId);
  return starPack?.title ?? "Siparişiniz";
}

function KozmikBaslangicContent() {
  const searchParams = useSearchParams();
  const purchased = searchParams.get("purchased") === "1";
  const productId = searchParams.get("product");

  if (!purchased) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
        <p className="text-sm text-white/55">
          Bu sayfa ödeme sonrası açılır. Henüz bir sipariş bulunamadı.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-400/90 px-6 text-sm font-semibold text-[#0f172a]"
        >
          Mağazaya Dön
        </Link>
      </div>
    );
  }

  const productLabel = resolveProductLabel(productId);
  const isKeychain =
    productId === NFC_KEYCHAIN_PRODUCT.id ||
    Boolean(productId && findKeychainBundle(productId));
  const giftTo = searchParams.get("giftTo");
  const giftNote = searchParams.get("giftNote");
  const zodiacSigns = searchParams.get("signs")?.split(",").filter(Boolean) ?? [];

  return (
    <div className="mx-auto max-w-lg px-4 py-24 sm:px-6 sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-[28px] border border-amber-400/25 bg-[#0f172a]/85 p-6 text-center backdrop-blur-2xl sm:p-8"
      >
        <p className="text-[10px] uppercase tracking-[0.28em] text-amber-400/75">
          Kozmik Başlangıç
        </p>
        <h1 className="mt-3 text-2xl font-bold text-white">Hoş geldiniz ✨</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          <span className="text-amber-100/90">{productLabel}</span> siparişiniz alındı.
          {giftTo ? (
            <>
              {" "}
              Hediye alıcısı: <span className="text-emerald-300/90">{giftTo}</span>.
            </>
          ) : null}
          {isKeychain
            ? " Anahtarlığınız elinize ulaştığında aktivasyonu bir dakikada tamamlayın."
            : " Yıldız bakiyeniz hesabınıza tanımlandığında NFC profilinizden kullanabilirsiniz."}
        </p>

        {zodiacSigns.length > 0 ? (
          <p className="mt-3 text-xs text-white/45">
            Burç seçimleri: {zodiacSigns.join(" · ")}
          </p>
        ) : null}

        {giftNote ? (
          <p className="mt-2 text-xs italic text-white/40">&quot;{giftNote}&quot;</p>
        ) : null}

        <div className="mt-8 space-y-3 text-left">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-xs font-semibold text-white/80">1. Anahtarlığı hazırlayın</p>
            <p className="mt-1 text-xs text-white/45">
              NFC etiketli AstroTag anahtarlığınızı telefonunuzun yakınına getirin.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-xs font-semibold text-white/80">2. Aktivasyonu başlatın</p>
            <p className="mt-1 text-xs text-white/45">
              PIN ve profil adımlarını tamamlayarak kozmik hesabınızı açın.
            </p>
          </div>
        </div>

        <Link
          href={NFC_LOGIN_PATH}
          className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-amber-400/95 px-6 text-sm font-semibold text-[#0f172a] transition hover:bg-amber-300"
        >
          Anahtarlığı Aktive Et
        </Link>

        <Link
          href="/"
          className="mt-4 inline-block text-xs text-white/40 transition hover:text-white/65"
        >
          Mağazaya dön
        </Link>
      </motion.div>
    </div>
  );
}

export default function KozmikBaslangicPage() {
  return (
    <main className="astrotag-sales relative min-h-dvh bg-[#070b14] text-white">
      <Starfield />
      <SalesNav />
      <Suspense
        fallback={
          <p className="px-4 py-24 text-center text-sm text-white/45">Yükleniyor…</p>
        }
      >
        <KozmikBaslangicContent />
      </Suspense>
    </main>
  );
}
