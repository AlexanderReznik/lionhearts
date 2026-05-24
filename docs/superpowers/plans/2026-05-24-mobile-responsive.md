# Mobile Responsive Design — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every page of the Lionhearts VBC Astro site fully responsive on mobile (390–768px) without breaking any existing desktop layouts.

**Architecture:** All changes are additive `@media (max-width: …)` overrides appended to existing scoped `<style>` blocks, plus two explicit content cleanups on `join.astro` (remove step numbers and schedule block) that improve both desktop and mobile. No new files or components. No changes to `global.css` tokens.

**Tech Stack:** Astro 6, vanilla CSS (scoped `<style>` blocks), TypeScript `<script>` blocks, no test framework for UI (Vitest covers only `src/lib/sheets.ts`).

---

## File map

| File | Change type |
|---|---|
| `src/components/Nav.astro` | HTML + CSS + `<script>` — hamburger + full-screen overlay |
| `src/components/StatsBar.astro` | CSS — 2+2+1 grid |
| `src/components/Hero.astro` | CSS — stack CTA buttons |
| `src/components/AboutIntro.astro` | CSS — stack flex row |
| `src/components/CommunitySection.astro` | CSS — stack header |
| `src/components/JoinCTA.astro` | CSS — stack + reduce padding |
| `src/components/SponsorsSection.astro` | CSS — stack title card |
| `src/components/InstagramFeed.astro` | CSS — stack header |
| `src/pages/about.astro` | CSS — stack history grid + values |
| `src/pages/events.astro` | CSS — stack fixture header |
| `src/pages/contact.astro` | HTML restructure + CSS — horizontal card layout (all sizes) |
| `src/pages/join.astro` | HTML removal + CSS cleanup — remove step numbers and schedule block |

---

## Task 1: Nav — Hamburger + Full-Screen Overlay

**Files:**
- Modify: `src/components/Nav.astro`

- [ ] **Add hamburger button and overlay to the HTML**

  In `Nav.astro`, make these two edits:

  **1a.** After `<a href="/join" class="btn btn--primary nav__cta">Join Us</a>` inside `<div class="nav__inner">`, add:

  ```astro
  <button
    class="nav__hamburger"
    type="button"
    aria-label="Open menu"
    aria-expanded="false"
    aria-controls="nav-overlay"
  >
    <span aria-hidden="true">☰</span>
  </button>
  ```

  **1b.** After the closing `</nav>` tag (end of the template), add the overlay as a sibling:

  ```astro
  <div
    class="nav__overlay"
    id="nav-overlay"
    role="dialog"
    aria-label="Navigation menu"
    aria-modal="true"
    hidden
  >
    <button class="nav__overlay-close" type="button" aria-label="Close menu">
      <span aria-hidden="true">✕</span>
    </button>
    <ul class="nav__overlay-links" role="list">
      {navLinks.map(link => (
        <li>
          <a
            href={link.href}
            class:list={['nav__overlay-link', { 'nav__overlay-link--active': isActive(link.href) }]}
            aria-current={isActive(link.href) ? 'page' : undefined}
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
    <div class="nav__overlay-footer">
      <a href="/join" class="btn btn--primary nav__overlay-cta">Join the Club</a>
    </div>
  </div>
  ```

