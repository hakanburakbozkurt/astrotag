"use client";

/**
 * Server action sonrası Set-Cookie'nin tarayıcıya işlenmesi için tam sayfa geçişi.
 * router.replace ile soft navigation, Set-Cookie'nin henüz işlenmediği
 * isteklerde middleware oturumu görmeyebilir.
 */
export function navigateAfterNfcAuth(redirectTo: string): void {
  window.location.assign(redirectTo);
}
