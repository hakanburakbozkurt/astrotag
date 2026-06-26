-- Passkey (WebAuthn) alanları — device_token = credential ID

alter table trusted_devices
  add column if not exists credential_public_key text,
  add column if not exists counter bigint not null default 0,
  add column if not exists transports text[] default '{}';

comment on column trusted_devices.device_token is 'WebAuthn credential ID (base64url)';
comment on column trusted_devices.credential_public_key is 'COSE public key (base64url)';
