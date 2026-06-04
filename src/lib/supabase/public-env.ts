/**
 * NEXT_PUBLIC_* Supabase değişkenleri — trim + boşluk kontrolü.
 * Vercel'de SUPABASE_URL / SUPABASE_ANON_KEY (NEXT_PUBLIC_ olmadan) tarayıcıda çalışmaz.
 */

function trimEnv(value: string | undefined): string {
  return value?.trim() ?? "";
}

export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
};

export function getSupabasePublicEnv(): SupabasePublicEnv {
  const url = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url) {
    throw new Error(
      [
        "NEXT_PUBLIC_SUPABASE_URL eksik veya boş.",
        "Vercel → Settings → Environment Variables:",
        "  NEXT_PUBLIC_SUPABASE_URL = Supabase → Project Settings → API → Project URL",
        "(SUPABASE_URL adıyla tanımlanan değer istemciye gitmez.)",
      ].join(" ")
    );
  }

  if (!anonKey) {
    throw new Error(
      [
        "NEXT_PUBLIC_SUPABASE_ANON_KEY eksik veya boş.",
        "Vercel → Settings → Environment Variables:",
        "  NEXT_PUBLIC_SUPABASE_ANON_KEY = Supabase → API → anon public key",
        "(SUPABASE_ANON_KEY prefix'siz değişken Next.js tarayıcı bundle'ında yoktur.)",
      ].join(" ")
    );
  }

  return { url, anonKey };
}

/** Terminalde env varlığını doğrula (anahtar maskeli). */
export function logSupabasePublicEnvCheck(context: string): void {
  const url = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.log(
    `NFC_AUTH: Supabase env [${context}]`,
    JSON.stringify(
      {
        hasUrl: Boolean(url),
        urlHost: url ? safeUrlHost(url) : null,
        hasAnonKey: Boolean(anonKey),
        anonKeySuffix: anonKey ? `…${anonKey.slice(-4)}` : null,
      },
      null,
      2
    )
  );
}

function safeUrlHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return "(geçersiz URL)";
  }
}
