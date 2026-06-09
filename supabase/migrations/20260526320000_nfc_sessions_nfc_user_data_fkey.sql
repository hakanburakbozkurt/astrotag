-- nfc_sessions.nfc_id FK: nfc_cards → nfc_user_data (production kart tablosu)
-- Kod setNfcSession ile nfc_user_data.id yazıyor; eski FK 23503 foreign_key_violation üretir.

do $$
declare
  con record;
begin
  for con in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_attribute a on a.attrelid = t.oid and a.attnum = any (c.conkey)
    where t.relname = 'nfc_sessions'
      and a.attname = 'nfc_id'
      and c.contype = 'f'
  loop
    execute format(
      'alter table public.nfc_sessions drop constraint if exists %I',
      con.conname
    );
  end loop;
end $$;

alter table public.nfc_sessions
  add constraint nfc_sessions_nfc_id_fkey
  foreign key (nfc_id) references public.nfc_user_data (id) on delete cascade;

comment on column public.nfc_sessions.nfc_id is
  'nfc_user_data.id — kart UUID referansı (URL slug değil)';
