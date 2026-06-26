"use client";

import { useSearchParams } from "next/navigation";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

export function useNfcAuthQuery() {
  const searchParams = useSearchParams();
  const uniqueId = searchParams.get("nfc")?.trim()
    ? normalizeNfcUniqueId(searchParams.get("nfc")!.trim())
    : "";
  const email = searchParams.get("email")?.trim() ?? "";
  const msg = searchParams.get("msg")?.trim() ?? "";

  return { uniqueId, email, msg };
}
