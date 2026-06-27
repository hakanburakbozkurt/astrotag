"use client";

import { useEffect } from "react";
import { useCosmicToast } from "@/hooks/useCosmicToast";

const WELCOME_TOAST_KEY = "astrotag-welcome-toast";

export default function ToastBootstrap() {
  const { ready, welcome } = useCosmicToast();

  useEffect(() => {
    if (!ready || sessionStorage.getItem(WELCOME_TOAST_KEY)) {
      return;
    }

    const timer = window.setTimeout(() => {
      welcome();
      sessionStorage.setItem(WELCOME_TOAST_KEY, "1");
    }, 10_000);

    return () => window.clearTimeout(timer);
  }, [ready, welcome]);

  return null;
}
