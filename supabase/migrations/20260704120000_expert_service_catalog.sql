-- Uzman hizmet kataloğu — admin yönetimli kategori ve alt hizmet tipleri

create table if not exists public.expert_service_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  sort_order integer not null default 0,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists expert_service_categories_sort_idx
  on public.expert_service_categories (sort_order asc);

create table if not exists public.expert_service_types (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.expert_service_categories(id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text not null default '',
  default_crystal_price integer not null check (default_crystal_price > 0),
  default_duration_minutes integer not null default 30 check (default_duration_minutes > 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists expert_service_types_category_sort_idx
  on public.expert_service_types (category_id, sort_order asc);

alter table public.expert_services
  add column if not exists service_type_id uuid
    references public.expert_service_types(id) on delete set null;

create index if not exists expert_services_service_type_idx
  on public.expert_services (service_type_id);

comment on table public.expert_service_categories is
  'Uzman hizmet ana kategorileri — admin panelinden yönetilir';

comment on table public.expert_service_types is
  'Uzman hizmet alt tipleri — varsayılan fiyat ve açıklama şablonu';

-- Seed: ana kategoriler
insert into public.expert_service_categories (slug, title, sort_order, image_url)
values
  ('basic-natal', 'Temel Doğum Haritası', 1, '/1.jpg'),
  ('timing-transits', 'Zamanlama & Transitler', 2, '/2.jpg'),
  ('relationship-synastry', 'İlişki & Synastry', 3, '/3.jpg'),
  ('vedic', 'Vedik Astroloji', 4, '/4.jpg'),
  ('karmic-esoteric', 'Karmik & Ezoterik', 5, '/5.jpg'),
  ('career-finance', 'Kariyer & Finans', 6, '/6.jpg'),
  ('quick-question', 'Hızlı Soru / Mini Seans', 7, '/7.jpg')
on conflict (slug) do update set
  title = excluded.title,
  sort_order = excluded.sort_order,
  image_url = excluded.image_url,
  is_active = true;

-- Seed: alt hizmet tipleri
insert into public.expert_service_types (
  category_id, slug, title, description, default_crystal_price, default_duration_minutes, sort_order
)
select c.id, v.slug, v.title, v.description, v.default_crystal_price, v.default_duration_minutes, v.sort_order
from public.expert_service_categories c
join (
  values
    ('basic-natal', 'natal-full-reading', 'Natal Harita Okuması', 'Doğum haritanızın bütünsel yorumu; gezegenler, evler ve açılar.', 50, 60, 1),
    ('basic-natal', 'sun-moon-rising', 'Güneş · Ay · Yükselen', 'Üçlü eksen analizi ve kişilik imzası.', 25, 30, 2),
    ('basic-natal', 'elements-modalities', 'Element & Modalite Dengesi', 'Ateş, toprak, hava, su dağılımı ve davranış kalıpları.', 20, 25, 3),
    ('basic-natal', 'child-chart', 'Çocuk Haritası', 'Çocuk haritası ve ebeveyn rehberliği odaklı okuma.', 45, 45, 4),
    ('basic-natal', 'solar-return', 'Solar Return', 'Yıllık güneş dönüşü haritası ve tema analizi.', 40, 45, 5),

    ('timing-transits', 'annual-transits', 'Yıllık Transit Analizi', 'Önümüzdeki 12 ayın önemli transitleri ve temaları.', 45, 50, 1),
    ('timing-transits', 'lunar-phases', 'Ay Fazları Rehberliği', 'Ay döngüsü, yeni ay ve dolunay etkileri.', 25, 30, 2),
    ('timing-transits', 'life-chapter', 'Önemli Dönem Haritası', 'Saturn dönüşü, Jüpiter döngüsü ve dönüm noktaları.', 55, 60, 3),
    ('timing-transits', 'profection', 'Profection / Zodyak Salınması', 'Yıllık profection tekniği ile odak alan belirleme.', 50, 45, 4),

    ('relationship-synastry', 'synastry-compatibility', 'Synastry / İlişki Uyumu', 'İki harita arası açılar ve uyum skoru yorumu.', 55, 60, 1),
    ('relationship-synastry', 'composite-chart', 'Composite Harita', 'İlişkinin ortak haritası ve birlikte büyüme alanları.', 50, 50, 2),
    ('relationship-synastry', 'davison-chart', 'Davinson Haritası', 'İlişki haritası (Davinson) ile bağ dinamikleri.', 45, 45, 3),
    ('relationship-synastry', 'relationship-timing', 'İlişki Zamanlaması', 'Birliktelik için uygun dönemler ve transitler.', 40, 40, 4),

    ('vedic', 'vedic-natal', 'Vedik Doğum Haritası (Jyotish)', 'Sidereal harita, lagna ve temel yogalar.', 60, 60, 1),
    ('vedic', 'dashas-periods', 'Dashas Dönem Analizi', 'Vimshottari dasha dönemleri ve aktif tema.', 55, 50, 2),
    ('vedic', 'nakshatra', 'Nakshatra & Ay Mansions', 'Ay nakshatra analizi ve ruhsal imza.', 40, 40, 3),
    ('vedic', 'muhurta', 'Muhurta (Zaman Seçimi)', 'Önemli başlangıçlar için uygun zaman penceresi.', 35, 35, 4),

    ('karmic-esoteric', 'past-life-karmic', 'Past Life / Karmik Eksen', 'Güney-Kuzey düğüm ve karmik dersler.', 50, 50, 1),
    ('karmic-esoteric', 'draconic-chart', 'Drakonik Harita', 'Ruhsal harita ve derin motivasyon katmanı.', 45, 45, 2),
    ('karmic-esoteric', 'soul-mission', 'Ruhsal Görev & Kuzey Düğüm', 'Kuzey düğüm yolu ve yaşam amacı rehberliği.', 40, 40, 3),
    ('karmic-esoteric', 'tarot-astro-blend', 'Tarot + Astro Kombine', 'Tarot açılımı ile astrolojik tema birleşimi.', 35, 35, 4),

    ('career-finance', 'mc-career-axis', 'MC / Kariyer Ekseni', '10. ev, MC ve kariyer yönelimi analizi.', 45, 45, 1),
    ('career-finance', 'wealth-abundance', 'Finans & Bolluk Haritası', '2. ve 8. ev, Jüpiter-Venüs finans temaları.', 40, 40, 2),
    ('career-finance', 'business-timing', 'İş Zamanlaması', 'İş kurma, terfi ve proje lansmanı için transitler.', 35, 35, 3),
    ('career-finance', 'relocation-muhurta', 'Taşınma & Evlilik Muhurta', 'Konum değişikliği ve evlilik için zaman seçimi.', 45, 45, 4),

    ('quick-question', 'horary-single', 'Tek Soru Horary', 'Tek soruya odaklı horary yorumu.', 20, 20, 1),
    ('quick-question', 'mini-session-15', '15 dk Mini Danışmanlık', 'Kısa odak seans — tek konu.', 15, 15, 2),
    ('quick-question', 'text-reading', 'Metin / WhatsApp Okuma', 'Yazılı kısa yorum ve takip notu.', 25, 25, 3)
) as v(category_slug, slug, title, description, default_crystal_price, default_duration_minutes, sort_order)
  on c.slug = v.category_slug
on conflict (slug) do update set
  category_id = excluded.category_id,
  title = excluded.title,
  description = excluded.description,
  default_crystal_price = excluded.default_crystal_price,
  default_duration_minutes = excluded.default_duration_minutes,
  sort_order = excluded.sort_order,
  is_active = true;

alter table public.expert_service_categories enable row level security;
alter table public.expert_service_types enable row level security;

grant select on table public.expert_service_categories to authenticated, anon;
grant select on table public.expert_service_types to authenticated, anon;
grant all on table public.expert_service_categories to service_role;
grant all on table public.expert_service_types to service_role;
