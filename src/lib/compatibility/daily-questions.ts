const RELATIONSHIP_QUESTION_POOL = [
  "Bugün iletişimimiz nasıl olacak?",
  "Partnerimle gerginlik yaşar mıyız?",
  "Bugün romantik bir bağ kurma şansımız var mı?",
  "Partnerim beni duyuyor mu, anlaşılıyor muyum?",
  "Bugün birlikte verimli karar alabilir miyiz?",
  "Duygusal olarak birbirimize yakın mıyız?",
  "Bugün kıskançlık veya güvensizlik tetiklenebilir mi?",
  "Partnerimle ortak bir hedefe odaklanmalı mıyız?",
  "Bugün barışma veya uzlaşma enerjisi güçlü mü?",
  "Fiziksel çekim ve yakınlık bugün nasıl?",
  "Partnerimle derin bir sohbet için uygun zaman mı?",
  "Bugün sınırlarımızı netleştirmeli miyiz?",
  "İlişkimizde bugün sürpriz bir gelişme olabilir mi?",
  "Partnerimle birlikte sakin kalmak zor olur mu?",
  "Bugün Venüs-Mars ekseninde uyum nasıl?",
  "Birlikte plan yapmak için doğru gün mü?",
  "Partnerimle empati kurmak bugün kolay mı?",
  "Bugün geçmiş bir konuyu tekrar açmalı mıyız?",
];

function hashSeed(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getDailyCompatibilityQuestions(
  date: Date = new Date(),
  userId = "guest"
): string[] {
  const dayKey = date.toISOString().slice(0, 10);
  const random = mulberry32(hashSeed(`${dayKey}:${userId}`));
  const pool = [...RELATIONSHIP_QUESTION_POOL];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }

  return pool.slice(0, 3);
}

export function getDailyCompatibilityDateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
