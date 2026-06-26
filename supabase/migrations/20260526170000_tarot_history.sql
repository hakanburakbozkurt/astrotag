-- Tarot yorum önbelleği (24 saat aynı 3 kart)
create table if not exists tarot_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  question text not null,
  card_ids text[] not null,
  card_signature text not null,
  reading text not null,
  created_at timestamptz not null default now()
);

create index if not exists tarot_history_user_signature_created_idx
  on tarot_history (user_id, card_signature, created_at desc);

comment on table tarot_history is 'Aynı kullanıcı + aynı 3 kart 24 saat içinde API yerine cache kullanır';
