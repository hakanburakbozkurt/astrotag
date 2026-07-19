-- Rozet oyunlaştırma: feedback sayacı + kullanıcı rozetleri

alter table public.profiles
  add column if not exists feedback_count integer not null default 0;

comment on column public.profiles.feedback_count is
  'Toplam analiz geri bildirimi sayısı — rozet eşikleri için';

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  star_reward integer not null default 0,
  constraint user_badges_user_badge_unique unique (user_id, badge_id)
);

create index if not exists user_badges_user_id_idx
  on public.user_badges (user_id, earned_at desc);

alter table public.user_badges enable row level security;

drop policy if exists user_badges_select_own on public.user_badges;
create policy user_badges_select_own
  on public.user_badges for select
  using (public.profile_owned_by_session(user_id));

comment on table public.user_badges is
  'Kullanıcının kazandığı geri bildirim rozetleri ve ödül kaydı';
