-- horary_questions.user_id → profiles(id) (NFC oturum profile_id ile aynı anahtar)

create table if not exists public.horary_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  question text not null,
  ai_answer text,
  planet_positions jsonb,
  created_at timestamptz not null default now()
);

create index if not exists horary_questions_user_created_idx
  on public.horary_questions (user_id, created_at desc);

alter table public.horary_questions drop constraint if exists horary_questions_user_id_fkey;

alter table public.horary_questions
  add constraint horary_questions_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

comment on column public.horary_questions.user_id is
  'profiles.id — NFC oturumundaki profile_id ile aynı';

alter table public.horary_questions enable row level security;

drop policy if exists "Users read own horary_questions" on public.horary_questions;
drop policy if exists "Users insert own horary_questions" on public.horary_questions;

create policy "Users read own horary_questions"
  on public.horary_questions for select
  using (
    user_id in (
      select p.id from public.profiles p where p.user_id = auth.uid()
    )
  );

create policy "Users insert own horary_questions"
  on public.horary_questions for insert
  with check (
    user_id in (
      select p.id from public.profiles p where p.user_id = auth.uid()
    )
  );
