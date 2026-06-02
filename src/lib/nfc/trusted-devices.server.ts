import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { StoredPasskey } from "@/lib/webauthn/server";

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

  if (error || !data) {
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
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createSupabaseServiceClient();

  const { error: deleteError } = await supabase
    .from("trusted_devices")
    .delete()
    .eq("nfc_id", params.nfcId.trim());

  if (deleteError) {
    console.error("TRUSTED_DEVICES_DELETE_ERROR:", deleteError.message);
    return { ok: false, error: "Cihaz kaydı güncellenemedi." };
  }

  const { error: insertError } = await supabase.from("trusted_devices").insert({
    nfc_id: params.nfcId.trim(),
    device_token: params.credential.credentialId,
    user_id: params.userId,
    credential_public_key: params.credential.publicKey,
    counter: params.credential.counter,
    transports: params.credential.transports ?? [],
  });

  if (insertError) {
    console.error("TRUSTED_DEVICES_INSERT_ERROR:", insertError.message);
    return { ok: false, error: "Cihaz güvenilir listesine eklenemedi." };
  }

  return { ok: true };
}

export async function updatePasskeyCounter(
  nfcId: string,
  deviceToken: string,
  counter: number
): Promise<void> {
  const supabase = createSupabaseServiceClient();
  await supabase
    .from("trusted_devices")
    .update({ counter })
    .eq("nfc_id", nfcId.trim())
    .eq("device_token", deviceToken.trim());
}

export async function hasTrustedDevicesForCard(nfcId: string): Promise<boolean> {
  const supabase = createSupabaseServiceClient();
  const { count, error } = await supabase
    .from("trusted_devices")
    .select("id", { count: "exact", head: true })
    .eq("nfc_id", nfcId.trim());

  return !error && (count ?? 0) > 0;
}
