import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  console.log("\n========== SUPABASE KAYIT HATASI ==========");
  console.log("Zaman:", new Date().toISOString());
  console.log("Olası sebep:", body.likelyCause ?? "—");
  console.log("Tablo:", body.table ?? "—");
  console.log("\n--- Gönderilen profileInsert ---");
  console.log(JSON.stringify(body.profileInsert ?? null, null, 2));
  console.log("\n--- Hata: message ---");
  console.log(body.error?.message ?? "—");
  console.log("\n--- Hata: code ---");
  console.log(body.error?.code ?? "—");
  console.log("\n--- Hata: details ---");
  console.log(body.error?.details ?? "—");
  console.log("\n--- Hata: hint ---");
  console.log(body.error?.hint ?? "—");
  console.log("\n--- Ham hata (JSON) ---");
  console.log(body.raw ?? "—");
  console.log("==========================================\n");

  return NextResponse.json({ ok: true });
}
