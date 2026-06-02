"use client";

/**
 * Server action sonrası Set-Cookie'nin tarayıcıya işlenmesi için tam sayfa geçişi.
 * router.replace ile soft navigation, iOS Safari'de middleware'in çerezsiz istek
 * görmesine ve device_bound_missing → reauth döngüsüne yol açabiliyor.
 */
export function navigateAfterNfcAuth(redirectTo: string): void {
  window.location.assign(redirectTo);
}
