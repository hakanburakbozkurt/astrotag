-- Manifesto teknikleri: 3x33 (Tesla) ve 369_method

alter table public.user_manifestos
  drop constraint if exists user_manifestos_technique_type_check;

alter table public.user_manifestos
  add constraint user_manifestos_technique_type_check
  check (technique_type in ('21_days', '5x55', '3x33', '369_method'));

comment on column public.user_manifestos.technique_type is
  '21_days | 5x55 | 3x33 (Tesla) | 369_method';
