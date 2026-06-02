import "server-only";

import { logNfcErrorAndThrow, toError } from "@/lib/nfc/error-logger";
import { throwIfSupabaseError } from "@/lib/nfc/supabase-nfc.server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { StoredPasskey } from "@/lib/webauthn/server";

const CTX = { layer: "action" as const, handler: "trusted-devices" };

export type TrustedDeviceRow = {
  id: string;
  nfc_id: string;
  device_token: string;
  user_id: string;
  credential_public_key: string | null;
  counter: number;
  transports: string[] | null;
};

export async function findTrustedDevice(
  nfcId: string,
  deviceToken: string
): Promise<TrustedDeviceRow | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("trusted_devices")
    .select(
      "id, nfc_id, device_token, user_id, credential_public_key, counter, transports"
    )
    .eq("nfc_id", nfcId.trim())
    .eq("device_token", deviceToken.trim())
    .maybeSingle();

  if (error) {
    throwIfSupabaseError(error, { ...CTX, handler: "findTrustedDevice" }, "select", {
      nfcId,
    });
  }

  if (!data) {
    return null;
  }

  return data as TrustedDeviceRow;
}

export async function getPasskeyForDevice(
  nfcId: string,
  deviceToken: string
): Promise<StoredPasskey | null> {
  const row = await findTrustedDevice(nfcId, deviceToken);

  if (!row?.credential_public_key) {
    return null;
  }

  return {
    credentialId: row.device_token,
    publicKey: row.credential_public_key,
    counter: row.counter ?? 0,
    transports: (row.transports ?? undefined) as StoredPasskey["transports"],
  };
}

export async function registerTrustedPasskey(params: {
  nfcId: string;
  userId: string;
  credential: StoredPasskey;
}): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const handler = "registerTrustedPasskey";

  const { error: deleteError } = await supabase
    .from("trusted_devices")
    .delete()
    .eq("nfc_id", params.nfcId.trim());

  throwIfSupabaseError(
    deleteError,
    { ...CTX, handler },
    "trusted_devices.delete",
    { nfcId: params.nfcId, userId: params.userId }
  );

  const { error: insertError } = await supabase.from("trusted_devices").insert({
    nfc_id: params.nfcId.trim(),
    device_token: params.credential.credentialId,
    user_id: params.userId,
    credential_public_key: params.credential.publicKey,
    counter: params.credential.counter,
    transports: params.credential.transports ?? [],
  });

  throwIfSupabaseError(
    insertError,
    { ...CTX, handler },
    "trusted_devices.insert",
    { nfcId: params.nfcId, userId: params.userId }
  );
}

export async function updatePasskeyCounter(
  nfcId: string,
  deviceToken: string,
  counter: number
): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("trusted_devices")
    .update({ counter })
    .eq("nfc_id", nfcId.trim())
    .eq("device_token", deviceToken.trim());

  throwIfSupabaseError(
    error,
    { ...CTX, handler: "updatePasskeyCounter" },
    "trusted_devices.update",
    { nfcId, deviceToken }
  );
}

export async function hasTrustedDevicesForCard(nfcId: string): Promise<boolean> {
  const supabase = createSupabaseServiceClient();
  const { count, error } = await supabase
    .from("trusted_devices")
    .select("id", { count: "exact", head: true })
    .eq("nfc_id", nfcId.trim());

  if (error) {
    throwIfSupabaseError(
      error,
      { ...CTX, handler: "hasTrustedDevicesForCard" },
      "trusted_devices.count",
      { nfcId }
    );
  }

  return (count ?? 0) > 0;
}
