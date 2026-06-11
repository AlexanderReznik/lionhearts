# Designer Feedback Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the designer's (Conway) review comments from `Lionhearts_Website Assets_Guide.pptx` slides 15–42 — global typography unification, content casing, homepage/nav tweaks, a Sessions & Fixtures section refresh, team-card name typography, and an About-page values/mission rewrite.

**Architecture:** Mostly CSS + content edits in vanilla Astro components, plus three shared typography tokens in `src/styles/global.css` that downstream components already reference (`--tracking-display`) or will reference (`--tracking-wide`, `--text-sub`). No new dependencies. All work continues on the existing `style/larger-base-font` branch.

**Tech Stack:** Astro 6 (static), TypeScript strict, scoped/`is:global` CSS, `astro:assets`, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-11-designer-feedback-fixes-design.md`

**Conventions (from CLAUDE.md & memory):**
- Brand tokens `--lh-*` (fixed); semantic tokens `--color-*` (theme-dependent). Components reference semantic tokens. Keep the two dark blocks (`[data-theme="dark"]` and the no-JS `@media (prefers-color-scheme: dark)`) in sync.
- Accent **text** uses `--color-accent-text`, never `--lh-blue`/`#54a4f7`.
- No inline styles — use scoped BEM classes.
- External links carry `rel="noopener noreferrer"`.
- Semantic headings (h2/h3), not styled `<p>`.
- Images via `astro:assets` (`<Image>`/`<Picture>`) from `src/assets`, never raw files in `public/`.
- For elements injected via `set:html` / inside `is:global`, theme overrides use a **plain** selector (`html[data-theme="dark"] .x`), not `:global(...)`.

**Verification used throughout:**
- Build: `npm run build` (expected: "Complete!" / no errors).
- Tests: `npm test` (expected: all pass — must stay green).
- Visual: `npm run dev`, open the page, toggle **both** light and dark themes.

---

## Task 1: Typography tokens — three tracking scales + sub-tier size (S16, S17, S18)

**Files:**
- Modify: `src/styles/global.css:58-61` (token block), `:145-159` (`.btn`), `:182-201` (`.eyebrow`), `:226-227` (`.page-hero__eyebrow`)

- [ ] **Step 1: Add/loosen tokens in `:root`**

Replace the existing display-token comment + block (lines 58–61):

```css
  /* Display headings (Tier A): tracking + leading shared by every uppercase
     900-weight title AND its matching sub-titles. Loosened per designer (S17/18 —
     titles were too tight); can go larger. Watermark words (Tier B, 8rem+) keep
     their own -0.05em locally. */
  --tracking-display: 0.02em;
  --leading-display:  1.05;

  /* The single "very wide" tracking — eyebrows + buttons only (S16). */
  --tracking-wide: 0.2em;
  /* Body + notes share one near-zero tracking (S16). */
  --tracking-body: 0;

  /* Sub-tier heading size ("Sub ~32px", S19/S27) — community + overheard heads. */
  --text-sub: clamp(2rem, 4vw, 2.5rem);
```

- [ ] **Step 2: Point `.btn` at the wide token**

In `.btn` (line ~153) change:

```css
  letter-spacing: 1.5px;
```
to
```css
  letter-spacing: var(--tracking-wide);
```

- [ ] **Step 3: Point `.eyebrow` at the wide token**

In `.eyebrow` (line ~190) change `letter-spacing: 3px;` to `letter-spacing: var(--tracking-wide);`.

- [ ] **Step 4: Point `.page-hero__eyebrow` at the wide token**

In `.page-hero__eyebrow` (line ~226) change `letter-spacing: 3px;` to `letter-spacing: var(--tracking-wide);`.

- [ ] **Step 5: Build + tests**

Run: `npm run build && npm test`
Expected: build completes, tests pass.

- [ ] **Step 6: Visual check**

Run `npm run dev`. On the homepage hero (`TOGETHER WE ROAR.`) confirm the title tracking is visibly looser than before (compare to designer sample on slide 17/18) and eyebrows/buttons share one wide tracking. The display token cascades to `.page-hero__title`, `.community__headline`, `.overheard__title` automatically. **Tune `--tracking-wide` (0.2em start) and `--tracking-display` (0.02em start, can go larger) by eye toward the designer samples.**

- [ ] **Step 7: Commit**

