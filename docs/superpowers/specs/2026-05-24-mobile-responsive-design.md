# Mobile Responsive Design — Lionhearts VBC

**Date:** 2026-05-24  
**Scope:** All pages and shared components  
**Breakpoint:** `max-width: 768px` (primary mobile), `max-width: 480px` (small phones) where noted  
**Constraint:** Every change is additive — mobile-only `@media (max-width: ...)` overrides. Desktop styles must remain untouched except for the two explicit desktop changes below.

---

## Design Decisions

### Approach
All responsive work is done via `@media (max-width: ...)` blocks added to existing scoped `<style>` sections. No desktop styles are modified except the two explicit desktop-only changes (pathway cards on Join page). No new components or files are created.

---

## 1. Nav (`src/components/Nav.astro`)

**Problem:** 6 nav links + logo + E2 badge + CTA button cannot fit in a 60px nav bar at 390px.

**Solution:** Hamburger menu with full-screen overlay.

- At `≤768px`: hide `.nav__links`, hide `.nav__e2-badge`. Show hamburger button (`☰`). Keep logo and "Join Us" CTA visible.
- Tapping `☰` adds class `nav--open` to `<nav>`. Tapping `✕` removes it.
- Overlay: `position: fixed; inset: 0; background: rgba(5,13,26,0.97); z-index: 99` — covers the full screen.
- Links inside overlay: large (`font-size: 1.5rem`), uppercase, `font-weight: 900`, vertically stacked with `gap: 1.5rem`. Active page highlighted in `--color-accent-to`.
- "Join the Club" button at bottom of overlay, full-width.
- Overlay open/close controlled by a small `<script>` block in Nav.astro — toggle class, lock/unlock `body { overflow: hidden }`.
- Hamburger button: `aria-label="Open menu"`, `aria-expanded` reflects state. Overlay has `role="dialog"` and `aria-label="Navigation"`.
- Focus trap inside overlay when open. Esc key closes.

---

## 2. Stats Bar (`src/components/StatsBar.astro`)

**Problem:** 5 stats in one rigid row — each cell ~78px wide at 390px.

**Solution:** 2×2 grid + full-width 5th stat.

- At `≤768px`: change `.stats-bar` from `display: flex` to `display: grid; grid-template-columns: 1fr 1fr`.
- Stats 1–2: row 1. Stats 3–4: row 2. Stat 5 (`Shoreditch E2`): `grid-column: span 2` — full width, centred.
- Borders: explicit `border-right` on col-1 items, `border-bottom` on row-1 items, `border-top` on the spanning 5th item.
- Number font size stays the same; layout change only.

---

## 3. About Intro (`src/components/AboutIntro.astro`)

**Problem:** `display: flex; gap: 64px` with a fixed `width: 340px` sidebar — overflows on mobile.

**Solution:** Stack vertically.

- At `≤768px`: `.about-intro__inner` → `flex-direction: column; gap: 32px`. `.about-intro__cards` → `width: 100%`.

---

## 4. Community Section (`src/components/CommunitySection.astro`)

**Problem:** `.community__header` is `display: flex; justify-content: space-between` with `.community__sub` right-aligned — reads awkwardly narrow on mobile.

**Solution:** Stack header, left-align sub text.

- At `≤768px`: `.community__header` → `flex-direction: column; align-items: flex-start`. `.community__sub` → `text-align: left; max-width: 100%`.

---

## 5. Join CTA (`src/components/JoinCTA.astro`)

**Problem:** `.join-cta__inner` has `padding: 64px` and is `display: flex; justify-content: space-between` — too tight and too much padding on mobile.

**Solution:** Stack and reduce padding.

- At `≤768px`: `.join-cta__inner` → `flex-direction: column; gap: 24px; padding: 36px 24px`. `.join-cta__actions` → `flex-direction: column; width: 100%`. Both buttons → `width: 100%; justify-content: center`.

---

## 6. Sponsors Section (`src/components/SponsorsSection.astro`)

**Problem:** `.sponsors__title-card` is `display: flex; justify-content: space-between` — may be cramped at narrow widths even at `max-width: 520px`.

**Solution:** Stack at mobile.

- At `≤640px`: `.sponsors__title-card` → `flex-direction: column; align-items: flex-start; gap: 16px`. `.sponsors__meta` → `text-align: left`.

---

## 7. Instagram Feed (`src/components/InstagramFeed.astro`)

**Problem:** `.instagram__header` is `display: flex; justify-content: space-between` — heading + "View on Instagram" link may wrap awkwardly.

**Solution:** Stack at mobile.

