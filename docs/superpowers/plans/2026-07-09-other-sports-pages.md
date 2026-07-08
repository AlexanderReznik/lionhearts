# Football & Netball ("Other Sports") Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add volleyball-first "satellite" pages at `/football` and `/netball`, reachable from an "Other Sports" nav dropdown and footer links, reusing the existing design system and theming in light + dark.

**Architecture:** A typed data file (`src/data/sports.ts`) holds one entry per sport. A shared `SportPage.astro` component renders one entry (branded hero → intro → team → schedule → join). Two thin route files pass their data slice to it. The nav gains a data-driven "Other Sports" dropdown (desktop + mobile overlay); the footer gains two links.

**Tech Stack:** Astro 6 (static), TypeScript strict, Vitest, existing CSS token system in `src/styles/global.css`.

**Hard requirements (from spec):** No hardcoded colour/spacing/type — only semantic/scale tokens (`--color-*`, `--space-*`, `--text-*`, `--weight-*`, `--tracking-*`). No inline styles. Accent **text** uses `--color-accent-text`, never `--lh-blue`/hex. Every new surface must work in light and dark; because it references only semantic tokens it themes automatically — verified, not assumed.

**Note on TDD:** This repo unit-tests lib/data logic with Vitest (see `tests/`), and verifies Astro components/CSS via build + Chrome DevTools MCP at real mobile widths in both themes (per CLAUDE.md). This plan follows that split: Task 1 (the data file) is test-first with Vitest; the Astro/CSS tasks use build + browser verification steps.

---

## File Structure

- **Create** `src/data/sports.ts` — `OtherSport` interface + `otherSports` array (football, netball). One responsibility: sport page content.
- **Create** `tests/sports.test.ts` — data integrity test.
- **Create** `src/components/SportPage.astro` — renders one `OtherSport` (all page sections + scoped styles).
- **Create** `src/pages/football.astro` — thin route wrapper.
- **Create** `src/pages/netball.astro` — thin route wrapper.
- **Modify** `src/components/Nav.astro` — data-driven "Other Sports" dropdown (desktop + overlay), CSS, JS.
- **Modify** `src/components/Footer.astro:8-12` — add Football + Netball to `clubLinks`.
- **Modify** `human-todo.md` — owner content checklist.

---

## Task 1: Sport data model + test

**Files:**
- Create: `src/data/sports.ts`
- Test: `tests/sports.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/sports.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { otherSports } from '../src/data/sports';

describe('otherSports data', () => {
  it('includes exactly football and netball', () => {
    expect(otherSports.map(s => s.slug).sort()).toEqual(['football', 'netball']);
  });

  it('has unique slugs', () => {
    const slugs = otherSports.map(s => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every sport has the required non-empty fields', () => {
    for (const s of otherSports) {
      expect(s.name).toBeTruthy();
      expect(s.eyebrow).toBeTruthy();
      expect(s.titleLead).toBeTruthy();
      expect(s.titleEm).toBeTruthy();
      expect(s.intro.length).toBeGreaterThan(0);
      expect(s.team.name).toBeTruthy();
      expect(s.team.league).toBeTruthy();
      expect(s.schedule.training.day).toBeTruthy();
      expect(s.schedule.training.time).toBeTruthy();
      expect(s.schedule.training.venue).toBeTruthy();
      expect(s.join.label).toBeTruthy();
      expect(s.join.href).toMatch(/^(https?:|mailto:|tel:)/);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/sports.test.ts`
Expected: FAIL — cannot resolve `../src/data/sports` (module does not exist yet).

- [ ] **Step 3: Create the data file**

Create `src/data/sports.ts`. Placeholder copy is intentional — the owner swaps in real details later (tracked in `human-todo.md`, Task 7). `DEFAULT_VENUE`, `WHATSAPP_URL`, `CONTACT_EMAIL` are reused from `src/data/club.ts`.

