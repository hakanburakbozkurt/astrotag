-- Admin yetkisi için role sütunu
alter table profiles
  add column if not exists role text not null default 'user';

alter table profiles
  drop constraint if exists profiles_role_check;

alter table profiles
  add constraint profiles_role_check check (role in ('user', 'admin'));

comment on column profiles.role is 'Kullanıcı yetkisi; admin toplu işlemler yapabilir';
