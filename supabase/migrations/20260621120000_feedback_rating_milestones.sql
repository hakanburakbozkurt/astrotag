-- Geri bildirim rating (1–5) + milestone oyunlaştırma

alter table public.analysis_feedback_logs
  add column if not exists rating integer;

alter table public.analysis_feedback_logs
  drop constraint if exists analysis_feedback_logs_rating_check;

alter table public.analysis_feedback_logs
  add constraint analysis_feedback_logs_rating_check
  check (rating is null or (rating >= 1 and rating <= 5));

comment on column public.analysis_feedback_logs.rating is
  'Kullanıcı puanı 1–5; milestone rozet eşiği için kullanılır';