```ts
// src/data/sports.ts
// Volleyball-first "satellite" sports. One team + a fixed schedule each.
import type { ImageMetadata } from 'astro';
import { DEFAULT_VENUE, WHATSAPP_URL } from './club';

export interface OtherSport {
  slug: 'football' | 'netball';
  name: string;        // full name, e.g. "Lionhearts Football"
  eyebrow: string;     // hero eyebrow, e.g. "London Lionhearts · Football"
  titleLead: string;   // hero title, plain part
  titleEm: string;     // hero title, accented <em> part
  intro: string;       // 2–3 sentences (also used as meta description)
  team: { name: string; league: string };
  schedule: {
    training: { day: string; time: string; venue: string };
    matches?: { day: string; venue: string };  // omit if train-only
  };
  join: { label: string; href: string };       // https: | mailto: | tel:
  heroImage?: ImageMetadata;                    // optional — enables photo hero
  alt?: string;                                 // required when heroImage is set
}

export const otherSports: OtherSport[] = [
  {
    slug: 'football',
    name: 'Lionhearts Football',
    eyebrow: 'London Lionhearts · Football',
    titleLead: 'Lionhearts',
    titleEm: 'Football',
    intro:
      'The Lionhearts football side brings the same community spirit off the volleyball court and onto the pitch. Friendly, competitive, and open to new players.',
    team: { name: "Lionhearts FC", league: 'Placeholder League — confirm with organiser' },
    schedule: {
      training: { day: 'Wednesdays', time: '7:00pm–9:00pm', venue: DEFAULT_VENUE },
      matches: { day: 'Sundays', venue: 'Home ground — confirm with organiser' },
    },
    join: { label: 'Message us on WhatsApp', href: WHATSAPP_URL },
  },
  {
    slug: 'netball',
    name: 'Lionhearts Netball',
    eyebrow: 'London Lionhearts · Netball',
    titleLead: 'Lionhearts',
    titleEm: 'Netball',
    intro:
      'The Lionhearts netball side is part of the same club family — a welcoming team for players of all levels looking for regular, competitive netball in east London.',
    team: { name: 'Lionhearts Netball', league: 'Placeholder League — confirm with organiser' },
    schedule: {
      training: { day: 'Thursdays', time: '7:00pm–9:00pm', venue: DEFAULT_VENUE },
      matches: { day: 'Saturdays', venue: 'Home court — confirm with organiser' },
    },
    join: { label: 'Message us on WhatsApp', href: WHATSAPP_URL },
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/sports.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/sports.ts tests/sports.test.ts
git commit -m "feat(sports): data model + test for football & netball"
```

---

## Task 2: SportPage component

**Files:**
- Create: `src/components/SportPage.astro`

- [ ] **Step 1: Create the component**

Create `src/components/SportPage.astro`. Reuses `.page-hero*`, `.eyebrow`, `.section-eyebrow`, and `.btn--accent` from `global.css`. All scoped CSS below uses only semantic/scale tokens, so it themes automatically. External `join.href` uses the established spread pattern.

