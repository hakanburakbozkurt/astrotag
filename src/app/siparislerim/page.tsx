import Link from "next/link";
import Starfield from "@/components/Starfield";
import SalesNav from "@/components/sales/SalesNav";
import {
  buildPurchaseSuccessUrl,
  NFC_KEYCHAIN_PRODUCT,
} from "@/lib/sales/star-packages-catalog";

export default function SiparislerimPage() {
  return (
    <main className="astrotag-sales relative min-h-dvh bg-[#070b14] text-white">
      <Starfield />
      <SalesNav />

      <div className="mx-auto max-w-lg px-4 py-24 sm:px-6 sm:py-28">
        <p className="text-[10px] uppercase tracking-[0.28em] text-amber-400/70">
          Sipariş Takibi
        </p>
        <h1 className="mt-2 text-2xl font-bold text-white">Siparişlerim</h1>
        <p className="mt-4 text-sm leading-relaxed text-white/55">
          Sipariş onayı ve kargo bilgileri kayıtlı e-posta adresinize gönderilir. NFC
          anahtarlık tesliminden sonra{" "}
          <Link href={buildPurchaseSuccessUrl(NFC_KEYCHAIN_PRODUCT.id)} className="text-amber-200/85 underline">
            Kozmik Başlangıç
          </Link>{" "}
          sayfasından aktivasyonu başlatabilirsiniz.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-6 text-sm font-medium text-white/80 transition hover:border-amber-400/25"
        >
          Alışverişe Devam Et
        </Link>
      </div>
    </main>
  );
}
