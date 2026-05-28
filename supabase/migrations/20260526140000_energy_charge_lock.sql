-- Enerji yükleme anti-spam: son yükleme zaman damgası
alter table profiles
  add column if not exists last_energy_charge timestamptz;

comment on column profiles.last_energy_charge is 'Son kozmik enerji yükleme zamanı; 6 saat cooldown için kullanılır';
