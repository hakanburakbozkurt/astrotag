/**
 * Geçici Resend test script'i — prod öncesi silinebilir.
 *
 * Kullanım:
 *   npx tsx test-email.ts
 *   npx tsx test-email.ts alici@ornek.com
 *
 * Gerekli env: RESEND_API_KEY (.env veya .env.local)
 * Opsiyonel: TEST_EMAIL_TO (alıcı; CLI argümanı önceliklidir)
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Resend } from "resend";

const FROM_ADDRESS = "AstroTag <noreply@astrotag.app>";
const DEFAULT_TO = "delivered@resend.dev";

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function loadEnv(): void {
  const root = process.cwd();
  loadEnvFile(resolve(root, ".env"));
  loadEnvFile(resolve(root, ".env.local"));
}

async function main(): Promise<void> {
  loadEnv();

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error("❌ BAŞARISIZ: RESEND_API_KEY bulunamadı (.env veya .env.local).");
    process.exit(1);
  }

  const to =
    process.argv[2]?.trim() ||
    process.env.TEST_EMAIL_TO?.trim() ||
    DEFAULT_TO;

  const resend = new Resend(apiKey);
  const sentAt = new Date().toISOString();

  console.log("📤 Resend test maili gönderiliyor…");
  console.log(`   From: ${FROM_ADDRESS}`);
  console.log(`   To:   ${to}`);

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [to],
    subject: "AstroTag Resend test maili",
    html: `
      <div style="font-family: sans-serif; line-height: 1.6; color: #111;">
        <h1 style="color: #d97706;">AstroTag test maili</h1>
        <p>Bu mesaj <code>test-email.ts</code> script'i ile gönderildi.</p>
        <p><strong>Domain:</strong> astrotag.app</p>
        <p><strong>Zaman (UTC):</strong> ${sentAt}</p>
      </div>
    `,
    text: [
      "AstroTag test maili",
      "",
      "Bu mesaj test-email.ts script'i ile gönderildi.",
      "Domain: astrotag.app",
      `Zaman (UTC): ${sentAt}`,
    ].join("\n"),
  });

  if (error) {
    console.error("❌ BAŞARISIZ: Mail gönderilemedi.");
    console.error(JSON.stringify(error, null, 2));
    process.exit(1);
  }

  console.log("✅ BAŞARILI: Test maili gönderildi.");
  console.log(JSON.stringify(data, null, 2));
}

main().catch((cause) => {
  console.error("❌ BAŞARISIZ: Beklenmeyen hata.");
  console.error(cause instanceof Error ? cause.message : cause);
  process.exit(1);
});
