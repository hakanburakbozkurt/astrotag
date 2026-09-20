# AstroTag — QA & Persona Simulation Protocol

Permanent evaluation standard for **major features**, **feed updates**, and **economic changes**.

Every proposal must be validated against **two tiers** before merge:

- **Users** — organic engagement, safety, and metaphysical focus  
- **Experts** — professional trust, identity discipline, crystal-gated commerce  

---

## Architecture map (source of truth)

| Concern | Location |
|---------|----------|
| Context tags (mandatory on `user_post`) | `src/lib/feed/feed-context-tags.shared.ts` |
| Post/reply length & daily post limit (3) | `FEED_MAX_CAPTION_LENGTH`, `USER_DAILY_POST_LIMIT` |
| Daily like limit (100, Istanbul day) | `USER_DAILY_LIKE_LIMIT`, `feed-rate-limit.server.ts` |
| Anti-spam / anti-commercial filter | `src/lib/feed/feed-moderation.shared.ts` |
| Expert avatar requirement | `src/lib/experts/expert-avatar-guard.server.ts` |
| Feed server actions | `src/lib/experts/expert-feed.server.ts`, `src/lib/actions/expert-feed.ts` |
| Feed UI | `FeedPostComposer`, `SocialFeedPostCard`, `FeedLikeButton`, `ExpertsFeed` |
| Expert services & crystals | `expert-panel.ts`, `experts.server.ts`, `expert_service_requests` |

---

## Tier 1 — Regular members (5 personas)

**Focus:** organic engagement, ease of posting, daily limits, emotional UX (red heart), spam-free feed, mandatory context tags.

### U1 — Aylin (İlk gönderi)

- **Profile:** New member, no avatar yet, completes first `user_post`.
- **Happy path:** Selects context tag (e.g. `dream`) → writes ≤280 chars → post appears in feed with tag chip.
- **Must fail:** Submit without tag; empty caption; commercial URL in text.

### U2 — Burak (Günlük gönderi limiti)

- **Profile:** Active member posting 3 organic thoughts in one Istanbul day.
- **Happy path:** Composer shows `2/3`, `1/3`, `0/3` remaining; 4th attempt blocked server-side.
- **Must fail:** Client-only disable without `assertUserDailyPostLimit` backing.

### U3 — Ceren (Beğeni limiti)

- **Profile:** Engaged liker, uses red heart across many posts.
- **Happy path:** Like toggles with filled red heart; unlike always works.
- **Must fail:** 101st **new** like in same Istanbul day → `"Günlük beğeni sınırına (100) ulaştınız."`

### U4 — Deniz (Spam / ticari deneme)

- **Profile:** Attempts phone, IBAN, `www.`, ₺/TL price, WhatsApp CTA in post or reply.
- **Must fail:** All variants rejected by `moderateFeedText` with platform message; nothing reaches `expert_feed` / `feed_replies`.

### U5 — Efe (Sağlıklı kozmik paylaşım)

- **Profile:** Shares transit/tarot reflections with proper tags; occasional replies.
- **Happy path:** Compact card layout; chronological feed; replies moderated same as posts.
- **Must not regress:** Noir/zinc styling; no amber/glass; feed readable on mobile.

---

## Tier 2 — Verified experts (5 personas)

**Focus:** professional trust, mandatory expert avatar, anti-spam in announcements, crystal-gated services only.

### E1 — Dr. Selin (Tam vitrin)

- **Profile:** Approved expert with `expert_profiles.avatar_url`, published vitrin.
- **Happy path:** Creates new service card; optional expert announcement; appears in story bar + feed.
- **Must fail:** New service card without avatar (guard + UI notice → Kişisel Bilgiler).

### E2 — Mehmet (Avatarsız uzman)

- **Profile:** Approved expert, missing `expert_profiles.avatar_url`.
- **Must fail:** `upsertExpertServiceAction` insert; `createExpertAnnouncementPost`; inline/modal avatar warning in `ExpertServiceManager`.
- **May succeed:** Upload avatar in Kişisel Bilgiler / expert panel, then retry.

### E3 — Nur (Feed’de ticari içerik)

- **Profile:** Expert tries to sell via feed caption (price, link, DM, IBAN).
- **Must fail:** `moderateFeedText` on announcements and shared-session captions.
- **Allowed commerce:** Only `expert_services` cards + crystal purchase flow — not free-form feed ads.

### E4 — Okan (Kristal ekonomisi)

- **Profile:** Client buys expert service; ledger + `expert_service_requests` created.
- **Happy path:** Crystals deducted; commission split; expert notified; optional `shared_session` to feed with consent.
- **Must not break:** Payment-only crystal rules; no manual balance edits in admin for crystals.

### E5 — Pelinsu (Uzman + topluluk sınırı)

- **Profile:** Expert who also posts as `user_post` (organic) vs `expert_announcement` (professional).
- **Happy path:** User posts subject to 3/day + tags; announcements subject to avatar + moderation (no tag required on announcement type).
- **Must fail:** Expert bypassing moderation or avatar rules via client-side-only checks.

---

## Evaluation worksheet (copy per change)

```text
Change:
Affected surfaces:

USER TIER
[ ] U1 Aylin   [ ] U2 Burak   [ ] U3 Ceren   [ ] U4 Deniz   [ ] U5 Efe
Notes:

EXPERT TIER
[ ] E1 Selin   [ ] E2 Mehmet  [ ] E3 Nur     [ ] E4 Okan    [ ] E5 Pelinsu
Notes:

Regression risks:
Ship decision: PASS / FAIL / PASS WITH FOLLOW-UP
```

---

## Design principles (both tiers)

1. **Server enforcement first** — UI hints are not sufficient for limits, tags, moderation, or avatar gates.  
2. **Feed = organic metaphysical space** — commerce lives in expert service cards.  
3. **Emotional affordances** — red heart is the intentional color break for likes only.  
4. **Istanbul calendar day** — daily post and like windows use `Europe/Istanbul`.  
5. **Two avatar fields** — `profiles.avatar_url` (optional, personal) vs `expert_profiles.avatar_url` (required for expert commerce/announcements).

---

## When to run this protocol

- New feed content types or tables  
- Changes to limits, moderation keywords, or RLS  
- Expert marketplace / crystal / service card logic  
- Major UI reshaping of `/dashboard/experts` or composer/cards  
- Migrations touching `expert_feed`, `feed_likes`, `feed_replies`, `expert_profiles`

Minor copy or styling tweaks that do not touch the above may skip full persona pass but must still respect `.cursorrules` noir/zinc UI.
