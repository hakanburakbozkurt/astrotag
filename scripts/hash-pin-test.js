/**
 * PIN → bcrypt hash testi
 *
 * Kullanım (proje kökünden):
 *   node scripts/hash-pin-test.js
 *   node scripts/hash-pin-test.js 1234
 *   node scripts/hash-pin-test.js 1234 10
 *
 * İsteğe bağlı: mevcut DB hash ile karşılaştır
 *   node scripts/hash-pin-test.js 1234 10 "$2b$10$..."
 */

const bcrypt = require("bcryptjs");

const pin = (process.argv[2] || "1234").trim();
const rounds = Number(process.argv[3] || 10);
const existingHash = process.argv[4]?.trim() || null;

if (!pin) {
  console.error("HATA: PIN boş olamaz.");
  process.exit(1);
}

if (!Number.isInteger(rounds) || rounds < 4 || rounds > 15) {
  console.error("HATA: rounds 4–15 arasında tam sayı olmalı (varsayılan: 10).");
  process.exit(1);
}

console.log("--- hash-pin-test ---");
console.log("PIN:", pin);
console.log("PIN uzunluğu:", pin.length);
console.log("PIN json:", JSON.stringify(pin));
console.log("bcrypt rounds:", rounds);

const hash = bcrypt.hashSync(pin, rounds);

console.log("");
console.log("Üretilen hash (bcrypt.hashSync):");
console.log(hash);
console.log("");
console.log("Hash uzunluğu:", hash.length);
console.log("Hash json:", JSON.stringify(hash));
console.log("looksLikeBcrypt ($2...):", hash.startsWith("$2"));

const selfCompare = bcrypt.compareSync(pin, hash);
console.log("");
console.log("Yerel doğrulama (üretilen hash vs PIN):", selfCompare ? "OK" : "FAIL");

if (existingHash) {
  const againstDb = bcrypt.compareSync(pin, existingHash);
  console.log("");
  console.log("DB hash ile karşılaştırma:");
  console.log("DB hash:", existingHash);
  console.log("DB hash uzunluğu:", existingHash.length);
  console.log("Sonuç:", againstDb ? "OK — PIN eşleşiyor" : "FAIL — PIN eşleşmiyor");
}

console.log("");
console.log("Supabase SQL (nfc_user_data.pin_hash güncelleme örneği):");
console.log(
  `UPDATE nfc_user_data SET pin_hash = '${hash}' WHERE nfc_id = 'at_2f8a9c4d';`
);