- [ ] **Add CSS** — append the following inside the existing `<style>` block, before the closing `</style>`:

  ```css
  /* ── Hamburger (hidden on desktop) ── */
  .nav__hamburger {
    display: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: transparent;
    border: none;
    color: var(--color-text);
    font-size: 1.375rem;
    cursor: pointer;
    flex-shrink: 0;
  }

  .nav__hamburger:focus-visible {
    outline: 2px solid var(--color-accent-to);
    outline-offset: 3px;
    border-radius: 4px;
  }

  /* ── Full-screen overlay ── */
  .nav__overlay {
    position: fixed;
    inset: 0;
    z-index: 99;
    background: rgba(5, 13, 26, 0.97);
    display: flex;
    flex-direction: column;
    padding-top: var(--nav-height);
    overflow-y: auto;
  }

  .nav__overlay[hidden] { display: none; }

  .nav__overlay-close {
    position: absolute;
    top: 0;
    right: 0;
    width: var(--nav-height);
    height: var(--nav-height);
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--color-text);
    font-size: 1.375rem;
    cursor: pointer;
  }

  .nav__overlay-close:focus-visible {
    outline: 2px solid var(--color-accent-to);
    outline-offset: 3px;
  }

  .nav__overlay-links {
    list-style: none;
    padding: 2rem var(--page-px);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    flex: 1;
  }

  .nav__overlay-link {
    font-size: 1.5rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: -0.5px;
    color: rgba(255, 255, 255, 0.75);
    text-decoration: none;
    transition: color 0.15s;
  }

  .nav__overlay-link:hover { color: var(--color-text); }
  .nav__overlay-link--active { color: var(--color-accent-to); }

  .nav__overlay-link:focus-visible {
    outline: 2px solid var(--color-accent-to);
    outline-offset: 3px;
  }

  .nav__overlay-footer {
    padding: 1.5rem var(--page-px);
    border-top: 1px solid var(--color-border);
  }

  .nav__overlay-cta { width: 100%; justify-content: center; }

  /* ── Mobile breakpoint ── */
  @media (max-width: 768px) {
    .nav__links  { display: none; }
    .nav__e2-badge { display: none; }
    .nav__hamburger { display: flex; }
    .nav__cta { margin-left: auto; }
  }
  ```

- [ ] **Add `<script>` block** — append after the `</style>` tag:

  ```astro
  <script>
    const hamburger = document.querySelector<HTMLButtonElement>('.nav__hamburger');
    const overlay   = document.getElementById('nav-overlay') as HTMLElement | null;
    const closeBtn  = overlay?.querySelector<HTMLButtonElement>('.nav__overlay-close');

    function openMenu(): void {
      overlay?.removeAttribute('hidden');
      hamburger?.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      closeBtn?.focus();
    }

    function closeMenu(): void {
      overlay?.setAttribute('hidden', '');
      hamburger?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      hamburger?.focus();
    }

    hamburger?.addEventListener('click', openMenu);
    closeBtn?.addEventListener('click', closeMenu);

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !overlay?.hasAttribute('hidden')) closeMenu();
    });

    overlay?.querySelectorAll<HTMLAnchorElement>('.nav__overlay-link').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Focus trap
    overlay?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(
        overlay.querySelectorAll<HTMLElement>('a[href], button')
      );
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });
  </script>
  ```

- [ ] **Verify build passes**

  ```bash
  npm run build
  ```
  Expected: exits 0, no TypeScript errors, 9 pages generated.

- [ ] **Visual check** — run `npm run dev`, open `http://localhost:4321`, resize browser to 390px width:
  - Desktop (>768px): nav looks exactly as before — logo, 6 links, Join Us button, no hamburger visible
  - Mobile (≤768px): logo + Join Us + ☰ visible; links and E2 badge hidden
  - Tap ☰: full-screen overlay appears, active page highlighted in blue
  - Tap ✕ or Esc: overlay closes, focus returns to hamburger
  - Tap a nav link: navigates and overlay closes

- [ ] **Commit**

  ```bash
  git add src/components/Nav.astro
  git commit -m "feat: add mobile hamburger menu with full-screen overlay"
  ```

---

## Task 2: StatsBar — 2×2 + Full-Width 5th Stat

**Files:**
- Modify: `src/components/StatsBar.astro`

- [ ] **Add media query** — append inside `<style>`, before `</style>`:

  ```css
  @media (max-width: 768px) {
    .stats-bar {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .stats-bar__stat {
      border-right: none;
      border-bottom: none;
    }

    /* Row 1: stats 1 and 2 */
    .stats-bar__stat:nth-child(1),
    .stats-bar__stat:nth-child(2) {
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }

    /* Col 1 items get a right border */
    .stats-bar__stat:nth-child(1),
    .stats-bar__stat:nth-child(3) {
      border-right: 1px solid rgba(255, 255, 255, 0.12);
    }

    /* 5th stat spans both columns */
    .stats-bar__stat:nth-child(5) {
      grid-column: span 2;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
    }
  }
  ```

