"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { confirmStorageAccessAction } from "@/lib/actions/nfc-auth";
import { PRIVATE_MODE_PATH, SESSION_EXPIRED_PATH } from "@/lib/nfc/constants";
import { isPrivateBrowsingMode } from "@/lib/nfc/private-mode";

const SKIP_PATHS = new Set([
  PRIVATE_MODE_PATH,
  SESSION_EXPIRED_PATH,
]);

/**
 * Her sayfa yüklenişinde gizli sekme tespiti yapar;
 * geçerliyse storage doğrulama cookie'sini set eder.
 */
export default function SecurityBootstrap() {
  const router = useRouter();
  const pathname = usePathname();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current || SKIP_PATHS.has(pathname)) {
      return;
    }

    checkedRef.current = true;

    void (async () => {
      if (await isPrivateBrowsingMode()) {
        router.replace(PRIVATE_MODE_PATH);
        return;
      }

      await confirmStorageAccessAction();
    })();
  }, [pathname, router]);

  return null;
}
