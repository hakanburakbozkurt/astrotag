-- Kategori arka plan görselleri (public/1.jpg … public/7.jpg)

alter table public.expert_service_categories
  add column if not exists image_url text;

comment on column public.expert_service_categories.image_url is
  'Kategori vitrin arka planı — hizmet kartlarında 9:16 zemin';

update public.expert_service_categories
set image_url = v.image_url
from (
  values
    ('basic-natal', '/1.jpg'),
    ('timing-transits', '/2.jpg'),
    ('relationship-synastry', '/3.jpg'),
    ('vedic', '/4.jpg'),
    ('karmic-esoteric', '/5.jpg'),
    ('career-finance', '/6.jpg'),
    ('quick-question', '/7.jpg')
) as v(slug, image_url)
where expert_service_categories.slug = v.slug;
