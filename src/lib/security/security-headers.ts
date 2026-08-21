type Header = { key: string; value: string };

function resolveSupabaseConnectOrigins(): string[] {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) {
    return ["https://*.supabase.co", "wss://*.supabase.co"];
  }

  try {
    const origin = new URL(raw).origin;
    const wsOrigin = origin.replace(/^https:/, "wss:");
    return [origin, wsOrigin];
  } catch {
    return ["https://*.supabase.co", "wss://*.supabase.co"];
  }
}

function buildContentSecurityPolicy(isDev: boolean): string {
  const connectSrc = [
    "'self'",
    ...resolveSupabaseConnectOrigins(),
    "https://geocoding-api.open-meteo.com",
  ];

  const scriptSrc = isDev
    ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
    : ["'self'", "'unsafe-inline'"];

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    `connect-src ${connectSrc.join(" ")}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "manifest-src 'self'",
    "worker-src 'self'",
  ].join("; ");
}

/** Next.js headers() — CSP ve temel güvenlik başlıkları */
export function buildSecurityHeaders(): Header[] {
  const isDev = process.env.NODE_ENV !== "production";

  const headers: Header[] = [
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy(isDev),
    },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=()",
    },
    { key: "X-DNS-Prefetch-Control", value: "on" },
  ];

  if (!isDev) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return headers;
}
