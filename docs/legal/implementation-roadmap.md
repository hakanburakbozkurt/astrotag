# AstroTag — Uzman Platformu & Hediyeleşme: Backend Yol Haritası

**Amaç:** Yasal metinlerde tanımlanan kuralları kod/veritabanında **kanıtlanabilir ve otomatik** uygulamak.  
**Ön koşul:** Avukat onayı sonrası sözleşme sürüm numarası (`legal_version: 1.0`) checkout’a bağlanır.

---

## Faz 0 — Ortak altyapı (1–2 hafta)

| # | İş | Çıktı |
|---|-----|--------|
| 0.1 | `contract_consents` tablosu | `profile_id`, `contract_type`, `version`, `accepted_at`, `ip`, `payload` |
| 0.2 | `crystal_ledger` tablosu | Her bakiye hareketi: `source_type`, `bucket` (purchased/promo/gift), `source_id` |
| 0.3 | `profiles.crystal_balance` → ledger trigger veya server-only güncelleme | Atomik bakiye + audit |
| 0.4 | Checkout UI: 4 onay kutusu (Mesafeli satış doc B.8) | Consent kaydı |

---

## Faz 1 — Kristal satın alma & İyzico (1–2 hafta)

| # | İş | Çıktı |
|---|-----|--------|
| 1.1 | İyzico Checkout Form Initialize (prod) | Gerçek ödeme URL |
| 1.2 | Return URL handler + callback | `payment_transactions` → `success` + ledger `purchase` |
| 1.3 | `failed` / `cancelled` durumları | İade/chargeback hazırlığı |
| 1.4 | Kullanıcı işlem geçmişi API | Şeffaflık + uyuşmazlık |

---

## Faz 2 — Fiziksel sipariş + promosyon kristal (2 hafta)

| # | İş | Çıktı |
|---|-----|--------|
| 2.1 | `orders` tablosu | `order_type`, `payment_id`, `promo_crystals`, `delivered_at` |
| 2.2 | Sipariş tamamlanınca ledger `promo_nfc` kaydı | Promosyon izlenebilir |
| 2.3 | `canRequestPhysicalReturn(order_id)` | Promo harcandıysa → `false` + reason code |
| 2.4 | Admin iade ekranı | Ayıplı mal vs cayma ayrımı |

**Validation kuralı (Madde 3.3 / 4.3):**

```
physical_return_allowed =
  order.is_defective_claim OR
  (cayma_within_14_days AND promo_crystals_consumed_from_order == 0)
```

---

## Faz 3 — Kristal hediye + 24 saat gönüllü iade (1–2 hafta)

| # | İş | Çıktı |
|---|-----|--------|
| 3.1 | `crystal_gifts` tablosu | `sender`, `recipient`, `amount`, `created_at`, `refundable_until`, `status` |
| 3.2 | `sendCrystalGiftAction` | Ledger `gift_out` / `gift_in`, consent Madde 11 |
| 3.3 | `refundCrystalGiftAction` | Koşul: `now <= refundable_until` AND `amount_remaining == amount` |
| 3.4 | Timezone: `Europe/Istanbul` | 24s hesabı |
| 3.5 | Cron: süresi dolan hediyeler `expired` | Raporlama |

**Validation kuralı (Madde 8):**

```
gift_refund_allowed =
  sender_is_requester AND
  now <= gift.refundable_until AND
  gift.amount_remaining == gift.amount
```

---

## Faz 4 — Uzman pazar yeri fulfillment (2–3 hafta)

| # | İş | Çıktı |
|---|-----|--------|
| 4.1 | `expert_bookings` tablosu | State machine: `reserved` → `completed` / `no_show_expert` / `disputed` |
| 4.2 | Kristal düşümünü rezervasyon onayına bağla | Anında düşüm yerine veya “soft lock” — sözleşmeyle uyumlu |
| 4.3 | `refundExpertBooking` (objektif haller) | Ledger reversal + `expert_earnings_ledger.status = refunded` |
| 4.4 | Uzman panel: randevu listesi | İfa kanıtı |
| 4.5 | Admin dispute queue | Madde 12.4 |

---

## Faz 5 — Hardening & uyum (sürekli)

- Rate limit: hediye gönderimi, public profile action
- RLS: yeni tablolar (`crystal_ledger`, `crystal_gifts`, `orders`, `expert_bookings`, `contract_consents`)
- E2E testler: promo harcandı → fiziksel iade red; hediye 24s01m → red
- Sözleşme sürüm snapshot checkout’ta JSONB

---

## Önerilen migration sırası

1. `contract_consents` + `crystal_ledger`
2. `crystal_gifts`
3. `orders` + promo bağlantısı
4. `expert_bookings`
5. İyzico prod entegrasyonu

---

## Bağımlılık diyagramı (özet)

```
contract_consents
       ↓
crystal_ledger ←── payment_transactions (İyzico)
       ↓                    ↓
crystal_gifts          orders (NFC + promo)
       ↓
expert_bookings → expert_earnings_ledger
```

---

*Bu yol haritası teknik planlama içindir; hukuki metinlerle birlikte avukat ve ürün ekibiyle önceliklendirilmelidir.*
