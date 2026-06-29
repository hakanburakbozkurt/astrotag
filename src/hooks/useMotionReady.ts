"use client";

import { useEffect, useState } from "react";

/**
 * Framer Motion mount animasyonları SSR/hydration sonrası tetiklenir.
 * İlk render (server + hydration) false; client mount sonrası true.
 */
export function useMotionReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return ready;
}
