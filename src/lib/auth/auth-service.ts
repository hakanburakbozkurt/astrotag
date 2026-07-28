/**
 * AstroTag Auth servis katmanı — Supabase oturum + şifre sıfırlama.
 *
 * Giriş yöntemleri (AuthMethod):
 * - email_password   → auth-email.ts
 * - digital_code     → quick-access.ts (redeemDigitalAccessCodeAction)
 * - expert_magic_link→ expert-auth.server.ts
 * - guest_anonymous  → finalizeGuestAccessAction
 *
 * Edge/middleware: Supabase JWT (proxy getUser + refresh).
 * Client: AuthSessionBootstrap ile sessiz token yenileme.
 */

export type { AuthMethod, AuthSessionSnapshot, AuthActionResult } from "./auth-service.types";
export {
  SUPABASE_AUTH_CLIENT_OPTIONS,
  SUPABASE_AUTH_SERVER_OPTIONS,
  AUTH_FORGOT_PASSWORD_PATH,
  AUTH_RESET_PASSWORD_PATH,
} from "./auth-config";

export {
  getServerAuthSession,
  requestPasswordResetEmail,
  updateAuthenticatedPassword,
} from "./auth-service.server";

export {
  getAuthServiceClient,
  getClientAuthSession,
  subscribeToAuthSessionChanges,
} from "./auth-service.client";