```astro
---
// src/components/SportPage.astro
// Renders one OtherSport entry: branded hero → intro → team → schedule → join.
import { Picture } from 'astro:assets';
import GraphicAccent from './GraphicAccent.astro';
import type { OtherSport } from '../data/sports';

interface Props { sport: OtherSport; }
const { sport } = Astro.props;
const href = sport.join.href;
const external = href.startsWith('http');
---

<div class="page-hero sport-hero">
  {sport.heroImage ? (
    <Picture
      src={sport.heroImage}
      formats={['avif', 'webp']}
      alt={sport.alt ?? ''}
      class="sport-hero__img"
    />
  ) : (
    <GraphicAccent motif="claw" position="top-right" class="sport-hero__accent" />
  )}
  <p class="eyebrow page-hero__eyebrow">{sport.eyebrow}</p>
  <h1 class="page-hero__title">{sport.titleLead} <em>{sport.titleEm}</em></h1>
  <p class="page-hero__sub">{sport.intro}</p>
</div>

<div class="page-content sport-content">
  <section class="sport-block">
    <h2 class="eyebrow section-eyebrow">The Team</h2>
    <p class="sport-team">
      <span class="sport-team__name">{sport.team.name}</span>
      <span class="sport-team__league">{sport.team.league}</span>
    </p>
  </section>

  <section class="sport-block">
    <h2 class="eyebrow section-eyebrow">Training &amp; Matches</h2>
    <div class="sport-schedule">
      <div class="sport-schedule__item">
        <span class="sport-schedule__label">Training</span>
        <span class="sport-schedule__detail">
          {sport.schedule.training.day} · {sport.schedule.training.time}
        </span>
        <span class="sport-schedule__venue">{sport.schedule.training.venue}</span>
      </div>
      {sport.schedule.matches && (
        <div class="sport-schedule__item">
          <span class="sport-schedule__label">Matches</span>
          <span class="sport-schedule__detail">{sport.schedule.matches.day}</span>
          <span class="sport-schedule__venue">{sport.schedule.matches.venue}</span>
        </div>
      )}
    </div>
  </section>

  <section class="sport-join">
    <h2 class="sport-join__headline">Want to play?</h2>
    <p class="sport-join__sub">New players always welcome — get in touch and come down.</p>
    <a
      href={href}
      class="btn btn--accent"
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >{sport.join.label}</a>
  </section>
</div>

<style>
  /* Hero: photo when supplied, else a decorative brand accent on the tinted
     .page-hero panel. Both themes inherit page-hero's semantic tokens. */
  .sport-hero { position: relative; }
  .sport-hero__img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.5;
    z-index: 0;
  }
  .sport-hero > :not(.sport-hero__img) { position: relative; z-index: 1; }
  .sport-hero__accent { opacity: 0.6; }

  .sport-block { margin-bottom: var(--space-lg); }

  .sport-team {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .sport-team__name {
    font-size: var(--text-lead);
    font-weight: var(--weight-black);
    color: var(--color-text);
  }
  .sport-team__league {
    font-size: var(--text-body);
    color: var(--color-text-muted);
  }

  .sport-schedule {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-md);
  }
  .sport-schedule__item {
    flex: 1;
    min-width: 240px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: var(--space-md);
    background: var(--color-bg-alt);
    border: 1px solid var(--color-border);
    border-radius: 12px;
  }
  .sport-schedule__label {
    font-size: var(--text-eyebrow);
    font-weight: var(--weight-bold);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--color-accent-text);
  }
  .sport-schedule__detail {
    font-size: var(--text-lead);
    font-weight: var(--weight-bold);
    color: var(--color-text);
  }
  .sport-schedule__venue {
    font-size: var(--text-note);
    color: var(--color-text-muted);
  }

  .sport-join {
    margin-top: var(--space-lg);
    padding: var(--space-lg);
    text-align: center;
    background: var(--color-bg-alt);
    border: 1px solid var(--color-border);
    border-radius: 14px;
  }
  .sport-join__headline {
    font-size: var(--text-sub);
    font-weight: var(--weight-black);
    text-transform: uppercase;
    letter-spacing: var(--tracking-display);
    color: var(--color-text);
    margin-bottom: 8px;
  }
  .sport-join__sub {
    font-size: var(--text-body);
    color: var(--color-text-muted);
    margin-bottom: var(--space-md);
  }
</style>
```

- [ ] **Step 2: Type-check the component**