```bash
git add src/styles/global.css
git commit -m "style(type): three tracking scales + loosen display tracking (S16-18)"
```

---

## Task 2: Match community + overheard headings to sub-tier 32px (S27)

The two community headings differ: `.community__headline` renders ~32px on mobile while `.overheard__title` bottoms out at 1.4rem (≈22.4px). Unify both to the shared `--text-sub`.

**Files:**
- Modify: `src/components/CommunitySection.astro:87`
- Modify: `src/components/OverheardArchive.astro:88`

- [ ] **Step 1: Community headline → `--text-sub`**

In `CommunitySection.astro` `.community__headline` change:
```css
    font-size: clamp(2rem, 4vw, 2.5rem);
```
to
```css
    font-size: var(--text-sub);
```

- [ ] **Step 2: Overheard title → `--text-sub`**

In `OverheardArchive.astro` `.overheard__title` change:
```css
    font-size: clamp(1.4rem, 3vw, 1.8rem);
```
to
```css
    font-size: var(--text-sub);
```

- [ ] **Step 3: Build + visual**

Run `npm run build`, then `npm run dev`. On the homepage community band, confirm "VOLLEYBALL BRINGS THE WORLD TO E2." and "OUT OF CONTEXT. MOSTLY ON PURPOSE." now render at the **same** size (~32px on mobile widths, matching upward on desktop). Check both themes.

- [ ] **Step 4: Commit**

```bash
git add src/components/CommunitySection.astro src/components/OverheardArchive.astro
git commit -m "style(type): unify community + overheard headings to sub tier (S27)"
```

---

## Task 3: Homepage Sessions strip refinements (S22, S23, S24)

**Files:**
- Modify: `src/components/SessionsStrip.astro:22` (copy), `:109-131` (day/time/level styles), `:133-142` (link)

- [ ] **Step 1: Title Case the meta line (S22)**

Change line 22:
```html
        <span>No booking · no experience needed · Mulberry Academy, E2</span>
```
to
```html
        <span>No Booking · No Experience Needed · Mulberry Academy, E2</span>
```

- [ ] **Step 2: Day label — match time size, lighter weight, aligned tracking (S23)**

Replace `.sessions-strip__day` (lines ~109-116):
```css
  .sessions-strip__day {
    font-size: 0.625rem;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--lh-navy);
    white-space: nowrap;
  }
```
with
```css
  .sessions-strip__day {
    font-size: 0.9375rem;          /* match the time size */
    font-weight: 600;              /* lighter than the 900 time, to differentiate */
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--lh-navy);
    white-space: nowrap;
  }
```

- [ ] **Step 3: Give the time a touch more spacing so the "–" reads (S23)**

In `.sessions-strip__time` (lines ~118-124) change `letter-spacing: -0.02em;` to `letter-spacing: 0;`.

- [ ] **Step 4: "Full schedule →" link — more space + alignment (S24)**

Replace `.sessions-strip__link` (lines ~133-142):
```css
  .sessions-strip__link {
    flex-shrink: 0;
    font-size: 0.625rem;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--lh-navy);
    text-decoration: none;
    white-space: nowrap;
  }
```
with
```css
  .sessions-strip__link {
    flex-shrink: 0;
    font-size: 0.625rem;
    font-weight: 800;
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--lh-navy);
    text-decoration: none;
    white-space: nowrap;
    padding: 8px 14px;
    margin-left: 8px;
    border: 1px solid color-mix(in srgb, var(--lh-navy) 22%, transparent);
    border-radius: 6px;
  }
```

- [ ] **Step 5: Build + visual**

Run `npm run build` then `npm run dev`. On the homepage sessions strip confirm: meta line is Title Case; MON/THU/FRI now sit at the same size as the times but lighter; the "7–9pm" dash is comfortably spaced; "Full schedule →" reads as a bordered button with breathing room. Check the 960px and 560px breakpoints still look right.

- [ ] **Step 6: Commit**

```bash
git add src/components/SessionsStrip.astro
git commit -m "style(home): sessions strip casing, day-label + link refinements (S22-24)"
```

---

## Task 4: Nav CTA → white button for max contrast (S25)

**Files:**
- Modify: `src/components/Nav.astro:42`

- [ ] **Step 1: Swap the desktop nav CTA variant**

Change line 42:
```html
    <a href="/join" class="btn btn--primary nav__cta">Join Us</a>
```
to
```html
    <a href="/join" class="btn btn--white nav__cta">Join Us</a>
```

