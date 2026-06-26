-- NFC oturum boşta kalma (idle) takibi — 20 dk hareketsizlikte oturum düşer
alter table public.nfc_sessions
  add column if not exists last_active_at timestamptz not null default now();

update public.nfc_sessions
set last_active_at = coalesce(created_at, now())
where last_active_at is null;

create index if not exists nfc_sessions_last_active_idx
  on public.nfc_sessions (last_active_at desc);

comment on column public.nfc_sessions.last_active_at is
  'Son etkinlik zamanı; middleware 20 dk idle kontrolü için kullanılır';
