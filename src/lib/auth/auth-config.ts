/**
 * Supabase Auth — merkezi istemci ayarları.
 * Süresiz JWT yok; refresh token ile otomatik yenileme açık.
 */
export const SUPABASE_AUTH_CLIENT_OPTIONS = {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
} as const;

export const SUPABASE_AUTH_SERVER_OPTIONS = {
  persistSession: true,
  autoRefreshToken: true,
} as const;

export const AUTH_FORGOT_PASSWORD_PATH = "/auth/forgot-password";
export const AUTH_RESET_PASSWORD_PATH = "/auth/reset-password";
