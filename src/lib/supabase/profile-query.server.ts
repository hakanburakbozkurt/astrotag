import "server-only";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

export function firstRow<T>(rows: T[] | null | undefined): T | null {
  return rows?.[0] ?? null;
}

type RowQueryResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

export async function fetchProfileByUserId<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  authUserId: string,
  select: string
): Promise<RowQueryResult<T>> {
  const { data, error } = await supabase
    .from("profiles")
    .select(select)
    .eq("user_id", authUserId)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1);

  return { data: firstRow(data as T[] | null) ?? null, error };
}

export async function fetchExpertProfileByProfileId<
  T extends Record<string, unknown>,
>(
  supabase: SupabaseClient,
  profileId: string,
  select: string
): Promise<RowQueryResult<T>> {
  const { data, error } = await supabase
    .from("expert_profiles")
    .select(select)
    .eq("profile_id", profileId)
    .order("updated_at", { ascending: false })
    .limit(1);

  return { data: firstRow(data as T[] | null) ?? null, error };
}

export async function fetchProfileByNfcUid<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  nfcUid: string,
  select: string
): Promise<RowQueryResult<T>> {
  const { data, error } = await supabase
    .from("profiles")
    .select(select)
    .eq("nfc_uid", nfcUid)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1);

  return { data: firstRow(data as T[] | null) ?? null, error };
}