(`.btn--white` already exists: `background: var(--lh-white); color: var(--lh-navy);` — global.css:176.)

- [ ] **Step 2: Build + visual, BOTH themes**

Run `npm run build` then `npm run dev`. The nav bar is navy-ish in both themes (`--color-bg`). Confirm the "Join Us" button is now white-filled with navy text and stands out clearly in **light and dark**. Verify focus-visible outline still shows. If the white button looks too heavy on the light-theme nav, note it for the reviewer rather than reverting.

- [ ] **Step 3: Commit**

```bash
git add src/components/Nav.astro
git commit -m "style(nav): white CTA button for max contrast (S25)"
```

---

## Task 5: Sponsor tagline → Title Case (S26)

**Files:**
- Modify: `src/components/SponsorsSection.astro:6`

- [ ] **Step 1: Title Case the visible tagline**

Change line 6:
```js
  tagline:     'East London\'s independent wine merchant',
```
to
```js
  tagline:     'East London\'s Independent Wine Merchant',
```

(Leave SEO `description` strings in `sponsorship.astro` / `sponsors/vinarius.astro` unchanged — they are meta copy, not headings.)

- [ ] **Step 2: Build + visual**

Run `npm run build` then `npm run dev`. On the homepage sponsors section confirm the caption now reads "East London's Independent Wine Merchant".

- [ ] **Step 3: Commit**

```bash
git add src/components/SponsorsSection.astro
git commit -m "content(sponsors): title-case sponsor tagline (S26)"
```

---

## Task 6: S&F — remove the light-blue Open Sessions box + earlier 4-up grid (S31, S30)

**Files:**
- Modify: `src/pages/events.astro:342-348` (`.sessions-box`), `:360-364` (`.session-cards`)

- [ ] **Step 1: Strip the box background/border so the section aligns with page hierarchy (S31)**

Replace `.sessions-box` (lines ~342-348):
```css
  .sessions-box {
    background: linear-gradient(135deg, rgba(84,164,247,0.12), rgba(84,164,247,0.06));
    border: 1px solid var(--color-border-blue);
    border-radius: 14px;
    padding: 32px;
    margin-bottom: 36px;
  }
```
with
```css
  /* S31: no boxed background — the Open Sessions block aligns with the rest of
     the page hierarchy; the eyebrow heading + cards carry the section on their own. */
  .sessions-box {
    margin-bottom: 36px;
  }
```

- [ ] **Step 2: Let the 4-up grid kick in earlier (S30)**

In `.session-cards` (line ~362) change:
```css
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
```
to
```css
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
```

- [ ] **Step 3: Build + visual**

Run `npm run build` then `npm run dev`, open `/events`. Confirm the light-blue rounded box behind "Open Sessions" is gone and the eyebrow + session cards align to the page like the sections below. Resize the window — the cards should reach 4-up at a narrower width than before. Check both themes.

- [ ] **Step 4: Commit**

```bash
git add src/pages/events.astro
git commit -m "style(events): remove open-sessions box, earlier 4-up grid (S30-31)"
```

---

## Task 7: S&F — differentiate session cards with a darkened photo overlay (S32)

After Task 6 the blue session cards sit directly above the blue filter pills. Give the **schedule** cards (not the venue card) a darkened volleyball-photo background with white text so they read as distinct. Uses `astro:assets` (no raw `public/` file, no inline styles).

**Files:**
- Modify: `src/pages/events.astro` — frontmatter import (top, after existing imports ~line 1-13), markup (`:131-136`), styles (`:367-379`)

- [ ] **Step 1: Import the photo in frontmatter**

Add near the other imports at the top of the `---` block in `events.astro`:
```js
import { Image } from 'astro:assets';
import sessionPhoto from '../assets/hero/cats-2025-26-2.jpg';
```

- [ ] **Step 2: Layer the photo + overlay into the schedule card markup**

