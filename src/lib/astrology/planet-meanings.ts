import type { PlanetId } from "@/lib/astrology/types";

/** Dokunmatik baloncukta gösterilen kısa astrolojik anlamlar */
export const PLANET_MEANINGS: Record<PlanetId, string> = {
  sun: "Kimlik, canlılık ve yaşam enerjisi — 'Ben kimim?' sorusunun cevabı.",
  moon: "Duygular, içgüdüler ve güven ihtiyacı — ruhsal pusulanız.",
  mercury: "Düşünce, iletişim ve öğrenme — zihninizin sesi.",
  venus: "Sevgi, estetik ve değerler — neye çekildiğinizin haritası.",
  mars: "Eylem, cesaret ve tutku — içsel ateşinizin yönü.",
  jupiter: "Büyüme, şans ve bilgelik — hayatınızdaki genişleme alanı.",
  saturn: "Disiplin, sorumluluk ve sınırlar — olgunlaşma dersleriniz.",
};