- [ ] **Verify build and visual check**

  ```bash
  npm run build
  ```
  Then `npm run dev` at 390px — confirm stats show as 2 rows of 2 + 1 full-width row. Desktop at full width unchanged.

- [ ] **Commit**

  ```bash
  git add src/components/StatsBar.astro
  git commit -m "feat: responsive stats bar — 2+2+1 grid on mobile"
  ```

---

## Task 3: Hero — Stack CTA Buttons

**Files:**
- Modify: `src/components/Hero.astro`

- [ ] **Add media query** — append inside `<style>`, before `</style>`:

  ```css
  @media (max-width: 768px) {
    .hero__content {
      padding-bottom: 48px;
    }

    .hero__ctas {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }
  }
  ```

- [ ] **Verify build and visual check**

  ```bash
  npm run build
  ```
  At 390px: "Join the Club" and "Meet Our Teams →" stack vertically. Desktop unchanged.

- [ ] **Commit**

  ```bash
  git add src/components/Hero.astro
  git commit -m "feat: stack hero CTA buttons on mobile"
  ```

---

## Task 4: AboutIntro — Stack Flex Row

**Files:**
- Modify: `src/components/AboutIntro.astro`

- [ ] **Add media query** — append inside `<style>`, before `</style>`:

  ```css
  @media (max-width: 768px) {
    .about-intro {
      padding: var(--space-lg) var(--page-px);
    }

    .about-intro__inner {
      flex-direction: column;
      gap: 32px;
    }

    .about-intro__cards {
      width: 100%;
    }
  }
  ```

- [ ] **Verify build and visual check**

  ```bash
  npm run build
  ```
  At 390px on `/`: text block on top, location card + international card stacked below, full width. Desktop unchanged.

- [ ] **Commit**

  ```bash
  git add src/components/AboutIntro.astro
  git commit -m "feat: stack about intro section on mobile"
  ```

---

## Task 5: CommunitySection — Stack Header

**Files:**
- Modify: `src/components/CommunitySection.astro`

- [ ] **Add media query** — append inside `<style>`, before `</style>`:

  ```css
  @media (max-width: 768px) {
    .community__header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .community__sub {
      text-align: left;
      max-width: 100%;
    }
  }
  ```

- [ ] **Verify build and visual check**

  ```bash
  npm run build
  ```
  At 390px on `/`: headline and sub-copy stack vertically, sub-copy left-aligned. Desktop unchanged.

- [ ] **Commit**

  ```bash
  git add src/components/CommunitySection.astro
  git commit -m "feat: stack community section header on mobile"
  ```

---

## Task 6: JoinCTA — Stack and Reduce Padding

**Files:**
- Modify: `src/components/JoinCTA.astro`

- [ ] **Add media query** — append inside `<style>`, before `</style>`:

  ```css
  @media (max-width: 768px) {
    .join-cta__inner {
      flex-direction: column;
      gap: 24px;
      padding: 36px 24px;
    }

    .join-cta__actions {
      flex-direction: column;
      width: 100%;
    }

    .join-cta__actions .btn {
      width: 100%;
      justify-content: center;
    }
  }
  ```

- [ ] **Verify build and visual check**

  ```bash
  npm run build
  ```
  At 390px on `/`: copy on top, two full-width buttons below. Desktop unchanged.

- [ ] **Commit**

  ```bash
  git add src/components/JoinCTA.astro
  git commit -m "feat: stack join CTA section on mobile"
  ```

---

## Task 7: SponsorsSection — Stack Title Card

**Files:**
- Modify: `src/components/SponsorsSection.astro`

- [ ] **Add media query** — append inside `<style>`, before `</style>`:

  ```css
  @media (max-width: 640px) {
    .sponsors__title-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    .sponsors__meta {
      text-align: left;
    }
  }
  ```

