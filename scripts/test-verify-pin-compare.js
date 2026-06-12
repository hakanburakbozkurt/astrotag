/**
 * verifyPin bcrypt karşılaştırmasını yerelde simüle eder (Vercel log formatı).
 *
 *   node scripts/test-verify-pin-compare.js
 *   node scripts/test-verify-pin-compare.js at_2f8a9c4d 1234
 */

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DEFAULT_UNIQUE_ID = "at_2f8a9c4d";
const DEFAULT_PIN = "1234";

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();

  const uniqueId = (process.argv[2] || DEFAULT_UNIQUE_ID).trim();
  const inputPin = process.argv[3] || DEFAULT_PIN;
  const pinToVerify = String(inputPin ?? "").trim();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("HATA: .env.local içinde Supabase env eksik.");
    process.exit(1);
  }

  const url = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/nfc_user_data?nfc_id=eq.${encodeURIComponent(uniqueId)}&select=id,nfc_id,pin_hash`;
  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  const rows = await response.json();
  const row = Array.isArray(rows) ? rows[0] : null;

  console.log("[test] DB kart sorgusu", { uniqueId, found: Boolean(row) });

  if (!row?.pin_hash) {
    throw new Error(`dbPinHash boş — unique_id: ${uniqueId}`);
  }

  const dbPinHashRaw = row.pin_hash ?? "";
  const dbPinHash = dbPinHashRaw.trim();

  if (!dbPinHash) {
    throw new Error(`dbPinHash trim sonrası boş — unique_id: ${uniqueId}`);
  }

  console.log("--- BCRYPT DEBUG ---");
  console.log("Input PIN:", pinToVerify);
  console.log("DB Hash:", dbPinHash);
  console.log("Hash Type:", typeof dbPinHash);
  console.log("Input Type:", typeof pinToVerify);

  const match = await bcrypt.compare(pinToVerify, dbPinHash);
  console.log("Bcrypt Result:", match);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
