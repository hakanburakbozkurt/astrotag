"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  buildPurchaseSuccessUrl,
  STAR_PACKAGE_CATALOG,
  type StarPackageProduct,
} from "@/lib/sales/star-packages-catalog";

function PackageCard({ product, index }: { product: StarPackageProduct; index: number }) {
  const router = useRouter();
  const isFeatured = Boolean(product.featured);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex flex-col rounded-[24px] border p-5 backdrop-blur-xl ${
        isFeatured
          ? "border-amber-400/35 bg-amber-400/[0.08] shadow-[0_0_40px_rgba(251,191,36,0.12)]"
          : "border-white/10 bg-[#0f172a]/72"
      }`}
    >
      {product.badge ? (
        <span className="mb-3 inline-flex w-fit rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-amber-100">
          {product.badge}
        </span>
      ) : null}

      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">{product.title}</h3>
        <p className="text-lg font-semibold text-amber-200/90">{product.priceLabel}</p>
      </div>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-white/50">{product.description}</p>

      <button
        type="button"
        onClick={() => router.push(buildPurchaseSuccessUrl(product.id))}
        className={`mt-5 min-h-11 w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
          isFeatured
            ? "bg-amber-400/95 text-[#0f172a] hover:bg-amber-300"
            : "border border-amber-400/25 bg-amber-400/10 text-amber-100 hover:bg-amber-400/18"
        }`}
      >
        Satın Al
      </button>
    </motion.article>
  );
}

export default function StarPackageGrid() {
  return (
    <section id="yildiz-paketleri" className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
          Yıldız Paketleri
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">7&apos;li Kozmik Stok</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
          Oracle modüllerinde kullanılacak yıldız bakiyenizi tek seferde yükleyin. Analiz
          sayfalarına yönlendirme yok — önce satın al, sonra anahtarlığını aktive et.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STAR_PACKAGE_CATALOG.map((product, index) => (
            <PackageCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
