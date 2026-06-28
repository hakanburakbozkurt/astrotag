"use client";

import { useEffect } from "react";
import {
  clearStaleActionReloadAttempts,
  isStaleServerActionError,
  markStaleActionReloadAttempt,
  reloadForStaleServerAction,
} from "@/lib/errors/stale-server-action";

function handleStaleRuntimeError(reason: unknown): boolean {
  if (!isStaleServerActionError(reason)) {
    return false;
  }

  if (!markStaleActionReloadAttempt()) {
    return false;
  }

  reloadForStaleServerAction();
  return true;
}

export default function StaleActionGuard() {
  useEffect(() => {
    clearStaleActionReloadAttempts();

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      if (handleStaleRuntimeError(event.reason)) {
        event.preventDefault();
      }
    }

    function onWindowError(event: ErrorEvent) {
      if (handleStaleRuntimeError(event.error ?? event.message)) {
        event.preventDefault();
      }
    }

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onWindowError);

    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onWindowError);
    };
  }, []);

  return null;
}