- [ ] **Verify build and visual check**

  ```bash
  npm run build
  ```
  At 390px on `/`: sponsor badge + logo stacked above meta text. Desktop unchanged.

- [ ] **Commit**

  ```bash
  git add src/components/SponsorsSection.astro
  git commit -m "feat: stack sponsors section card on mobile"
  ```

---

## Task 8: InstagramFeed — Stack Header

**Files:**
- Modify: `src/components/InstagramFeed.astro`

- [ ] **Add media query** — append inside `<style>`, before `</style>`:

  ```css
  @media (max-width: 640px) {
    .instagram__header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }
  ```

- [ ] **Verify build and visual check**

  ```bash
  npm run build
  ```
  At 390px on `/`: "Follow @lionhearts_volleyball" heading on top, "View on Instagram →" link below. Desktop unchanged.

- [ ] **Commit**

  ```bash
  git add src/components/InstagramFeed.astro
  git commit -m "feat: stack instagram feed header on mobile"
  ```

---

## Task 9: About Page — Stack History + Values

**Files:**
- Modify: `src/pages/about.astro`

- [ ] **Add media queries** — append inside `<style>`, before `</style>`:

  ```css
  @media (max-width: 768px) {
    .about-history__inner {
      grid-template-columns: 1fr;
      gap: 28px;
    }

    .values-row {
      grid-template-columns: 1fr;
    }
  }
  ```

- [ ] **Verify build and visual check**

  ```bash
  npm run build
  ```
  At 390px on `/about`: team photo placeholder on top, story (chips + headline + text + CTA) below. Three value cards stack vertically. Desktop unchanged.

- [ ] **Commit**

  ```bash
  git add src/pages/about.astro
  git commit -m "feat: responsive about page — stack history and values on mobile"
  ```

---

## Task 10: Events Page — Stack Fixture Header

**Files:**
- Modify: `src/pages/events.astro`

- [ ] **Add media query** — append inside `<style>`, before `</style>`:

  ```css
  @media (max-width: 640px) {
    .team-fixture-section__header {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }

    .team-fixture-section__right {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
  }
  ```

- [ ] **Verify build and visual check**

  ```bash
  npm run build
  ```
  At 390px on `/events`: each team row shows name+badge on top line, division below, Volleyzone link below that. Desktop unchanged.

- [ ] **Commit**

  ```bash
  git add src/pages/events.astro
  git commit -m "feat: stack events fixture header on mobile"
  ```

---

## Task 11: Contact Page — Horizontal Card Layout

**Files:**
- Modify: `src/pages/contact.astro`

This task restructures the card HTML on all screen sizes (desktop and mobile both benefit) and updates the CSS to match.

- [ ] **Restructure card HTML** — replace the `{contactMethods.map(...)}` block (lines 68–81) with:

  ```astro
  {contactMethods.map(c => (
    <div class:list={['contact-card', { 'contact-card--featured': c.featured }]}>
      <div class="contact-card__icon" aria-hidden="true">{c.icon}</div>
      <div class="contact-card__text">
        <span class="contact-card__tag">{c.tag}</span>
        <h3 class="contact-card__title">{c.title}</h3>
        <a
          href={c.link.href}
          class="contact-card__link"
          {...(c.link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >{c.link.label}</a>
      </div>
    </div>
  ))}
  ```

  Note: `contact-card__body` (`<p>`) is intentionally removed — tag + title + link is sufficient on a compact card.

- [ ] **Update card CSS** — in the `<style>` block, replace the `.contact-card` rule and add `.contact-card__text`:

  Replace this existing rule:
  ```css
  .contact-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--color-border);
    border-radius: 14px;
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: border-color 0.2s;
  }
  ```

  With:
  ```css
  .contact-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--color-border);
    border-radius: 14px;
    padding: 20px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: border-color 0.2s;
  }

  .contact-card__icon {
    flex-shrink: 0;
  }

  .contact-card__text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  ```

  Note: `.contact-card__icon` already has `width: 48px; height: 48px` in the existing CSS — adding `flex-shrink: 0` prevents it from being squished at narrow widths. The existing rule stays; only `flex-shrink: 0` is added to it.

  Also remove the now-unused `.contact-card__body` rule from `<style>`:
  ```css
  /* DELETE this rule: */
  .contact-card__body {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    line-height: 1.6;
    flex: 1;
  }
  ```

