-- user_manifestos: eksik updated_at sütunu (upsert/select uyumu)

alter table public.user_manifestos
  add column if not exists updated_at timestamptz not null default now();

comment on column public.user_manifestos.updated_at is
  'Son manifesto kaydı veya niyet güncellemesi zamanı';

create index if not exists user_manifestos_profile_updated_idx
  on public.user_manifestos (profile_id, updated_at desc);

-- Güncelleme anında updated_at otomatik yenilensin (upsert payload olmasa bile)
create or replace function public.touch_user_manifestos_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_manifestos_set_updated_at on public.user_manifestos;

create trigger user_manifestos_set_updated_at
  before update on public.user_manifestos
  for each row
  execute function public.touch_user_manifestos_updated_at();
