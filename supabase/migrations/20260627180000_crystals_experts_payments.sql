-- Kristal cüzdanı, uzman vitrini, hizmetler, makaleler, ödeme ve hakediş altyapısı

alter table public.profiles
  add column if not exists crystal_balance integer not null default 0;

comment on column public.profiles.crystal_balance is
  'Parayla satın alınan kristal bakiyesi — uzman seansları için';

-- Uzman vitrin profili (profiles.user_role = expert ile eşleşir)
create table if not exists public.expert_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  display_name text not null,
  title text not null default '',
  tradition text not null default '',
  experience_years integer not null default 0 check (experience_years >= 0),
  about_text text not null default '',
  philosophy_text text not null default '',
  avatar_url text,
  is_published boolean not null default false,
  vitrine_sort integer not null default 0,
  earnings_balance_try numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expert_profiles_published_sort_idx
  on public.expert_profiles (is_published, vitrine_sort asc);

-- Uzman hizmet menüsü (kristal fiyatlı)
create table if not exists public.expert_services (
  id uuid primary key default gen_random_uuid(),
  expert_profile_id uuid not null references public.expert_profiles(id) on delete cascade,
  name text not null,
  description text not null default '',
  crystal_price integer not null check (crystal_price > 0),
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists expert_services_profile_idx
  on public.expert_services (expert_profile_id, sort_order);

-- Uzman makaleleri
create table if not exists public.expert_articles (
  id uuid primary key default gen_random_uuid(),
  expert_profile_id uuid not null references public.expert_profiles(id) on delete cascade,
  title text not null,
  slug text not null,
  excerpt text not null default '',
  body text not null default '',
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (expert_profile_id, slug)
);

-- Kristal paketleri (İyzico ile satın alma)
create table if not exists public.crystal_packages (
  id text primary key,
  title text not null,
  crystals integer not null check (crystals > 0),
  price_try numeric(10, 2) not null check (price_try > 0),
  badge text,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

insert into public.crystal_packages (id, title, crystals, price_try, badge, sort_order)
values
  ('crystal-50', 'Başlangıç', 50, 149.00, null, 1),
  ('crystal-120', 'Keşif', 120, 299.00, 'Popüler', 2),
  ('crystal-300', 'Derinlik', 300, 649.00, null, 3)
on conflict (id) do update set
  title = excluded.title,
  crystals = excluded.crystals,
  price_try = excluded.price_try,
  badge = excluded.badge,
  sort_order = excluded.sort_order;

-- Ödeme işlemleri (İyzico)
create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  package_id text references public.crystal_packages(id),
  amount_try numeric(10, 2) not null,
  crystals_granted integer not null default 0,
  iyzico_payment_id text,
  iyzico_conversation_id text,
  status text not null default 'pending'
    check (status in ('pending', 'success', 'failed', 'cancelled')),
  raw_response jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists payment_transactions_profile_idx
  on public.payment_transactions (profile_id, created_at desc);

-- Uzman seans / kristal harcama ve %20 komisyon hakediş logu
create table if not exists public.expert_earnings_ledger (
  id uuid primary key default gen_random_uuid(),
  expert_profile_id uuid not null references public.expert_profiles(id) on delete cascade,
  user_profile_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid references public.expert_services(id) on delete set null,
  crystals_spent integer not null check (crystals_spent > 0),
  gross_try numeric(12, 2) not null,
  platform_commission_try numeric(12, 2) not null,
  expert_payout_try numeric(12, 2) not null,
  commission_rate numeric(5, 4) not null default 0.20,
  status text not null default 'completed'
    check (status in ('pending', 'completed', 'refunded')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists expert_earnings_ledger_expert_idx
  on public.expert_earnings_ledger (expert_profile_id, created_at desc);

insert into public.platform_settings (key, value)
values
  ('crystal_unit_try', '2.50'),
  ('platform_commission_rate', '0.20')
on conflict (key) do nothing;

alter table public.expert_profiles enable row level security;
alter table public.expert_services enable row level security;
alter table public.expert_articles enable row level security;
alter table public.crystal_packages enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.expert_earnings_ledger enable row level security;

grant select on table public.expert_profiles to authenticated, anon;
grant select on table public.expert_services to authenticated, anon;
grant select on table public.expert_articles to authenticated, anon;
grant select on table public.crystal_packages to authenticated, anon;
grant all on table public.expert_profiles to service_role;
grant all on table public.expert_services to service_role;
grant all on table public.expert_articles to service_role;
grant all on table public.crystal_packages to service_role;
grant all on table public.payment_transactions to service_role;
grant all on table public.expert_earnings_ledger to service_role;
