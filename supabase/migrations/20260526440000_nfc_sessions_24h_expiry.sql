-- nfc_sessions: oturum süresi 24 saat (uygulama katmanında expires_at = now() + 24h)
comment on column public.nfc_sessions.expires_at is
  'NFC oturum bitiş — uygulama varsayılanı now() + interval ''24 hours''';