Replace the schedule `.session-card` block (lines ~131-136):
```html
          <div class="session-card section--community">
            <div class="session-card__day">{s.day}</div>
            <div class="session-card__time">{s.time}</div>
            <div class="session-card__level">{s.level}</div>
            <div class="session-card__venue">📍 {s.venue}<br />{s.price}</div>
          </div>
```
with
```html
          <div class="session-card session-card--photo">
            <Image
              class="session-card__bg"
              src={sessionPhoto}
              alt=""
              aria-hidden="true"
              widths={[240, 360, 480]}
              sizes="(max-width: 640px) 50vw, 240px"
              loading="lazy"
            />
            <div class="session-card__content">
              <div class="session-card__day">{s.day}</div>
              <div class="session-card__time">{s.time}</div>
              <div class="session-card__level">{s.level}</div>
              <div class="session-card__venue">📍 {s.venue}<br />{s.price}</div>
            </div>
          </div>
```

(The venue card on lines ~138-153 keeps its `section--community` blue treatment — leave it unchanged.)

- [ ] **Step 3: Style the photo card with overlay + white text**

Replace the `.session-card` rule and the four `.session-card__*` text rules (lines ~367-379):
```css
  /* Session cards — community tone: #54a4f7 bg (via .section--community), navy text */
  .session-card {
    border: 1px solid rgba(17,35,75,0.18);
    border-radius: 10px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .session-card__day { font-size: 0.8125rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: var(--lh-navy); }
  .session-card__time { font-size: 1.375rem; font-weight: 900; letter-spacing: -0.5px; color: var(--lh-navy); }
  .session-card__level { font-size: 0.5625rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--lh-navy); }
  .session-card__venue { font-size: 0.625rem; color: var(--lh-navy); line-height: 1.5; margin-top: 4px; }
```
with
```css
  /* Session cards — community tone: #54a4f7 bg (via .section--community), navy text */
  .session-card {
    border: 1px solid rgba(17,35,75,0.18);
    border-radius: 10px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  /* S32: photo-backed schedule cards — darkened so they read distinct from the
     blue filter pills below; text goes white over the overlay. */
  .session-card--photo {
    position: relative;
    overflow: hidden;
    border-color: rgba(5,18,43,0.4);
    background: var(--lh-navy-deep);
  }
  .session-card__bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .session-card--photo::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(160deg, rgba(5,18,43,0.78), rgba(17,35,75,0.88));
  }
  .session-card__content {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .session-card__day { font-size: 0.8125rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: var(--lh-navy); }
  .session-card__time { font-size: 1.375rem; font-weight: 900; letter-spacing: -0.5px; color: var(--lh-navy); }
  .session-card__level { font-size: 0.5625rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--lh-navy); }
  .session-card__venue { font-size: 0.625rem; color: var(--lh-navy); line-height: 1.5; margin-top: 4px; }

  /* White text on the darkened photo cards (overrides the navy defaults above). */
  .session-card--photo .session-card__day,
  .session-card--photo .session-card__time,
  .session-card--photo .session-card__level,
  .session-card--photo .session-card__venue { color: var(--lh-white); }
```

(Brand tokens confirmed in global.css: `--lh-navy-deep` = `#05122b`, `--lh-white` = `#ffffff`.)

- [ ] **Step 4: Build + visual**

