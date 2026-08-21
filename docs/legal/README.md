# AstroTag — Yasal Metinler (Taslak v1.0)

Bu klasör, **C seçeneği (Özet + Resmi Metin)** formatında hazırlanmış sözleşme taslaklarını içerir.

| Dosya | İçerik |
|-------|--------|
| [01-mesafeli-satis-ve-on-bilgilendirme.md](./01-mesafeli-satis-ve-on-bilgilendirme.md) | Ön bilgilendirme + Mesafeli satış + dijital onay kutuları |
| [02-platform-kullanim-kosullari.md](./02-platform-kullanim-kosullari.md) | AI, uzman pazar yeri, KVKK rıza metinleri |
| [03-iade-ve-iptal-politikasi.md](./03-iade-ve-iptal-politikasi.md) | Cayma, promosyon NFC, hediye 24s, uzman iade |

## Yayın öncesi doldurulacak alanlar

- `[ŞİRKET UNVANI]`, `[ADRES]`, `[MERSİS]`, `[VKN]`, `[TELEFON]`
- `[İADE ADRESİ]`, kargo iade bedeli politikası
- `[GG.AA.YYYY]` yürürlük tarihi
- Avukat incelemesi ve noter/onay gereksinimi (varsa)

## Faz 0 — Veritabanı

| Migration | Tablolar |
|-----------|----------|
| `20260701140000_user_consents_crystal_ledger.sql` | `user_consents`, `crystal_ledger`, `check_consent()`, `check_required_consents()` |

## Kod

| Dosya | Açıklama |
|-------|----------|
| `src/lib/legal/consent-config.ts` | Aktif sürüm (`LEGAL_VERSION`) ve zorunlu onay listeleri |
| `src/lib/legal/consent.server.ts` | Kayıt, doğrulama, RPC sarmalayıcıları |

## Sürüm güncelleme (v1.0 → v1.1)

1. Yasal markdown dosyalarını güncelle (`docs/legal/`).
2. `consent-config.ts` içinde `LEGAL_VERSION = "v1.1"` yap.
3. Signup/checkout ekranları otomatik yeni sürümü ister.
4. Eski kullanıcılar: giriş veya kritik işlem öncesi “yeniden onay” gate (Faz 1).
5. `user_consents` append-only kalır; geçmiş audit silinmez.
