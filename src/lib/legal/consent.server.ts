import "server-only";

import { headers } from "next/headers";
import {
  type ConsentRequirement,
  type ConsentType,
  consentRequirementsToJson,
} from "@/lib/legal/consent-config";
import { createServiceRoleClient } from "@/lib/supabase/service";

export class ConsentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConsentValidationError";
  }
}

export type ConsentAcceptanceInput = {
  consentType: ConsentType;
  version: string;
  isAccepted: boolean;
};

async function readRequestMeta(): Promise<{
  ipAddress: string | null;
  userAgent: string | null;
}> {
  const headerStore = await headers();

  const forwarded = headerStore.get("x-forwarded-for");
  const ipAddress =
    forwarded?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip")?.trim() ??
    null;
  const userAgent = headerStore.get("user-agent");

  return { ipAddress, userAgent };
}

export async function checkConsent(
  authUserId: string,
  consentType: ConsentType,
  version: string
): Promise<boolean> {
  const admin = createServiceRoleClient();

  const { data, error } = await admin.rpc("check_consent", {
    p_user_id: authUserId,
    p_consent_type: consentType,
    p_version: version,
  });

  if (error) {
    console.error("[checkConsent]", error.message);
    return false;
  }

  return Boolean(data);
}

export async function checkRequiredConsents(
  authUserId: string,
  requirements: ConsentRequirement[]
): Promise<boolean> {
  if (requirements.length === 0) {
    return true;
  }

  const admin = createServiceRoleClient();

  const { data, error } = await admin.rpc("check_required_consents", {
    p_user_id: authUserId,
    p_requirements: consentRequirementsToJson(requirements),
  });

  if (error) {
    console.error("[checkRequiredConsents]", error.message);
    return false;
  }

  return Boolean(data);
}

export function validateConsentPayload(
  required: ConsentRequirement[],
  submitted: ConsentAcceptanceInput[] | undefined
): void {
  if (!submitted?.length) {
    throw new ConsentValidationError(
      "Devam etmek için gerekli sözleşme onaylarını kabul etmelisiniz."
    );
  }

  for (const requirement of required) {
    const match = submitted.find(
      (item) =>
        item.consentType === requirement.consentType &&
        item.version === requirement.version
    );

    if (!match?.isAccepted) {
      throw new ConsentValidationError(
        `Zorunlu onay eksik: ${requirement.consentType} (${requirement.version})`
      );
    }
  }
}

export async function recordUserConsents(input: {
  authUserId: string;
  consents: ConsentAcceptanceInput[];
}): Promise<void> {
  const accepted = input.consents.filter((item) => item.isAccepted);
  if (accepted.length === 0) {
    return;
  }

  const { ipAddress, userAgent } = await readRequestMeta();
  const admin = createServiceRoleClient();

  const rows = accepted.map((item) => ({
    user_id: input.authUserId,
    consent_type: item.consentType,
    version: item.version,
    ip_address: ipAddress,
    user_agent: userAgent,
    is_accepted: true,
  }));

  const { error } = await admin.from("user_consents").insert(rows);

  if (error) {
    console.error("[recordUserConsents]", error.message);
    throw new ConsentValidationError("Onay kayıtları oluşturulamadı.");
  }
}

export async function assertRequiredConsentsInDb(
  authUserId: string,
  requirements: ConsentRequirement[]
): Promise<void> {
  const ok = await checkRequiredConsents(authUserId, requirements);

  if (!ok) {
    throw new ConsentValidationError(
      "Güncel sözleşme onayları bulunamadı. Lütfen kullanım koşullarını yeniden kabul edin."
    );
  }
}
