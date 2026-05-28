-- Oyunlaştırılmış enerji ekonomisi: başlangıç bonusu varsayılanı
alter table profiles
  alter column cosmic_energy set default 20;

comment on column profiles.cosmic_energy is '0-100 arası kozmik enerji; yeni kayıt 20 bonus alır';
