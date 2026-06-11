# Designer Feedback Fixes — Design Spec

**Date:** 2026-06-11
**Branch:** `style/larger-base-font` (continuing)
**Source:** Designer (Conway) comments in `Lionhearts_Website Assets_Guide.pptx`, slides 15–42.

## Context

The designer reviewed the live site and left ~25 comments across five areas:
global typography, the homepage, the Sessions & Fixtures page, the Team page,
and the About page. This spec consolidates them into a single phased plan.

**Key finding:** the in-progress base-font bump on this branch
(`html { font-size: 112.5% }` = 18px, commit `5b7260c`) scales every `rem`-based
size up ~12.5%, which **already satisfies most of slide 19's font-size
hierarchy** (eyebrow 9→~10.1px, body 14→~15.75px, note→~12.4px, button→~11.25px).
The remaining type work is therefore tracking unification (S16–18) plus a few
hardcoded outliers (S20, S27, S28), not a wholesale rescale.

## Decisions (confirmed with user)

- **Scope:** everything in one phased plan.
- **S&F session cards:** differentiate via a darkened **volleyball-photo overlay**
  (designer's S32 mockup), not gradient cards (S33).
- **About icons:** refactor into an **icon slot** rendering emoji now, ready for a
  clean SVG swap when the designer delivers a custom set.
- **About content:** **replace** the existing 3 marketing cards with Allan's copy
  (Our Values + Our Mission).

## Workstream 1 — Global typography (`src/styles/global.css`)

### Tracking model (S16)

The designer defines three tracking scales. Consolidate the currently-scattered
`letter-spacing` literals into three `:root` tokens (theme-independent), then have
components reference the token instead of a literal:

| Token | Applies to | Notes |
|-------|-----------|-------|
| `--tracking-display` | **Titles + sub-titles** (one style) | Loosen from current `-0.02em` to a **positive** value (start ~`0.02em`, can go larger). The S17/18 sample is visibly looser than the live value, and the designer confirmed tracking can be larger. Watermark words (Tier B, 8rem+) keep their own `-0.05em`. |
| `--tracking-wide` | **Eyebrows + buttons only** | The "very wide" scale. Today eyebrows use `1.5px`/`3px` and buttons `1px`; unify to a single value (~`0.16–0.18em`). |
| `--tracking-body` | **Body + notes** (one style) | Near-zero (`0` or `~0.01em`). |

- Loosening `--tracking-display` addresses S17/S18 ("all titles too tight"). The
  exact value is tunable; start around `0.02em` and adjust **upward** toward the
  sample by eye — the designer confirmed it can be larger.
- Sweep existing `letter-spacing` literals in `global.css` and component scoped
  styles → the appropriate token.

### Font-size outliers (the base-bump didn't catch these)

- **S20:** a body instance still rendering ~14px → bring to body size (~15px).
  (Designer: "Use body 15px (now it is 14)".)
- **S27:** the two community-section headings ("Volleyball brings the world to
  E2." and "Out of context. Mostly on purpose.") should **both be 32px** (Sub
  tier). One is currently 22.4px.
- **S28:** Sessions & Fixtures fixture-row date/meta text is too small → use body
  size. (Covered in Workstream 3 but it's the same "too small" class of fix.)

### Optional / experimental

- **S21:** eyebrow treatment where the leading line is as thick as the text and
  line-height matches text height. Flagged **optional** — try it, keep only if it
  reads well; must not block the rest.

## Workstream 2 — Homepage

### `src/components/SessionsStrip.astro`

- **S22:** meta line → Title Case:
  `No Booking · No Experience Needed · Mulberry Academy, E2`.
- **S23:** day labels (MON / THU / FRI) — match the time text size ("7–9pm") but
  use a **lighter weight** so they still read as secondary; give the times a bit
  more space around the "–" so the dash is visible; align the metadata tracking
  with the "Open sessions every week" line.
- **S24:** "Full schedule →" link — give it more breathing room (padding/margin)
  and align it (left or centre) so it stands out as the card's action.

### `src/components/Nav.astro`

- **S25:** nav CTA (`btn btn--primary nav__cta`, line ~42) → **`btn--white`**
  (white fill, navy text) for maximum contrast against the navy nav bar.
  **Verify** `btn--white` renders correctly on the navy nav in **both** light and
  dark themes before committing.

### `src/components/SponsorsSection.astro`

- **S26:** tagline (line ~6) → Title Case:
  `East London's Independent Wine Merchant`. (Leave SEO meta-description strings
  in `sponsorship.astro` / `vinarius.astro` as-is — only the visible heading
  changes.)

## Workstream 3 — Sessions & Fixtures (`src/pages/events.astro`)

- **S31:** remove the light-blue background box behind the "Open Sessions" cards;
  align the section with the surrounding page hierarchy.
- **S32:** give the session cards a **darkened volleyball-photo overlay** so they
  are visually distinct from the (similarly blue) team-filter tab pills directly
  below. Source the photo from existing `src/assets` via `astro:assets`; if no
  suitable image exists, flag it for the designer rather than shipping a raw file
  in `public/`.
- **S28:** fixture-row date/meta text → body size (~15px).
- **S29:** consistent vertical spacing across fixture rows.
- **S30:** the responsive grid should switch to 4-up **earlier** (lower the
  breakpoint at which the session/team grid reflows to 4 columns).

Note: fixtures/result badges are injected via `set:html` and carry no Astro scope
attribute — per CLAUDE.md, any theme override for them must use a **plain**
selector (`html[data-theme="dark"] .badge-w`), not `:global(...)`.

## Workstream 4 — Team page (`src/pages/teams.astro`, `src/components/TeamCard.astro`)

- **S34–37:** normalize all team photos to a **single aspect ratio** (~3:2
  landscape, per the crop references on slides 35–37) using `astro:assets`
  `<Image>`/`<Picture>` with `object-fit: cover` and a sensible focal point per
  image so faces aren't cropped. (Per the project's astro-images rule: serve via
  `astro:assets` from `src/assets`, never raw files in `public/`.)
- **S38:** replace the Vinarius logo+wordmark **graphic** with the team name as
  **typed text, ALL CAPS, ~32px** (Sub tier), rendered uniformly with the other
  team cards (which already use typed names). The small team logo icon can stay;
  only the wordmark image is replaced by text.

## Workstream 5 — About page (`src/pages/about.astro`)

### S39–41 — replace "What We Stand For" with Allan's copy

Replace the existing 3 marketing cards (Inclusive / Competitive / Community) with
two blocks using Allan's exact wording:

**Our Values** (intro line: *"As a friendly local club, we have social values and
community as top of mind."*)

- **Inclusivity** — "We act as catalysts for change for a truly inclusive society
  by promoting safe, accessible and fair participation, and inspiring physical
  activity for all."
- **Respect** — "We value and celebrate unique and diverse talents, experiences
  and perspectives. We treat our participants, partners, donors, and each other
  with sensitivity and respect."
- **Collaboration** — "We work and win together, individually and collectively, as
  distinct and diverse individuals."

**Our Mission**

> "To develop, promote growth and increase the quality of volleyball for everyone
> within our community. Together, we can create positive opportunities that
> generate sustainable societal change."

Keep heading hierarchy semantic (h2 section / h3 cards) per the project's
heading-hierarchy rule; reuse the existing dark feature-surface styling where it
already exists rather than introducing new inline styles.

### S42 — icon slot

Extract the value-card icon into an **icon slot / small component** that renders
the current emoji (🤝 🏆 🌍 or the values-appropriate equivalents) now, and accepts
an SVG later as a drop-in replacement — so swapping to the designer's custom set
is a markup change with no structural rework.

## Out of scope / deferred

- Designer's custom SVG icon set (not yet delivered) — only the slot is built now.
- Phase 3-C photography (real photos + navy duotone) remains a separate effort,
  except where Workstream 3/4 already touch images.

## Testing & verification

- Vitest unit suite must stay green.
- Visual check across **both themes** (light/dark) for: nav white CTA (S25),
  community headings at 32px (S27), S&F session-card overlay + box removal
  (S31/S32), team photo grid uniformity (S34), About values/mission layout.
- Confirm tracking changes read correctly on the hero title (S17/18) and that
  eyebrows/buttons share one wide tracking while titles/subtitles share another.
- Run the responsive 4-up breakpoint (S30) at the intended width.
