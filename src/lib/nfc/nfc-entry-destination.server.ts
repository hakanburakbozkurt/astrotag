import "server-only";

import type { ModuleId } from "@/components/dashboard/modules/config";

const MODULE_DESTINATIONS: Record<ModuleId, string> = {
  tarot: "/dashboard?module=tarot",
  "cosmic-profile": "/dashboard?module=cosmic-profile",
  horary: "/dashboard/oracle/horary",
  "natal-chart": "/dashboard/natal",
  synastry: "/dashboard/bonds",
};

const MODULE_ALIASES: Record<string, ModuleId> = {
  tarot: "tarot",
  "cosmic-profile": "cosmic-profile",
  cosmic: "cosmic-profile",
  profile: "cosmic-profile",
  horary: "horary",
  oracle: "horary",
  natal: "natal-chart",
  "natal-chart": "natal-chart",
  chart: "natal-chart",
  synastry: "synastry",
  bonds: "synastry",
  compatibility: "synastry",
};

/** NFC etiket URL'sindeki ?module= veya ?to= değerini güvenli dashboard rotasına çevirir */
export function resolveNfcModuleDestination(
  params?: Record<string, string | string[] | undefined>
): string | null {
  if (!params) {
    return null;
  }

  const rawTo = pickQueryValue(params.to);
  if (rawTo && isRelativeAppPath(rawTo)) {
    return rawTo;
  }

  const rawModule = pickQueryValue(params.module);
  if (!rawModule) {
    return null;
  }

  const moduleId = MODULE_ALIASES[rawModule.trim().toLowerCase()];
  if (!moduleId) {
    return null;
  }

  return MODULE_DESTINATIONS[moduleId];
}

function pickQueryValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? null;
  }

  return value?.trim() ?? null;
}

function isRelativeAppPath(path: string): boolean {
  const normalized = path.trim();
  return (
    normalized.startsWith("/") &&
    !normalized.startsWith("//") &&
    (normalized.startsWith("/dashboard") ||
      normalized.startsWith("/profile-setup") ||
      normalized.startsWith("/profile"))
  );
}
