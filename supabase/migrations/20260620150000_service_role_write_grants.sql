-- Sunucu yazımları (service_role) için açık yetkiler — RLS bypass zaten aktif,
-- grant eksikliği PostgREST insert/select hatalarını önler.

grant all on table public.stars_ledger to service_role;
grant all on table public.cosmic_readings to service_role;
grant all on table public.cosmic_logs to service_role;
grant all on table public.profiles to service_role;
grant all on table public.user_badges to service_role;
