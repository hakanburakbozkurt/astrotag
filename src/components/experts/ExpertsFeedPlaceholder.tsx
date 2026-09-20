"use client";

/** Instagram tarzı akış — uzman/kullanıcı gönderileri buraya entegre edilecek */
export default function ExpertsFeedPlaceholder() {
  return (
    <section
      aria-label="Uzman akışı"
      className="min-h-[280px] border-t border-zinc-800/80 pt-6"
    >
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-12 text-center">
        <p className="font-serif text-base text-zinc-400">Akış yakında</p>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-600">
          Uzman ve topluluk gönderileri burada listelenecek. Bir uzman seçerek
          profiline geçebilirsiniz.
        </p>
      </div>
    </section>
  );
}
