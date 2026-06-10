-- Fix: nfc_user_data.id + nfc_sessions.nfc_id tip uyumu (uuid) + PK + FK
--
-- Kod sözleşmesi (TypeScript — hepsi runtime'da string, DB'de tipler farklı):
--   nfc_user_data.id          → uuid   — kartın dahili PK (nfcCardUuid / row.id)
--   nfc_user_data.nfc_id      → text   — URL slug: at_xxx (NFC_CARD_SLUG_COLUMN)
--   nfc_sessions.nfc_id       → uuid   — FK → nfc_user_data.id (slug DEĞİL!)
--
-- Neden 42804 / 42830?
--   • nfc_user_data tablosu migration öncesi vardı; id zaten text olabilir
--   • add column if not exists id uuid → mevcut text id sütununu değiştirmez
--   • nfc_sessions.nfc_id uuid iken nfc_user_data.id text → FK kurulamaz
--   • id üzerinde PK/UNIQUE yoksa → 42830
--
-- ─── Teşhis (isteğe bağlı) ───────────────────────────────────────────────────
-- SELECT table_name, column_name, data_type, udt_name
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name IN ('nfc_user_data', 'nfc_sessions')
--   AND column_name IN ('id', 'nfc_id')
-- ORDER BY table_name, column_name;

-- ─── 0) Bağımlı FK'leri kaldır ───────────────────────────────────────────────
do $$
declare
  con record;
begin
  for con in
    select c.conname, t.relname as table_name
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_attribute a on a.attrelid = t.oid and a.attnum = any (c.conkey)
    where c.contype = 'f'
      and t.relname = 'nfc_sessions'
      and a.attname = 'nfc_id'
  loop
    execute format(
      'alter table public.nfc_sessions drop constraint if exists %I',
      con.conname
    );
  end loop;
end $$;

-- ─── 1) nfc_user_data: slug (text) sütununu koru / legacy id'den doldur ─────
-- Eski kurulumlarda birincil anahtar text id = at_xxx olabilir.
update public.nfc_user_data
set nfc_id = trim(id::text)
where (nfc_id is null or trim(nfc_id) = '')
  and trim(coalesce(id::text, '')) ~ '^at_';

-- ─── 2) nfc_user_data.id → uuid (güvenli dönüşüm) ───────────────────────────
alter table public.nfc_user_data
  add column if not exists id_uuid uuid;

update public.nfc_user_data
set id_uuid = case
  when id_uuid is not null then id_uuid
  when id is null then gen_random_uuid()
  when trim(id::text) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    then trim(id::text)::uuid
  else gen_random_uuid()
end
where id_uuid is null;

-- Eski id sütunundaki PK / UNIQUE kısıtlarını kaldır
do $$
declare
  con record;
begin
  for con in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.nfc_user_data'::regclass
      and c.contype in ('p', 'u')
      and exists (
        select 1
        from pg_attribute a
        where a.attrelid = c.conrelid
          and a.attnum = any (c.conkey)
          and a.attname = 'id'
      )
  loop
    execute format(
      'alter table public.nfc_user_data drop constraint if exists %I',
      con.conname
    );
  end loop;
end $$;

alter table public.nfc_user_data
  drop column if exists id;

alter table public.nfc_user_data
  rename column id_uuid to id;

alter table public.nfc_user_data
  alter column id set default gen_random_uuid();

alter table public.nfc_user_data
  alter column id set not null;

-- Duplicate kontrolü
do $$
declare
  duplicate_groups integer;
begin
  select count(*) into duplicate_groups
  from (
    select id from public.nfc_user_data group by id having count(*) > 1
  ) d;

  if duplicate_groups > 0 then
    raise exception
      'nfc_user_data.id: % duplicate group(s) after uuid migration',
      duplicate_groups;
  end if;
end $$;

-- PK veya UNIQUE (FK hedefi)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.nfc_user_data'::regclass
      and contype = 'p'
  ) then
    alter table public.nfc_user_data
      add constraint nfc_user_data_pkey primary key (id);
  elsif not exists (
    select 1
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
    where c.conrelid = 'public.nfc_user_data'::regclass
      and c.contype = 'p'
      and a.attname = 'id'
  ) then
    alter table public.nfc_user_data
      add constraint nfc_user_data_id_key unique (id);
  end if;
end $$;

comment on column public.nfc_user_data.id is
  'Kart UUID (PK). Kod: nfcCardUuid / row.id. URL slug değil.';
comment on column public.nfc_user_data.nfc_id is
  'URL slug text (at_xxx). Kod: uniqueId / NFC_CARD_SLUG_COLUMN.';

-- Slug benzersizliği (zaten varsa atlanır)
create unique index if not exists nfc_user_data_nfc_id_idx
  on public.nfc_user_data (nfc_id);

-- ─── 3) nfc_sessions.nfc_id → uuid + yanlış slug değerlerini düzelt ─────────
-- Bazı kayıtlarda nfc_sessions.nfc_id içine at_xxx (text) yazılmış olabilir.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'nfc_sessions'
      and column_name = 'nfc_id'
      and data_type <> 'uuid'
  ) then
    -- Slug → kart UUID eşlemesi
    update public.nfc_sessions ns
    set nfc_id = nud.id::text
    from public.nfc_user_data nud
    where ns.nfc_id is not null
      and trim(ns.nfc_id::text) = trim(nud.nfc_id)
      and trim(ns.nfc_id::text) ~ '^at_';

    alter table public.nfc_sessions
      alter column nfc_id type uuid using (
        case
          when nfc_id is null then null
          when trim(nfc_id::text) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            then trim(nfc_id::text)::uuid
          else null
        end
      );
  end if;
end $$;

-- Geçersiz / yetim oturum satırları
delete from public.nfc_sessions ns
where ns.nfc_id is not null
  and not exists (
    select 1 from public.nfc_user_data nud where nud.id = ns.nfc_id
  );

-- ─── 4) FK: nfc_sessions.nfc_id → nfc_user_data.id (ikisi de uuid) ───────────
alter table public.nfc_sessions
  drop constraint if exists nfc_sessions_nfc_id_fkey;

alter table public.nfc_sessions
  add constraint nfc_sessions_nfc_id_fkey
  foreign key (nfc_id) references public.nfc_user_data (id) on delete cascade;

comment on column public.nfc_sessions.nfc_id is
  'uuid FK → nfc_user_data.id. Slug için nfc_user_data.nfc_id (text) kullanılır.';

-- ─── Doğrulama (isteğe bağlı) ────────────────────────────────────────────────
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.nfc_sessions'::regclass AND contype = 'f';
