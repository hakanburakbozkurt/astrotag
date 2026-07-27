-- nfc_sessions: legacy ephemeral NFC oturum tablosu kaldırıldı.
-- Auth artık yalnızca Supabase Auth (JWT + refresh token) üzerinden yürütülür.

drop function if exists public.is_valid_nfc_session(uuid, text);

drop index if exists public.nfc_sessions_last_active_idx;
drop index if exists public.nfc_sessions_active_idx;
drop index if exists public.nfc_sessions_nfc_fingerprint_idx;
drop index if exists public.nfc_sessions_nfc_idx;

drop table if exists public.nfc_sessions cascade;

comment on schema public is
  'nfc_sessions dropped 2026-06-27 — replaced by Supabase Auth sessions';
