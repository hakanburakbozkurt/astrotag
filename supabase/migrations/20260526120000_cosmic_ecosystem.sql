-- Kozmik Ekosistem: partner alanları + enerji birikimi
alter table profiles
  add column if not exists cosmic_energy integer not null default 0;

alter table profiles
  add column if not exists partner_name text;

alter table profiles
  add column if not exists partner_birth_date date;

alter table profiles
  add column if not exists partner_birth_time time;

alter table profiles
  add column if not exists partner_birth_place text;

comment on column profiles.cosmic_energy is '0-2 arası birikmiş kozmik enerji; soru sormak için 2 gerekir';
comment on column profiles.partner_name is 'Partner adı (synastry/uyumluluk analizi için)';
