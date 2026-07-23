-- Astro Uzman platformu — 8 haneli davet kodu + kalıcı uzman giriş kodu

alter table public.profiles
  add column if not exists expert_code text;

create unique index if not exists profiles_expert_code_unique_idx
  on public.profiles (expert_code)
  where expert_code is not null;

comment on column public.profiles.expert_code is
  'Uzman kalıcı giriş kodu (8 hane) — kayıt sonrası atanır';

comment on column public.access_codes.code is
  'DIG: dijital misafir yükseltme | EXP: tek kullanımlık 8 haneli uzman davet kodu';

-- İlk kurulum: 100 adet tek kullanımlık uzman davet kodu (tablo boşsa)
do $$
declare
  i integer;
  new_code text;
  attempts integer;
begin
  if exists (select 1 from public.access_codes where type = 'EXP' limit 1) then
    return;
  end if;

  for i in 1..100 loop
    attempts := 0;
    loop
      attempts := attempts + 1;
      new_code := lpad((floor(random() * 100000000))::bigint::text, 8, '0');
      exit when not exists (
        select 1 from public.access_codes where code = new_code
      );
      exit when attempts > 50;
    end loop;

    insert into public.access_codes (code, type)
    values (new_code, 'EXP')
    on conflict (code) do nothing;
  end loop;
end $$;
