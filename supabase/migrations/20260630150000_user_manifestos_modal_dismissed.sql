-- Günlük kozmik modal: kullanıcı bugün modalı kapattı mı?

alter table public.user_manifestos
  add column if not exists modal_dismissed_date date;

comment on column public.user_manifestos.modal_dismissed_date is
  'Kullanıcının günlük kozmik manifesto modalını kapattığı tarih';
