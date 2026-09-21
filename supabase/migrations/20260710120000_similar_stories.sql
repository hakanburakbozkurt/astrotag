-- Benzer Hikayeler — kozmik anlık görüntü, günlük hal ve eşleşme altyapısı

alter table public.expert_feed
  add column if not exists cosmic_snapshot jsonb,
  add column if not exists daily_state_text text,
  add column if not exists emotional_state_tag text;

alter table public.expert_feed
  drop constraint if exists expert_feed_daily_state_text_len;

alter table public.expert_feed
  add constraint expert_feed_daily_state_text_len
  check (daily_state_text is null or char_length(trim(daily_state_text)) between 1 and 140);

alter table public.expert_feed
  drop constraint if exists expert_feed_emotional_state_tag_check;

alter table public.expert_feed
  add constraint expert_feed_emotional_state_tag_check
  check (
    emotional_state_tag is null
    or emotional_state_tag in (
      'overwhelmed',
      'hopeful',
      'restless',
      'grieving',
      'transforming',
      'seeking',
      'grounded',
      'volatile'
    )
  );

create index if not exists expert_feed_cosmic_snapshot_gin
  on public.expert_feed using gin (cosmic_snapshot)
  where content_type = 'user_post' and cosmic_snapshot is not null;

comment on column public.expert_feed.cosmic_snapshot is
  'user_post: paylaşım anındaki kozmik bağlam (transit, gerilim, burç imzası) — benzer hikaye eşleşmesi';

comment on column public.expert_feed.daily_state_text is
  'user_post: isteğe bağlı kısa günlük hal / niyet metni (max 140)';

comment on column public.expert_feed.emotional_state_tag is
  'user_post: isteğe bağlı duygusal durum etiketi';

-- Günlük hal havuzu — manifest & state ingestion
create table if not exists public.user_daily_states (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  state_date date not null,
  state_text text check (state_text is null or char_length(trim(state_text)) between 1 and 140),
  emotional_state_tag text check (
    emotional_state_tag is null
    or emotional_state_tag in (
      'overwhelmed',
      'hopeful',
      'restless',
      'grieving',
      'transforming',
      'seeking',
      'grounded',
      'volatile'
    )
  ),
  context_tag text,
  cosmic_snapshot jsonb,
  feed_post_id uuid references public.expert_feed (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, state_date)
);

create index if not exists user_daily_states_profile_date_idx
  on public.user_daily_states (profile_id, state_date desc);

alter table public.user_daily_states enable row level security;

grant select, insert, update on table public.user_daily_states to authenticated;
grant all on table public.user_daily_states to service_role;

create policy user_daily_states_select_own
  on public.user_daily_states
  for select
  to authenticated
  using (public.profile_row_owned_by_session(profile_id));

create policy user_daily_states_insert_own
  on public.user_daily_states
  for insert
  to authenticated
  with check (public.profile_row_owned_by_session(profile_id));

create policy user_daily_states_update_own
  on public.user_daily_states
  for update
  to authenticated
  using (public.profile_row_owned_by_session(profile_id))
  with check (public.profile_row_owned_by_session(profile_id));