Run: `SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run build`
Expected: build SUCCEEDS (the component isn't routed yet, but `astro check`/build must not error on it). If the build doesn't compile unreferenced components, this is confirmed in Task 3 instead — proceed.

- [ ] **Step 3: Commit**

```bash
git add src/components/SportPage.astro
git commit -m "feat(sports): shared SportPage component"
```

---

## Task 3: Route pages (/football, /netball)

**Files:**
- Create: `src/pages/football.astro`
- Create: `src/pages/netball.astro`

- [ ] **Step 1: Create `src/pages/football.astro`**

```astro
---
// src/pages/football.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import SportPage from '../components/SportPage.astro';
import { otherSports } from '../data/sports';

const sport = otherSports.find(s => s.slug === 'football')!;
---
<BaseLayout title={sport.name} description={sport.intro}>
  <SportPage sport={sport} />
</BaseLayout>
```

- [ ] **Step 2: Create `src/pages/netball.astro`**

```astro
---
// src/pages/netball.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import SportPage from '../components/SportPage.astro';
import { otherSports } from '../data/sports';

const sport = otherSports.find(s => s.slug === 'netball')!;
---
<BaseLayout title={sport.name} description={sport.intro}>
  <SportPage sport={sport} />
</BaseLayout>
```

- [ ] **Step 3: Build**

Run: `SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run build`
Expected: build SUCCEEDS; `dist/football/index.html` and `dist/netball/index.html` exist. Confirm both appear in `dist/sitemap-0.xml` (they should — the sitemap filter only excludes `/join-success/`).

Run: `ls dist/football/index.html dist/netball/index.html && grep -c 'football\|netball' dist/sitemap-0.xml`
Expected: both files listed; grep count ≥ 2.

- [ ] **Step 4: Verify in browser (light + dark, mobile)**

Start dev: `SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run dev`
Using Chrome DevTools MCP:
- Navigate to `http://localhost:4321/football` and `/netball`.
- `emulate` viewport `320x700x2,mobile,touch`; check `document.documentElement.scrollWidth <= clientWidth` (no horizontal overflow) at 320, then 375, then 414.
- Toggle theme (the nav ThemeToggle) and confirm hero, schedule cards, and join block all read correctly in **both** light and dark — text legible, accent text uses the blue/navy accent per theme, borders visible.
Expected: no overflow at any width; both themes legible.

- [ ] **Step 5: Commit**

```bash
git add src/pages/football.astro src/pages/netball.astro
git commit -m "feat(sports): /football and /netball routes"
```

---

## Task 4: Footer links

**Files:**
- Modify: `src/components/Footer.astro:8-12`

- [ ] **Step 1: Add the two links to `clubLinks`**

In `src/components/Footer.astro`, change the `clubLinks` array from:

```ts
const clubLinks = [
  { label: 'About Us',          href: '/about' },
  { label: 'Meet Our Teams',    href: '/teams' },
  { label: 'Sessions',          href: '/events' },
];
```

to:

```ts
const clubLinks = [
  { label: 'About Us',          href: '/about' },
  { label: 'Meet Our Teams',    href: '/teams' },
  { label: 'Sessions',          href: '/events' },
  { label: 'Football',          href: '/football' },
  { label: 'Netball',           href: '/netball' },
];
```

- [ ] **Step 2: Build to verify**

Run: `SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run build`
Expected: SUCCEEDS; `grep -o '/football\|/netball' dist/index.html | sort -u` shows both (footer renders on every page).

- [ ] **Step 3: Commit**

```bash
git add src/components/Footer.astro
git commit -m "feat(sports): footer links to football & netball"
```

---

## Task 5: Nav "Other Sports" dropdown — desktop

**Files:**
- Modify: `src/components/Nav.astro` (navLinks data `:5-12`, desktop links map `:25-37`, `<style>`, `<script>`)

- [ ] **Step 1: Make `navLinks` data-driven with children**

Replace the `navLinks` array (`src/components/Nav.astro:5-12`) with:

```ts
const navLinks = [
  { label: 'Home',         href: '/' },
  { label: 'About',        href: '/about' },
  { label: 'Sessions',     href: '/events' },
  { label: 'Teams',        href: '/teams' },
  { label: 'Other Sports', href: '/football', children: [
      { label: 'Football', href: '/football' },
      { label: 'Netball',  href: '/netball' },
  ] },
  { label: 'Sponsors',     href: '/sponsorship' },
  { label: 'Contact',      href: '/contact' },
];
```

- [ ] **Step 2: Render the dropdown in the desktop links map**

Replace the desktop `<ul class="nav__links">` map body (`src/components/Nav.astro:26-36`) with:

```astro
      {navLinks.map(link => (
        <li>
          {link.children ? (
            <div class:list={['nav__dropdown', { 'nav__dropdown--active': link.children.some(c => isActive(c.href)) }]}>
              <button type="button" class="nav__dropdown-toggle" aria-expanded="false" aria-haspopup="true">
                {link.label}<span class="nav__dropdown-caret" aria-hidden="true">▾</span>
              </button>
              <ul class="nav__dropdown-menu" role="list">
                {link.children.map(child => (
                  <li>
                    <a
                      href={child.href}
                      class:list={['nav__dropdown-item', { 'nav__dropdown-item--active': isActive(child.href) }]}
                      aria-current={isActive(child.href) ? 'page' : undefined}
                    >{child.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <a
              href={link.href}
              class:list={['nav__link', { 'nav__link--active': isActive(link.href) }]}
              aria-current={isActive(link.href) ? 'page' : undefined}
            >{link.label}</a>
          )}
        </li>
      ))}
```

- [ ] **Step 3: Add dropdown CSS**

Add to the `<style>` block in `src/components/Nav.astro`, right after the `.nav__link--active` rule (`:142`):

```css
  /* ── Other Sports dropdown (desktop) ── */
  .nav__dropdown { position: relative; display: flex; align-items: center; }

  .nav__dropdown-toggle {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    color: var(--color-text-muted);
    font-size: var(--text-note);
    font-weight: var(--weight-semibold);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    padding: 4px 0 2px;
    border-bottom: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s;
  }
  .nav__dropdown-toggle:hover { color: var(--color-text); }
  .nav__dropdown--active .nav__dropdown-toggle {
    color: var(--color-text);
    border-bottom-color: var(--color-accent-text);
  }
  .nav__dropdown-toggle:focus-visible {
    outline: 2px solid var(--color-accent-to);
    outline-offset: 3px;
    border-radius: 4px;
  }
  .nav__dropdown-caret { font-size: 0.7em; transition: transform 0.15s; }

  .nav__dropdown-menu {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(6px);
    min-width: 160px;
    list-style: none;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 6px;
    box-shadow: 0 16px 40px -16px rgba(5, 18, 43, 0.4);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.15s, transform 0.15s;
    z-index: 120;
  }
  .nav__dropdown:hover .nav__dropdown-menu,
  .nav__dropdown:focus-within .nav__dropdown-menu,
  .nav__dropdown--open .nav__dropdown-menu {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateX(-50%) translateY(2px);
  }
  .nav__dropdown:hover .nav__dropdown-caret,
  .nav__dropdown--open .nav__dropdown-caret { transform: rotate(180deg); }

  .nav__dropdown-item {
    display: block;
    padding: 8px 12px;
    border-radius: 6px;
    color: var(--color-text-muted);
    text-decoration: none;
    font-size: var(--text-note);
    font-weight: var(--weight-semibold);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    white-space: nowrap;
    transition: color 0.15s, background 0.15s;
  }
  .nav__dropdown-item:hover { color: var(--color-text); background: var(--color-bg-alt); }
  .nav__dropdown-item--active { color: var(--color-accent-text); }
  .nav__dropdown-item:focus-visible {
    outline: 2px solid var(--color-accent-to);
    outline-offset: 2px;
  }
```

- [ ] **Step 4: Add dropdown JS (click toggle + close on outside/Escape)**

Add to the `<script>` block in `src/components/Nav.astro`, immediately before the `// ── Theme toggle ──` comment (`:334`):

```js
  // ── Other Sports dropdown ──────────────────────────────────────
  const dropdown = document.querySelector<HTMLElement>('.nav__dropdown');
  const dropToggle = dropdown?.querySelector<HTMLButtonElement>('.nav__dropdown-toggle');

  function closeDropdown(): void {
    dropdown?.classList.remove('nav__dropdown--open');
    dropToggle?.setAttribute('aria-expanded', 'false');
  }

  dropToggle?.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    const open = dropdown?.classList.toggle('nav__dropdown--open');
    dropToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  document.addEventListener('click', (e: MouseEvent) => {
    if (dropdown && !dropdown.contains(e.target as Node)) closeDropdown();
  });

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeDropdown();
  });
```

- [ ] **Step 5: Build + verify desktop dropdown**

Run: `SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run build`
Expected: SUCCEEDS.

Start dev and use Chrome DevTools MCP at desktop width (≥1000px):
- Hover "Other Sports" → menu appears with Football + Netball.
- Click the toggle → menu opens; click outside → closes; press Escape → closes.
- On `/football`, the "Other Sports" toggle shows the active underline (`nav__dropdown--active`).
- Toggle dark theme → menu surface (`--color-surface`), border, and item text all legible.
Expected: all behaviours pass in light and dark.

- [ ] **Step 6: Commit**

```bash
git add src/components/Nav.astro
git commit -m "feat(nav): Other Sports dropdown (desktop)"
```

---

## Task 6: Nav "Other Sports" — mobile overlay subgroup

**Files:**
- Modify: `src/components/Nav.astro` (overlay links map `:66-77`, `<style>`)

- [ ] **Step 1: Render the subgroup in the overlay map**

Replace the overlay `<ul class="nav__overlay-links">` map body (`src/components/Nav.astro:67-77`) with:

```astro
    {navLinks.map(link => (
      <li>
        {link.children ? (
          <div class="nav__overlay-group">
            <span class="nav__overlay-grouplabel">{link.label}</span>
            {link.children.map(child => (
              <a
                href={child.href}
                class:list={['nav__overlay-link', 'nav__overlay-link--sub', { 'nav__overlay-link--active': isActive(child.href) }]}
                aria-current={isActive(child.href) ? 'page' : undefined}
              >{child.label}</a>
            ))}
          </div>
        ) : (
          <a
            href={link.href}
            class:list={['nav__overlay-link', { 'nav__overlay-link--active': isActive(link.href) }]}
            aria-current={isActive(link.href) ? 'page' : undefined}
          >{link.label}</a>
        )}
      </li>
    ))}
```

(The existing "close overlay on link click" handler at `:315` selects `.nav__overlay-link`; the sub-links carry that class, so tapping Football/Netball still closes the menu. No JS change needed.)

- [ ] **Step 2: Add overlay subgroup CSS**

Add to the `<style>` block in `src/components/Nav.astro`, after the `.nav__overlay-link--active` rule (`:234`):

```css
  .nav__overlay-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .nav__overlay-grouplabel {
    font-size: var(--text-eyebrow);
    font-weight: var(--weight-bold);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--color-text-faint);
  }
  .nav__overlay-link--sub { font-size: var(--text-lg); }
```

- [ ] **Step 3: Build + verify mobile overlay**

Run: `SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run build`
Expected: SUCCEEDS.

Chrome DevTools MCP, `emulate` `375x800x2,mobile,touch`:
- Open the ☰ menu → an "Other Sports" label with Football + Netball beneath it.
- Tap Football → navigates to `/football` and the overlay closes.
- Confirm the label + sublinks are legible in light and dark.
- Confirm the nav still collapses to ☰ at ≤992px and the full row (with the new dropdown) still fits above 992px.
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/Nav.astro
git commit -m "feat(nav): Other Sports subgroup in mobile overlay"
```

---

## Task 7: Full verification + owner content checklist

**Files:**
- Modify: `human-todo.md`

- [ ] **Step 1: Run the unit tests**

Run: `npm test`
Expected: all suites pass, including `tests/sports.test.ts`.

- [ ] **Step 2: Full production build**

Run: `SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run build`
Expected: SUCCEEDS with no errors/warnings about the new pages.

- [ ] **Step 3: Final browser sweep**

Chrome DevTools MCP — for `/football` and `/netball`, at 320/375/414 and desktop, in light **and** dark:
- No horizontal overflow (`scrollWidth <= clientWidth`).
- Hero, team, schedule, join all legible; accent text correct per theme.
- Dropdown works (desktop hover/click/Escape; mobile overlay subgroup).
Expected: clean on all combinations.

- [ ] **Step 4: Add the owner content checklist to `human-todo.md`**

Append this section to `human-todo.md`:

```markdown
---

## 15. Football & Netball page content

The `/football` and `/netball` pages ship with **placeholder copy**. Replace it in
`src/data/sports.ts` (the `otherSports` array) — one entry per sport. For each sport,
ask that team's organiser for:

- **Intro** — 2–3 sentences (who they are, level, vibe). → `intro`
- **Team name + league/division** → `team.name`, `team.league`
- **Training** — day, time, venue → `schedule.training`
- **Matches** — day + venue (or tell me they only train, and I'll drop the matches line) → `schedule.matches`
- **How to join** — one of: email, WhatsApp link, or sign-up form URL → `join.href` (+ a `join.label`)
- **Optional, later:** one landscape photo per sport. Drop it in `src/assets/` and set
  `heroImage` (import it) + `alt` — the branded hero panel is automatically replaced by a
  `<Picture>` hero. Not needed for launch.

Confirm too: netball match day (weekend league?), and whether football/netball share one
club contact or each have their own.
```

- [ ] **Step 5: Commit**

```bash
git add human-todo.md
git commit -m "docs: owner content checklist for football & netball pages"
```

---

## Self-Review (completed)

**Spec coverage:** Positioning (satellite pages, volleyball untouched) ✓ Task 3; two pages from shared template ✓ Tasks 2–3; data model with optional heroImage ✓ Task 1; branded hero panel now / Picture later ✓ Task 2; "Other Sports" dropdown desktop + overlay ✓ Tasks 5–6; footer links, no homepage band ✓ Task 4; sitemap-included, no noindex ✓ Task 3 Step 3; token-only / no inline styles / accent-text rule ✓ all CSS in Tasks 2,5,6; light+dark verified ✓ Tasks 3,5,6,7; owner content ✓ Task 7.

**Placeholder scan:** No TBD/TODO/"handle edge cases" left. Placeholder *copy* in `sports.ts` is intentional and tracked in Task 7 — it is real, valid content, not a plan placeholder.

**Type consistency:** `OtherSport` fields defined in Task 1 (`slug`, `name`, `eyebrow`, `titleLead`, `titleEm`, `intro`, `team.{name,league}`, `schedule.training.{day,time,venue}`, `schedule.matches?.{day,venue}`, `join.{label,href}`, `heroImage?`, `alt?`) are the exact fields consumed by `SportPage.astro` (Task 2) and the route files (Task 3). `navLinks[].children` (Task 5) is consumed identically by the desktop map (Task 5) and overlay map (Task 6). Class names (`nav__dropdown`, `nav__dropdown--open`, `nav__dropdown-toggle`) match between markup, CSS, and JS.
