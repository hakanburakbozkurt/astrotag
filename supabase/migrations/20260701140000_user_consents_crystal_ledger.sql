-- Faz 0 — Hukuk altyapısı: kullanıcı onayları + kristal ledger

-- ---------------------------------------------------------------------------
-- user_consents — sözleşme / aydınlatma onay kayıtları (append-only audit)
-- ---------------------------------------------------------------------------
create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  consent_type text not null,
  version text not null,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  is_accepted boolean not null default true,
  constraint user_consents_type_check check (
    consent_type in (
      'tos',
      'privacy',
      'distance_selling',
      'cayma_hakki',
      'instant_digital_fulfillment',
      'promo_crystal_terms',
      'gift_policy'
    )
  ),
  constraint user_consents_version_format_check check (version ~ '^v[0-9]+(\.[0-9]+)*$')
);

create index if not exists user_consents_user_type_created_idx
  on public.user_consents (user_id, consent_type, created_at desc);

create index if not exists user_consents_user_type_version_idx
  on public.user_consents (user_id, consent_type, version)
  where is_accepted = true;

comment on table public.user_consents is
  'Kullanıcı sözleşme/onay kayıtları — her kabul olayı ayrı satır (audit trail)';

comment on column public.user_consents.consent_type is
  'tos | privacy | distance_selling | cayma_hakki | instant_digital_fulfillment | promo_crystal_terms | gift_policy';

comment on column public.user_consents.version is
  'Sözleşme sürümü — örn. v1.0, v1.1';

-- ---------------------------------------------------------------------------
-- crystal_ledger — kristal bakiye hareketleri (profiles.crystal_balance ile uyumlu)
-- ---------------------------------------------------------------------------
create table if not exists public.crystal_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null check (amount <> 0),
  type text not null,
  transaction_id text,
  created_at timestamptz not null default now(),
  constraint crystal_ledger_type_check check (
    type in ('purchase', 'gift', 'bonus')
  ),
  constraint crystal_ledger_amount_positive_check check (amount > 0)
);

create index if not exists crystal_ledger_user_created_idx
  on public.crystal_ledger (user_id, created_at desc);

create index if not exists crystal_ledger_transaction_idx
  on public.crystal_ledger (transaction_id)
  where transaction_id is not null;

comment on table public.crystal_ledger is
  'Kristal hareket defteri — amount pozitif (yükleme); harcama türleri sonraki migration ile genişletilir';

comment on column public.crystal_ledger.transaction_id is
  'Ödeme referansı (İyzico payment_transactions.id vb.) veya iç işlem kimliği';

-- ---------------------------------------------------------------------------
-- check_consent — belirli sürüm için kabul var mı?
-- ---------------------------------------------------------------------------
create or replace function public.check_consent(
  p_user_id uuid,
  p_consent_type text,
  p_version text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_consents uc
    where uc.user_id = p_user_id
      and uc.consent_type = p_consent_type
      and uc.version = p_version
      and uc.is_accepted = true
  );
$$;

comment on function public.check_consent(uuid, text, text) is
  'Kullanıcının consent_type + version için en az bir kabul kaydı var mı?';

-- ---------------------------------------------------------------------------
-- check_required_consents — toplu doğrulama (signup / checkout paketleri)
-- p_requirements örnek: [{"consent_type":"tos","version":"v1.0"}, ...]
-- ---------------------------------------------------------------------------
create or replace function public.check_required_consents(
  p_user_id uuid,
  p_requirements jsonb
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  req record;
begin
  if p_requirements is null or jsonb_typeof(p_requirements) <> 'array' then
    return false;
  end if;

  if jsonb_array_length(p_requirements) = 0 then
    return true;
  end if;

  for req in
    select *
    from jsonb_to_recordset(p_requirements) as x(consent_type text, version text)
  loop
    if req.consent_type is null or req.version is null then
      return false;
    end if;

    if not public.check_consent(p_user_id, req.consent_type, req.version) then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

comment on function public.check_required_consents(uuid, jsonb) is
  'JSON dizisindeki tüm consent_type+version çiftleri için check_consent true dönmeli';

-- ---------------------------------------------------------------------------
-- RLS — user_consents
-- ---------------------------------------------------------------------------
alter table public.user_consents enable row level security;

grant select, insert on table public.user_consents to authenticated;
revoke update, delete on table public.user_consents from authenticated, anon;

drop policy if exists user_consents_select_own on public.user_consents;
create policy user_consents_select_own
  on public.user_consents
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists user_consents_insert_own on public.user_consents;
create policy user_consents_insert_own
  on public.user_consents
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and is_accepted = true
  );

comment on policy user_consents_insert_own on public.user_consents is
  'Kullanıcı yalnızca kendi adına kabul kaydı oluşturabilir; güncelleme/silme yok (audit)';

-- ---------------------------------------------------------------------------
-- RLS — crystal_ledger (okuma authenticated, yazma service_role)
-- ---------------------------------------------------------------------------
alter table public.crystal_ledger enable row level security;

grant select on table public.crystal_ledger to authenticated;
revoke insert, update, delete on table public.crystal_ledger from anon, authenticated;

drop policy if exists crystal_ledger_select_own on public.crystal_ledger;
create policy crystal_ledger_select_own
  on public.crystal_ledger
  for select
  to authenticated
  using (user_id = auth.uid());

comment on policy crystal_ledger_select_own on public.crystal_ledger is
  'Kristal ledger yazımı yalnızca service_role (sunucu)';

-- Fonksiyonlar
grant execute on function public.check_consent(uuid, text, text) to authenticated, service_role;
grant execute on function public.check_required_consents(uuid, jsonb) to authenticated, service_role;