Run `npm run build` then `npm run dev`, open `/events`. Confirm the three schedule cards now show a darkened team photo with white day/time/level text, clearly distinct from the venue card and the blue filter pills below. Verify text contrast is AA-legible over the overlay; **darken the `::after` gradient if any text is hard to read.** Check both themes (the photo cards look the same in both — that's intended).

- [ ] **Step 5: Commit**

```bash
git add src/pages/events.astro
git commit -m "feat(events): photo-overlay session cards to differentiate from pills (S32)"
```

---

## Task 8: S&F — fixture text to body size + even row spacing (S28, S29)

**Files:**
- Modify: `src/pages/events.astro:464` (`.team-fixtures`), `:501` (`.tl-date`), `:504` (`.tl-vs`), `:509` (`.tl-up-venue`), `:477-493` (row padding)

- [ ] **Step 1: Bump the fixture base font toward body size (S28)**

Change line 464:
```css
  .team-fixtures { font-size: 0.75rem; }
```
to
```css
  .team-fixtures { font-size: 0.875rem; }
```

- [ ] **Step 2: Scale the small meta bits up proportionally (S28)**

- `.tl-date` (line ~501): change `font-size: 0.65rem;` to `font-size: 0.8125rem;`
- `.tl-vs` (line ~504): change `font-size: 0.6rem;` to `font-size: 0.75rem;`
- `.tl-up-venue` (line ~509): change `font-size: 0.6rem;` to `font-size: 0.75rem;`

- [ ] **Step 3: Even vertical spacing across rows (S29)**

Confirm `.tl-row` and `.tl-row-up` (lines ~477-493) both use `padding: 10px 18px;`. If they differ, set both to `padding: 12px 18px;` so the result rows share one consistent rhythm. (Both currently read `padding: 10px 18px` — bump both to `12px 18px` for a touch more even breathing room.)

- [ ] **Step 4: Build + visual**

Run `npm run build` then `npm run dev`, open `/events`, expand a team's fixtures. Confirm the date / "vs" / opponent / result text is comfortably larger (body-ish) and the rows have even vertical spacing. Check both themes and the 640px breakpoint.

- [ ] **Step 5: Commit**

```bash
git add src/pages/events.astro
git commit -m "style(events): fixture text to body size, even row spacing (S28-29)"
```

---

## Task 9: Team cards — typed name instead of wordmark image (S38) + crop check (S34)

The team name currently renders as light/dark wordmark **images**. Replace with typed ALL-CAPS text at the sub tier (~32px). Team photos already use a uniform `16/9` + `object-fit: cover` (S34 "similar sized" is largely satisfied by the recent astro:assets photos); refine the aspect ratio toward the designer's crop references so faces aren't cut.

**Files:**
- Modify: `src/components/TeamCard.astro:6` (drop wordmark import), `:44-49` (name markup), `:112-116` (name styles), `:74-75` (photo aspect ratio)

- [ ] **Step 1: Remove the wordmark import**

Delete line 6:
```js
import { teamWordmarkSrc } from '../lib/teamWordmark';
```

- [ ] **Step 2: Replace the wordmark `<img>`s with typed text (S38)**

Replace the `<h2 class="team-card__name">` block (lines ~44-49):
```html
    <h2 class="team-card__name">
      <img class="team-card__wordmark team-card__wordmark--light"
           src={teamWordmarkSrc(team.name, 'base')} alt={team.name} loading="lazy" />
      <img class="team-card__wordmark team-card__wordmark--dark"
           src={teamWordmarkSrc(team.name, 'white')} alt="" aria-hidden="true" loading="lazy" />
    </h2>
```
with
```html
    <h2 class="team-card__name">{team.name}</h2>
```

- [ ] **Step 3: Replace the wordmark styles with text styles**

Replace the name + wordmark rules (lines ~112-116):
```css
  .team-card__name { margin-bottom: 8px; line-height: 0; }
  .team-card__wordmark { height: 30px; width: auto; display: block; }
  .team-card__wordmark--dark { display: none; }
  :global([data-theme="dark"]) .team-card__wordmark--light { display: none; }
  :global([data-theme="dark"]) .team-card__wordmark--dark { display: block; }
```
with
```css
  .team-card__name {
    margin-bottom: 8px;
    font-size: var(--text-sub);
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: var(--tracking-display);
    line-height: 1;
    color: var(--color-text);
  }
```

- [ ] **Step 4: Nudge the photo crop toward the designer's references (S34)**

In `.team-card__photo` (line ~75) change:
```css
    aspect-ratio: 16 / 9;
```
to
```css
    aspect-ratio: 3 / 2;
```

(`object-fit: cover` already keeps every card identical in size; 3:2 is taller than 16:9 so fewer heads get cropped, matching slides 35–37.)

- [ ] **Step 5: Build + visual**

Run `npm run build` then `npm run dev`, open `/teams`. Confirm every team name renders as uppercase typed text at the sub size (≈32px), consistent across all cards (including VINARIUS — slide 38), and that all photos are the same size with a 3:2 crop that keeps faces visible. Check both themes (names use `--color-text`, so they flip correctly). If any specific photo still crops badly, note it — a per-team `object-position` is a possible follow-up.

- [ ] **Step 6: Check for now-unused wordmark helper**

Run: `grep -rn "teamWordmarkSrc\|team-card__wordmark" src`
Expected: no remaining references in components. If `src/lib/teamWordmark.ts` is now unused everywhere, leave the file in place (it ships no runtime cost and the `public/brand/teams/*.svg` assets remain) unless `grep` shows zero importers — in which case deleting `src/lib/teamWordmark.ts` is a clean removal. Decide based on the grep output.

- [ ] **Step 7: Commit**

```bash
git add src/components/TeamCard.astro
git commit -m "style(teams): typed team names + 3:2 photo crop (S34, S38)"
```

---

## Task 10: About page — replace values with Allan's copy + Our Mission + icon slot (S39, S40, S41, S42)

Replace the three marketing cards with Allan's values (Inclusivity / Respect / Collaboration) and add an Our Mission block. Make the icon SVG-ready (S42) by supporting an optional `iconSvg` path that renders in place of the emoji when present.

**Files:**
- Modify: `src/pages/about.astro:22-39` (values data), `:99-113` (markup), `:204-206` (icon style), add mission styles

- [ ] **Step 1: Replace the `values` array with Allan's copy + add mission constant**

Replace lines 22-39:
```js
const values = [
  {
    icon: '🤝',
    title: 'Inclusive',
    body: 'From your first ever open session to the NVL Super League — there\'s a team and a level for everyone. No experience, no problem.',
  },
  {
    icon: '🏆',
    title: 'Competitive',
    body: '9 teams. NVL Super League. 9× LVA Champions. We\'re here to win — at every division, not just the top.',
    featured: true,
  },
  {
    icon: '🌍',
    title: 'Community',
    body: 'Players from all over the world call Lionhearts home. If you\'re new to London, you\'ll feel it within your first session.',
  },
];
```
with
```js
// Our Values — Allan's copy (slides 40–41). `iconSvg` is an optional path to a
// future custom SVG (S42); while null we render the emoji fallback.
const valuesIntro =
  'As a friendly local club, we have social values and community as top of mind.';

const values = [
  {
    icon: '🤝',
    iconSvg: null as string | null,
    title: 'Inclusivity',
    body: 'We act as catalysts for change for a truly inclusive society by promoting safe, accessible and fair participation, and inspiring physical activity for all.',
  },
  {
    icon: '⚖️',
    iconSvg: null as string | null,
    title: 'Respect',
    body: 'We value and celebrate unique and diverse talents, experiences and perspectives. We treat our participants, partners, donors, and each other with sensitivity and respect.',
    featured: true,
  },
  {
    icon: '🤲',
    iconSvg: null as string | null,
    title: 'Collaboration',
    body: 'We work and win together, individually and collectively, as distinct and diverse individuals.',
  },
];

const mission =
  'To develop, promote growth and increase the quality of volleyball for everyone within our community. Together, we can create positive opportunities that generate sustainable societal change.';
```

- [ ] **Step 2: Update the values section markup + add Our Mission (S39–41) and icon slot (S42)**

Replace the values section (lines ~99-113):
```html
  <!-- Values band — dark feature surface for a punchy "what we stand for" close -->
  <section class="about-values section--feature">
    <div class="about-values__inner container">
      <p class="eyebrow">What We Stand For</p>
      <div class="values-row">
        {values.map(v => (
          <div class:list={['value-card', { 'value-card--featured': v.featured }]}>
            <div class="value-card__icon" aria-hidden="true">{v.icon}</div>
            <h3 class="value-card__title">{v.title}</h3>
            <p class="value-card__body">{v.body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
```
with
```html
  <!-- Values band — dark feature surface; copy from Allan (slides 40–41) -->
  <section class="about-values section--feature">
    <div class="about-values__inner container">
      <p class="eyebrow">Our Values</p>
      <p class="about-values__intro">{valuesIntro}</p>
      <div class="values-row">
        {values.map(v => (
          <div class:list={['value-card', { 'value-card--featured': v.featured }]}>
            <div class="value-card__icon" aria-hidden="true">
              {v.iconSvg
                ? <img class="value-card__icon-svg" src={v.iconSvg} alt="" />
                : v.icon}
            </div>
            <h3 class="value-card__title">{v.title}</h3>
            <p class="value-card__body">{v.body}</p>
          </div>
        ))}
      </div>

      <div class="about-mission">
        <h3 class="eyebrow about-mission__eyebrow">Our Mission</h3>
        <p class="about-mission__text">{mission}</p>
      </div>
    </div>
  </section>
```

- [ ] **Step 3: Add intro / mission / icon-svg styles**

In the `.about-values` style area (after `.value-card__body`, around line 206) add:
```css
  .about-values__intro {
    color: var(--color-text-muted);
    font-size: 0.9375rem;
    line-height: 1.6;
    max-width: 60ch;
    margin-bottom: 28px;
  }

  .value-card__icon-svg { width: 1.75rem; height: 1.75rem; display: block; }

  .about-mission { margin-top: 40px; }
  .about-mission__eyebrow { margin-bottom: 16px; }
  .about-mission__text {
    font-size: var(--text-sub);
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: var(--tracking-display);
    max-width: 22ch;
  }
```

(Sub-tier mission statement reads as the section's closing line. `max-width: 22ch` keeps it punchy; widen if it wraps awkwardly.)

- [ ] **Step 4: Build + tests**

Run: `npm run build && npm test`
Expected: build completes (TypeScript strict accepts the `string | null` typing), tests pass.

- [ ] **Step 5: Visual check, both themes**

Run `npm run dev`, open `/about`. Confirm: the values band now reads "Our Values" with the intro line, three cards (INCLUSIVITY / RESPECT / COLLABORATION) using Allan's copy with emoji icons, then an "Our Mission" block with the mission statement at the sub size. Check heading hierarchy (h2 section eyebrow is a `<p class="eyebrow">`; cards use `<h3>`; the mission sub-head is an `<h3>`). Verify both themes.

- [ ] **Step 6: Commit**

```bash
git add src/pages/about.astro
git commit -m "content(about): Allan's values + mission, SVG-ready icon slot (S39-42)"
```

---

## Task 11 (OPTIONAL): Eyebrow line-height treatment experiment (S21)

Flagged optional in the spec — the designer's eyebrow sample (slide 21) shows the leading rule sized to match the text. Try it; keep only if it reads well.

**Files:**
- Modify: `src/styles/global.css:194-201` (`.eyebrow::before`)

- [ ] **Step 1: Make the eyebrow rule's height track the text**

In `.eyebrow::before` (line ~196-199) try changing `height: 2px;` to `height: 0.625em;` and `width: 20px;` to `width: 3px;` so the mark reads as a short thick bar the height of the eyebrow text (per slide 21). Adjust width/height to taste.

- [ ] **Step 2: Visual check**

Run `npm run dev`. Compare a couple of eyebrows (homepage "Our Community", `/events` "Open Sessions") against slide 21. **If it does not clearly improve on the current thin rule, revert this task entirely** — it must not regress the existing look.

- [ ] **Step 3: Commit (only if kept)**

```bash
git add src/styles/global.css
git commit -m "style(type): thicker eyebrow rule treatment (S21)"
```

---

## Final verification

- [ ] **Full build + test sweep**

Run: `npm run build && npm test`
Expected: build "Complete!", all Vitest tests pass.

- [ ] **Cross-page visual pass (both themes)**

`npm run dev` and walk: `/` (hero tracking S17/18, eyebrows/buttons wide S16, sessions strip S22–24, white nav CTA S25, sponsor casing S26, community headings 32px S27), `/events` (no box S31, 4-up earlier S30, photo cards S32, fixture text/spacing S28–29), `/teams` (typed names S38, 3:2 crop S34), `/about` (values + mission S39–41, icons S42). Toggle light/dark on each.

- [ ] **Spec cross-check**

Open `docs/superpowers/specs/2026-06-11-designer-feedback-fixes-design.md` and confirm every S-number has a corresponding committed change (S19/S20 are satisfied by the existing 18px base bump; note that in the PR description).

---

## Coverage map (spec → task)

| Comment | Task |
|---------|------|
| S16 tracking unification | 1 |
| S17/S18 titles too tight | 1 |
| S19 desktop font hierarchy | (already satisfied by 18px base bump; verified in Final) |
| S20 body 14→15 | (base bump; verify in Final) |
| S21 eyebrow treatment | 11 (optional) |
| S22 homepage meta Title Case | 3 |
| S23 day labels / time spacing | 3 |
| S24 Full-schedule button | 3 |
| S25 white nav CTA | 4 |
| S26 sponsor tagline Title Case | 5 |
| S27 community headings 32px | 2 |
| S28 fixture text too small | 8 |
| S29 fixture row spacing | 8 |
| S30 4-up grid earlier | 6 |
| S31 remove light-blue box | 6 |
| S32 differentiate session cards | 7 |
| S34 team photos similar sized | 9 |
| S35–37 crop references | 9 (3:2 crop) |
| S38 team name typed text | 9 |
| S39–41 About values + mission | 10 |
| S42 emoji → SVG-ready slot | 10 |
