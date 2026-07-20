-- Küresel geri bildirim istatistikleri (sosyal kanıt)

create or replace function public.get_global_feedback_stats()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'total_reviews', coalesce(count(*)::integer, 0),
    'average_rating', coalesce(round(avg(rating)::numeric, 1), 0),
    'accuracy_percentage', coalesce(
      round(
        100.0 * count(*) filter (where rating >= 4)::numeric
        / nullif(count(*)::numeric, 0),
        1
      ),
      0
    )
  )
  from public.analysis_feedback_logs
  where rating is not null;
$$;

comment on function public.get_global_feedback_stats() is
  'Toplam yorum, ortalama puan ve 4–5 yıldız isabet oranı — sosyal kanıt';

grant execute on function public.get_global_feedback_stats() to anon, authenticated, service_role;