- At `≤640px`: `.instagram__header` → `flex-direction: column; align-items: flex-start; gap: 8px`.

---

## 8. Hero (`src/components/Hero.astro`)

**Problem:** `.hero__ctas` are `display: flex` side-by-side — two full buttons at 390px is tight.

**Solution:** Stack CTA buttons vertically.

- At `≤768px`: `.hero__ctas` → `flex-direction: column; align-items: flex-start; gap: 10px`. Buttons stay `inline-flex` (auto width, not full-width — they're CTAs, not form actions).
- Reduce bottom padding: `.hero__content` → `padding-bottom: 48px`.

---

## 9. About Page (`src/pages/about.astro`)

**Problem:** Two unfixed mobile issues:
1. `.about-history__inner` is `grid-template-columns: 1fr 1fr; gap: 56px` — photo and story side by side.
2. `.values-row` is `grid-template-columns: repeat(3, 1fr)` — three value cards side by side.

**Solution:**

- At `≤768px`: `.about-history__inner` → `grid-template-columns: 1fr; gap: 32px`. Photo placeholder renders first (source order), story below.
- At `≤768px`: `.values-row` → `grid-template-columns: 1fr`.

---

## 10. Events Page (`src/pages/events.astro`)

**Problem:** `.team-fixture-section__header` uses `display: flex; justify-content: space-between` with team name+badge on the left and division+volleyzone link on the right. At narrow widths this may clip.

**Solution:** Stack header rows at mobile.

- At `≤640px`: `.team-fixture-section__header` → `flex-direction: column; align-items: flex-start; gap: 6px`. `.team-fixture-section__right` → `flex-direction: column; align-items: flex-start; gap: 4px`.

---

## 11. Contact Page (`src/pages/contact.astro`)

**Current state:** Cards already go 1-col at 640px. Location block already stacks at 920px. Social row already columns at 640px.

**Additional change:** Redesign contact cards to use a horizontal icon+text layout at all sizes (currently cards stack icon above title above body above link — visually blocky).

- Restructure each card: `display: flex; align-items: center; gap: 14px`. Icon block (40×40, gradient, border-radius 10px) on the left. Tag + title + link stacked on the right.
- Body copy removed from card (keeps cards compact — the title and link are enough on mobile).
- This change applies at **all screen sizes** (desktop and mobile both benefit).

---

## 12. Join Page (`src/pages/join.astro`) — two explicit desktop changes

**Change 1 — Remove step number badges (desktop + mobile):** Remove `.pathway__num` element and all associated CSS from the HTML. No replacement. Emoji icon is sufficient.

**Change 2 — Remove schedule block from pathway 1 (desktop + mobile):** Remove the `.pathway__schedule` div and all associated CSS. Replace with only the "See Full Schedule" CTA button already present. The events page carries the schedule detail.

**Mobile (already handled):** Pathways already go 1-col at 768px. No additional mobile breakpoints needed for the pathway grid itself.

---

## Pages with no changes needed

| Page | Reason |
|---|---|
| `/teams` | Already has `repeat(2,1fr)` at 768px, `1fr` at 480px |
| `/sponsorship` | Already has column sponsor-hero, column become-sponsor, 2-col perks at 768px, 1-col at 480px |
| `/join` (form grid) | Already has 1-col at 640px |
| `/404`, `/join-success` | Simple single-column layouts, no grid issues |

---

## Implementation order

1. `Nav.astro` — hamburger + overlay (most impactful, affects every page)
2. `StatsBar.astro` — 2+2+1 grid
3. `Hero.astro` — stack CTAs, reduce bottom padding
4. `AboutIntro.astro` — stack flex row
5. `CommunitySection.astro` — stack header
6. `JoinCTA.astro` — stack + reduce padding
7. `SponsorsSection.astro` — stack title card
8. `InstagramFeed.astro` — stack header
9. `about.astro` — stack history grid + values
10. `events.astro` — stack fixture header
11. `contact.astro` — horizontal card layout (all sizes)
12. `join.astro` — remove step numbers + remove schedule block (all sizes)

---

## Key constraints

- **No desktop regressions.** Every responsive rule lives inside `@media (max-width: ...)`. The only desktop changes are items 1 and 2 in section 12 (join.astro pathway cleanup), which improve both desktop and mobile.
- **No new files or components.** All changes are CSS additions to existing scoped `<style>` blocks and minimal HTML edits in the same files.
- **Existing breakpoints respected.** Several pages already have mobile breakpoints — new rules supplement, never conflict with those.
- **BEM conventions maintained.** No inline styles.
