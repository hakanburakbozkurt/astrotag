import Link from "next/link";
import SubPageNav from "@/components/navigation/SubPageNav";
import SessionCounter from "@/components/dashboard/SessionCounter";
import {
  MAX_STAR_POINTS,
  STAR_POINTS_PER_CHARGE,
  SESSION_DURATION_HOURS,
} from "@/lib/constants/cosmic";
import { NFC_SHOP_URL } from "@/lib/nfc/constants";

export default function StarPackagesPage() {
  return (
    <div className="relative mx-auto max-w-xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <SubPageNav
        backHref="/dashboard/oracle"
        closeHref="/dashboard/oracle"
        backLabel="Oracle"
      />

      <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
        Yıldız Ekonomisi
      </p>
      <h1 className="mt-2 text-2xl font-bold text-white">Yıldız Paketi</h1>
      <p className="mt-3 text-sm leading-relaxed text-white/55">
        Kozmik Profil ve diğer Oracle modülleri yıldız puanı ile çalışır. Yıldızlarınız
        bittiğinde aşağıdaki yollarla yenileyebilirsiniz.
      </p>

      <div className="mt-6">
        <SessionCounter />
      </div>

      <section className="mt-8 space-y-4 rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5">
        <h2 className="text-sm font-semibold text-white">Ücretsiz Yenileme</h2>
        <ul className="space-y-2 text-sm text-white/55">
          <li>
            Her {SESSION_DURATION_HOURS} saatte bir otomatik +{STAR_POINTS_PER_CHARGE} yıldız
            (maks. {MAX_STAR_POINTS}).
          </li>
          <li>Profil sekmesindeki &quot;Yıldız Doldur&quot; ile anlık yenileme.</li>
        </ul>
      </section>

      <section className="mt-4 rounded-[28px] border border-amber-400/20 bg-amber-400/[0.06] p-5">
        <h2 className="text-sm font-semibold text-amber-100">Premium Yıldız</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/55">
          Fiziksel AstroTag anahtarlık ve premium paketler için resmi mağazayı ziyaret edin.
        </p>
        <Link
          href={NFC_SHOP_URL}
          target={NFC_SHOP_URL.startsWith("http") ? "_blank" : undefined}
          rel={NFC_SHOP_URL.startsWith("http") ? "noopener noreferrer" : undefined}
          className="mt-4 inline-flex rounded-xl bg-amber-400/90 px-5 py-2.5 text-sm font-semibold text-[#0f172a] hover:bg-amber-300"
        >
          Mağazaya Git
        </Link>
      </section>

      <section className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-sm font-semibold text-white">Kozmik Profil Maliyetleri</h2>
        <ul className="mt-3 space-y-2 text-sm text-white/55">
          <li>Giriş — 5 Yıldız</li>
          <li>Derinlik — 15 Yıldız</li>
          <li>Detaylı — 30 Yıldız</li>
        </ul>
        <p className="mt-3 text-xs text-white/40">
          Isabetli bulmadığınız analizler için 20 yıldız iade uygulanır.
        </p>
      </section>
    </div>
  );
}
