-- nfc_sessions: service_role INSERT garantisi (RLS açık, politika yok)
grant all on table public.nfc_sessions to service_role;

comment on table public.nfc_sessions is
  'NFC oturum kayıtları — yalnızca service_role yazar (RLS, politika yok)';
