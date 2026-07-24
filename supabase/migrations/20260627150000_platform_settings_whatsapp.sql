-- Platform ayarları (WhatsApp destek hattı vb.)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.platform_settings IS 'Uygulama geneli yapılandırma (service role ile yönetilir)';

INSERT INTO public.platform_settings (key, value)
VALUES ('whatsapp_admin_number', '905539559111')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = now();
