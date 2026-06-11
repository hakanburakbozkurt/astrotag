/**
 * Acil durum: nfc_cards.pin_hash güncelleme
 *
 * Kullanım (proje kökünden):
 *   node scripts/reset-pin.js
 *   node scripts/reset-pin.js at_2f8a9c4d 1234
 *
 * Gerekli env (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DEFAULT_UNIQUE_ID = "at_2f8a9c4d";
const DEFAULT_PIN = "1234";
const BCRYPT_ROUNDS = 10;

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function supabaseHeaders(serviceRoleKey) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };
}

async function supabaseRest(
  supabaseUrl,
  serviceRoleKey,
  method,
  pathSuffix,
  body
) {
  const url = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${pathSuffix}`;
  const headers = {
    ...supabaseHeaders(serviceRoleKey),
    ...(method === "PATCH" || method === "POST"
      ? { Prefer: "return=representation" }
      : {}),
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    throw new Error(
      `Supabase ${method} ${pathSuffix} → ${response.status}: ${text}`
    );
  }

  return data;
}

async function main() {
  loadEnvLocal();

  const uniqueId = (process.argv[2] || DEFAULT_UNIQUE_ID).trim();
  const pin = (process.argv[3] || DEFAULT_PIN).trim();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "HATA: NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli (.env.local)"
    );
    process.exit(1);
  }

  if (!uniqueId || !pin) {
    console.error("HATA: unique_id ve PIN boş olamaz.");
    process.exit(1);
  }

  const pinHash = bcrypt.hashSync(pin, BCRYPT_ROUNDS);

  console.log("--- reset-pin ---");
  console.log("unique_id:", uniqueId);
  console.log("PIN uzunluğu:", pin.length);
  console.log("Üretilen hash (bcrypt.hashSync, rounds=10):", pinHash);
  console.log("Hash uzunluğu:", pinHash.length);

  const encodedUniqueId = encodeURIComponent(uniqueId);

  const existingRows = await supabaseRest(
    supabaseUrl,
    serviceRoleKey,
    "GET",
    `nfc_cards?unique_id=eq.${encodedUniqueId}&select=id,unique_id,pin_hash,is_active`
  );

  const existing = Array.isArray(existingRows) ? existingRows[0] : null;

  if (!existing) {
    console.error(`HATA: nfc_cards tablosunda unique_id='${uniqueId}' bulunamadı.`);
    process.exit(1);
  }

  console.log("Bulunan kart id:", existing.id);
  console.log("Eski pin_hash:", existing.pin_hash ?? "(null)");

  const updatedRows = await supabaseRest(
    supabaseUrl,
    serviceRoleKey,
    "PATCH",
    `nfc_cards?unique_id=eq.${encodedUniqueId}`,
    {
      pin_hash: pinHash,
      pin_set_at: new Date().toISOString(),
      pin_failed_attempts: 0,
      pin_locked_until: null,
    }
  );

  const updated = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows;

  if (!updated?.pin_hash) {
    console.error("HATA: Güncelleme yanıtı beklenen formatta değil:", updatedRows);
    process.exit(1);
  }

  const verifyOk = bcrypt.compareSync(pin, updated.pin_hash);

  console.log("Güncelleme başarılı.");
  console.log("Yeni pin_hash:", updated.pin_hash);
  console.log("Yerel doğrulama bcrypt.compareSync:", verifyOk ? "OK" : "FAIL");

  if (!verifyOk) {
    console.error("HATA: Hash yazıldı ama yerel doğrulama başarısız.");
    process.exit(1);
  }

  console.log(`PIN '${pin}' → unique_id '${uniqueId}' için ayarlandı. Uygulamada tekrar dene.`);
}

main().catch((error) => {
  console.error("Beklenmeyen hata:", error);
  process.exit(1);
});
