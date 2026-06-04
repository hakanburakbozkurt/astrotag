"use client";

/**
 * Hydration öncesi güvenli tam sayfa yönlendirme.
 * Otomatik redirect'ler (useEffect, guard, bootstrap) router.push kullanmaz.
 */
export function clientRedirect(href: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.location.assign(href);
}
