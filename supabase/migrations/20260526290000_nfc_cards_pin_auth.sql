-- Phase 1: URL-based PIN auth — additive columns only (eski auth akışını bozmaz)

alter table public.nfc_cards
  add column if not exists pin_hash text,
  add column if not exists pin_set_at timestamptz,
  add column if not exists pin_failed_attempts int not null default 0,
  add column if not exists pin_locked_until timestamptz;

comment on column public.nfc_cards.pin_hash is
  'bcrypt hash — düz metin PIN saklanmaz; verifyPin sunucuda karşılaştırılır';
comment on column public.nfc_cards.pin_set_at is
  'PIN ilk atandığı veya son değiştirildiği zaman';
comment on column public.nfc_cards.pin_failed_attempts is
  'Ardışık hatalı PIN denemesi sayacı — başarılı girişte sıfırlanır';
comment on column public.nfc_cards.pin_locked_until is
  'Çok fazla hatalı deneme sonrası geçici kilit bitiş zamanı';