- [ ] **Verify build and visual check**

  ```bash
  npm run build
  ```
  On `/contact` at all widths: each card shows gradient icon on the left, tag + title + link stacked on the right. No body paragraph. Desktop and mobile both clean.

- [ ] **Commit**

  ```bash
  git add src/pages/contact.astro
  git commit -m "feat: horizontal icon+text layout for contact cards"
  ```

---

## Task 12: Join Page — Remove Step Numbers and Schedule Block

**Files:**
- Modify: `src/pages/join.astro`

This applies to both desktop and mobile — the design decision was to remove these elements entirely.

- [ ] **Remove the three `.pathway__num` elements from HTML**

  Delete each of these divs (one per pathway card):
  ```html
  <div class="pathway__num">1</div>
  <div class="pathway__num">2</div>
  <div class="pathway__num">3</div>
  ```

- [ ] **Remove the `.pathway__schedule` block from pathway 1**

  Delete this entire block from the first pathway card:
  ```html
  <div class="pathway__schedule">
    <div class="pathway__schedule-row">
      <strong>Mon & Thu · 7–9pm</strong>
      <span>All levels · Mixed</span>
    </div>
    <div class="pathway__schedule-row">
      <strong>Fri · 8–10pm</strong>
      <span>Intermediate / Advanced</span>
    </div>
    <div class="pathway__schedule-venue">
      📍 Mulberry Academy, Shoreditch E2
    </div>
  </div>
  ```

- [ ] **Remove unused CSS rules** from `<style>` — delete these blocks:

  ```css
  /* DELETE: */
  .pathway__num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6875rem;
    font-weight: 700;
    color: rgba(255,255,255,0.6);
    flex-shrink: 0;
  }

  /* DELETE: */
  .pathway--featured .pathway__num {
    background: rgba(255,255,255,0.2);
    border-color: rgba(255,255,255,0.35);
    color: #fff;
  }

  /* DELETE: */
  .pathway__schedule {
    background: rgba(0,0,0,0.15);
    border-radius: 8px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  /* DELETE: */
  .pathway__schedule-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    font-size: 0.6875rem;
  }

  /* DELETE: */
  .pathway__schedule-row strong { color: #fff; }
  .pathway__schedule-row span { color: rgba(255,255,255,0.5); }

  /* DELETE: */
  .pathway__schedule-venue {
    font-size: 0.625rem;
    color: rgba(255,255,255,0.4);
    margin-top: 4px;
  }
  ```

- [ ] **Verify build and visual check**

  ```bash
  npm run build
  ```
  On `/join`: all three pathway cards show icon + title + body + CTA button only. No number circles, no schedule rows. Desktop 3-col and mobile 1-col both clean.

- [ ] **Commit**

  ```bash
  git add src/pages/join.astro
  git commit -m "feat: remove step numbers and schedule block from join pathways"
  ```

---

## Final check

- [ ] **Run full build one last time**

  ```bash
  npm run build && npm run preview
  ```

- [ ] **Check all pages at 390px** — open `http://localhost:4321` in preview mode and verify each route:

  | Route | Key thing to check |
  |---|---|
  | `/` | Hamburger works; stats 2+2+1; about section stacks; community header stacks; join CTA stacks |
  | `/about` | History photo + story stack; 3 value cards in 1 column |
  | `/events` | Fixture header rows stack (name/badge top, division/link below) |
  | `/teams` | 2-col grid (already was responsive) |
  | `/sponsorship` | Sponsor hero column; perks 2-col (already was responsive) |
  | `/join` | 3 pathway cards 1-col; no numbers; no schedule block |
  | `/contact` | Horizontal icon+text cards; location block stacks |

- [ ] **Check all pages at 1280px** — confirm no desktop regressions on any of the above routes.
