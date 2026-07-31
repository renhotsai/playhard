# PlayHard catalog migration + frontend redesign — design

Date: 2026-07-29
Status: approved (pending final spec self-review)

## Context

PlayHard's live business today runs on a third-party booking widget
(https://larpplayhardtw.simplybook.asia/v2/, a SimplyBook.me site). It holds the
full LARP/murder-mystery script catalog (~40 scripts across categories like
恐怖劇本, 歡樂劇本, 情感沈浸, 推理燒腦, 新手推薦), business hours, address, and
contact info (LINE/IG/email).

This project's own Next.js + Prisma app (this repo) already has the booking
infrastructure (Script / Session / Reservation models, admin panel, Better Auth
roles) but is essentially empty of content: 1 placeholder script, 0 banners, 0
announcements. Its public UI also uses generic blue/gray Tailwind defaults, while
the Navbar/Footer already hint at the brand's real dark+gold identity.

Goal: migrate the full catalog + business info into this app, and redesign the
public-facing UI to match the brand (dark/gold/torn-newspaper LARP aesthetic),
so this app can fully replace the SimplyBook site.

Raw scraped source data lives in
`2026-07-29-playhard-catalog-raw-data.md` (same directory) — the seed script
implementation should pull from there.

## Scope decisions (confirmed with user)

- Import **all ~40 scripts** in one pass, not a curated subset.
- Extend `Script` with **price fields + a long-form story/character text field**;
  keep `genre` as a single string (pick the closest primary theme category per
  script) rather than building a multi-tag category system — YAGNI, the site
  doesn't need cross-category filtering logic beyond a simple genre dropdown.
- **Download and self-host** all cover images to `public/scripts/` rather than
  hotlinking the old site's CDN — the whole point is to stop depending on the
  old site.
- Add an **`isContactOnly` flag** for scripts that are co-listed (合作上架) or
  otherwise booked only via direct LINE/IG DM instead of the app's session
  flow.
- Business info (hours/address/contact/map) is **static content on a new
  `/about` page**, sourced from a plain constants file — not a DB model. This
  content changes rarely; a DB-backed admin UI for it would be overengineering.
- UI redesign should **match the existing brand closely** (dark concrete/gold/
  torn-newspaper LARP look already implied by Navbar/Footer), applied
  consistently across every public page. Admin panel is unaffected — internal
  tool, not brand-facing.

## Data model changes

```prisma
model Script {
  id             String    @id @default(cuid())
  title          String
  description    String    // short teaser/tagline (existing, kept)
  storyText      String    // NEW: full story + character bios, long-form
  coverImage     String
  playerCount    String
  duration       String
  difficulty     String    // overall difficulty stars, kept as a simple string
  genre          String    // single theme tag: 恐怖 / 歡樂 / 情感 / 推理 / 新手推薦 / 玩硬獨家 / 神秘私團
  pricePerPerson Int?      // NEW: NT$ per person, when priced per-person
  priceGroup     Int?      // NEW: NT$ flat per group, when priced per-團/per-全團
  isContactOnly  Boolean   @default(false)  // NEW
  bookingNote    String?   // NEW: shown instead of session list when isContactOnly
  published      Boolean   @default(false)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  sessions       Session[]
}
```

Multi-axis ratings (推理難度/恐怖程度/歡樂程度/etc, which vary per script) are
folded into `storyText` as descriptive text rather than modeled as separate
columns — they're flavor text, not something the app queries or filters on.

Business info is a plain TS constants file:

```ts
// src/lib/business-info.ts
export const businessInfo = {
  name: "玩硬劇本遊戲館",
  address: "台北市中山區民權西路34號6樓",
  addressNote: "近民權西路站 紅線1號出口、橘線7號出口",
  mapUrl: "https://maps.app.goo.gl/qmxgVKZxgubwQhrj7",
  hours: "每日 08:00 - 24:00",
  email: "larpplayhardtw@gmail.com",
  lineId: "@tpn8301d",
  lineUrl: "https://lin.ee/nZvNhqE",
  facebookUrl: "https://www.facebook.com/larpphtw/",
  instagramUrl: "https://www.instagram.com/larpplayhardtw/",
};
```

## Content migration

- One-off `prisma/seed-scripts.ts`, run via `npm run db:seed` alongside the
  existing owner-seed, or as a separate `db:seed:scripts` script.
- Idempotent: skip insertion if scripts already exist (same pattern as the
  existing owner seed), so it's safe to re-run.
- Reads script data transcribed from
  `2026-07-29-playhard-catalog-raw-data.md` (title, story+characters →
  `storyText`, price → `pricePerPerson`/`priceGroup`, genre, playerCount,
  duration, difficulty, isContactOnly/bookingNote where applicable).
- Cover images: download each script's cover image from the live site during
  implementation, save to `public/scripts/<slug>.jpg`, reference by relative
  path. If a download fails for a given script, fall back to empty
  `coverImage` (existing emoji-placeholder behavior already handles this).
- All scripts seed with `published: true`.

## Frontend design system

- Dark concrete/charcoal backgrounds (`#1a1a1a`–`#242424`), warm gold accent
  (matching the existing Navbar/Footer yellow), high-contrast white type,
  subtle distressed/editorial texture on section dividers.
- Bold serif/display font for Chinese headings (via `next/font`, self-hosted —
  no external CDN dependency); clean sans-serif for body text.
- Extend Tailwind config with semantic color tokens (`background`, `surface`,
  `gold`, `gold-hover`) instead of scattering one-off gray/blue utility
  classes.
- Cards: dark surface, thin gold border/glow on hover (replacing plain white
  shadow cards). Buttons: solid gold with dark text (replacing blue).

## Page-by-page plan

- **Navbar**: add "關於我們" (About) link.
- **Homepage**: hero section (logo-style title treatment + tagline, matching
  "PLAY HARD" / "玩硬劇本遊戲館" / "LIVE ACTION ROLE PLAYING"), restyled
  banner carousel, restyled featured-scripts grid, restyled announcements,
  plus a compact hours/contact teaser linking to `/about`.
- **`/scripts`**: restyled grid + a genre filter bar (client-side), since 40
  scripts need browsing structure.
- **`ScriptCard`**: dark card — title, genre + difficulty stars, player count,
  duration, price (whichever of per-person/group is set), and a "洽詢預約"
  badge when `isContactOnly`.
- **`/scripts/[id]`**: restyled detail page — cover image, price/meta row,
  full `storyText`, then either the existing session-booking list or (when
  `isContactOnly`) a styled panel showing `bookingNote` + LINE/IG links.
- **New `/about`**: hours, address, map link, LINE/IG/email, from
  `business-info.ts`.
- **Footer**: expand with the same contact essentials + link to `/about`.

## Admin panel updates

`new/page.tsx` and `[id]/edit/EditScriptForm.tsx` gain fields for
`storyText`, `pricePerPerson`, `priceGroup`, `isContactOnly` (checkbox), and
`bookingNote` (shown conditionally). `/api/scripts` and `/api/scripts/[id]`
accept and validate the new fields. No visual redesign needed here — internal
tool, functional only.

## Error handling & testing

- Seed script skips re-insertion if scripts already exist (idempotent).
- Image download failures fall back to empty `coverImage`, not a hard failure
  of the whole seed run.
- `isContactOnly` scripts skip session queries entirely on the detail page —
  no broken/empty booking widget risk.
- Manual verification after implementation: homepage, `/scripts` (with genre
  filter), a normal script detail page, a contact-only script detail page,
  `/about`, and the admin script create/edit form with the new fields.
