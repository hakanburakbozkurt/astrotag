-- Kart sahipliği + profiles ↔ auth.users bağlantısı + RLS

alter table nfc_cards
  add column if not exists is_claimed boolean not null default false,
  add column if not exists owner_id uuid references auth.users (id) on delete set null;

create index if not exists nfc_cards_owner_id_idx on nfc_cards (owner_id);
create index if not exists nfc_cards_claimed_idx on nfc_cards (unique_id, is_claimed);

comment on column nfc_cards.is_claimed is 'Kart bir kullanıcıya bağlandı mı';
comment on column nfc_cards.owner_id is 'Sahip — auth.users.id';

alter table profiles
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists profiles_user_id_idx on profiles (user_id);

comment on column profiles.user_id is 'Supabase Auth kullanıcısı — RLS auth.uid() ile eşleşir';

alter table profiles enable row level security;

drop policy if exists profiles_select_own on profiles;
drop policy if exists profiles_update_own on profiles;
drop policy if exists profiles_insert_own on profiles;
drop policy if exists profiles_nfc_session_select on profiles;
drop policy if exists profiles_nfc_session_update on profiles;

create policy profiles_select_own
  on profiles
  for select
  using (auth.uid() = user_id);

create policy profiles_update_own
  on profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy profiles_insert_own
  on profiles
  for insert
  with check (auth.uid() = user_id);
