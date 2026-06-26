-- Geliştirme / test: uygulama verilerini sıfırla (şema korunur)
-- auth.users silinmez — yalnızca public uygulama tabloları.
--
-- Supabase SQL Editor veya: psql -f supabase/scripts/truncate_dev_data.sql

begin;

truncate table
  public.nfc_sessions,
  public.trusted_devices,
  public.referrals,
  public.tarot_history,
  public.tarot_readings,
  public.cosmic_readings,
  public.nfc_authorized_keys,
  public.nfc_user_data,
  public.nfc_cards,
  public.profiles
restart identity cascade;

commit;

-- Doğrulama (opsiyonel):
-- select 'profiles' as t, count(*) from public.profiles
-- union all select 'nfc_user_data', count(*) from public.nfc_user_data
-- union all select 'nfc_sessions', count(*) from public.nfc_sessions;
