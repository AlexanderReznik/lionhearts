# Brand Compliance — Phase 1: Light-Led Foundation (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic dark/blue-gradient theme with the brand's light-led system — Barlow type, Lionhearts navy/white/flat-light-blue palette, official logo + favicon + team wordmarks, and dual-ready theme tokens — producing a shippable, on-brand light site.

**Architecture:** One central token layer in `src/styles/global.css` defines fixed **brand tokens** (`--lh-*`) and a **semantic layer** that flips per `data-theme`. The existing `--color-*` token names are repurposed *as* the semantic layer (re-pointed to brand values), so every component that already uses them re-themes for free; only hardcoded colours and gradients need surgical edits. Both light (`:root`, default) and dark (`[data-theme="dark"]`) token sets are authored now (dual-ready); the toggle ships in Phase 2.

**Tech Stack:** Astro 6 (static), scoped component CSS, CSS custom properties, Fontsource (self-hosted Barlow), Vitest, Chrome DevTools MCP for visual verification.

**Scope note:** This is Phase 1 of three. Phase 2 (dark-theme activation + toggle) and Phase 3 (Vinarius sub-brand, full dual-style section mapping, photography) are separate plans. Photos stay as placeholders here. Full per-section tone *mapping* is Phase 3; Phase 1 only builds the tone *primitives*.

**Conventions (from project memory — honour in every task):**
- No inline `style=` attributes except the documented Phase-2 theme-boot script (not in this phase). Use scoped CSS classes / BEM modifiers.
- All external links keep `rel="noopener noreferrer"`.
- Preserve semantic heading hierarchy (real `<h2>/<h3>`, never styled `<p>`).
- Run git from the project root (no `git -C`).

**Verification model:** This phase is CSS/markup-heavy with little new unit-testable logic, so most tasks verify via `npm run build` (must succeed), `npx astro check` (no new errors), `npm test` (Vitest stays green), and Chrome DevTools screenshots. Genuine logic (the team→wordmark resolver) is built test-first.

**Baseline before starting:** dev server runs with `npm run dev` (http://localhost:4321/). Confirm `npm run build`, `npx astro check`, and `npm test` all pass on the current `brand-compliance-redesign` branch before Task 1 so regressions are attributable.

---

### Task 1: Central brand + semantic token layer (dual-ready)

**Files:**
- Modify: `src/styles/global.css:7-38` (the `:root` design-tokens block)

- [ ] **Step 1: Replace the `:root` tokens block with the brand + semantic layer**

Replace the current block (lines 7–38, from `/* ── Design tokens ── */` through the closing `}` of `:root`) with:

```css
/* ── Design tokens ── */
:root {
  /* Layer 1 — Brand tokens (fixed, never change per theme) */
  --lh-navy:        #11234B;
  --lh-navy-deep:   #05122B;
  --lh-navy-raised: #1b2f5c;
  --lh-white:       #ffffff;
  --lh-blue:        #54A4F7;
  --lh-blue-deep:   #002D72;
  --lh-blue-300:    #8FC5F7;
  --lh-blue-100:    #E0EEFB;
  --lh-red:         #C44128;
  --lh-pink:        #D75EB1;
  --lh-green:       #76CD54;
  --lh-slate:       #374155;
  --lh-slate-400:   #7587AE;
  --lh-slate-200:   #B9C3DD;
  --lh-grey-400:    #9BA0AA;
  --lh-grey-200:    #CDD0D5;

  /* Layer 2 — Semantic tokens (LIGHT theme = default).
     NOTE: the legacy --color-* names ARE the semantic layer; components
     reference these, so re-pointing them re-themes the whole site. */
  --color-bg:           var(--lh-white);
  --color-bg-alt:       var(--lh-blue-100);
  --color-surface:      var(--lh-white);
  --color-surface-2:    #F4F8FD;
  --color-surface-3:    #EAF1FB;
  --color-accent-from:  var(--lh-blue);   /* gradients flatten to one brand blue */
  --color-accent-to:    var(--lh-blue);
  --color-text:         var(--lh-navy);
  --color-text-muted:   #5a6b86;
  --color-text-faint:   var(--lh-slate-400);
  --color-highlight-1:  var(--lh-blue);
  --color-highlight-2:  var(--lh-blue-deep);
  --color-border:       rgba(17, 35, 75, 0.12);
  --color-border-blue:  rgba(84, 164, 247, 0.35);

  /* Button semantics */
  --btn-primary-bg:     var(--lh-navy);
  --btn-primary-text:   var(--lh-white);
  --btn-accent-bg:      var(--lh-blue);
  --btn-accent-text:    var(--lh-navy);

  /* Typography */
  --font-sans:      'Barlow', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --font-condensed: 'Barlow Condensed', 'Barlow', system-ui, sans-serif;

  /* Spacing */
  --space-xs:  0.5rem;
  --space-sm:  1rem;
  --space-md:  2rem;
  --space-lg:  4rem;
  --space-xl:  6rem;

  /* Layout */
  --max-width:  1120px;
  --nav-height: 68px;
  --page-px:    48px;
}

/* Dark theme token set — authored now (dual-ready); activated by the
   Phase 2 toggle via [data-theme="dark"]. Safe to ship inert. */
[data-theme="dark"] {
  --color-bg:           var(--lh-navy);
  --color-bg-alt:       var(--lh-navy-deep);
  --color-surface:      var(--lh-navy-raised);
  --color-surface-2:    #0c1d40;
  --color-surface-3:    var(--lh-navy-deep);
  --color-text:         var(--lh-white);
  --color-text-muted:   var(--lh-slate-200);
  --color-text-faint:   var(--lh-slate-400);
  --color-highlight-1:  var(--lh-blue-300);
  --color-highlight-2:  var(--lh-blue);
  --color-border:       rgba(255, 255, 255, 0.10);
  --color-border-blue:  rgba(84, 164, 247, 0.30);
  --btn-primary-bg:     var(--lh-blue);
  --btn-primary-text:   var(--lh-navy);
}
```

(The `--font-sans` value references Barlow now; Task 2 installs it. Until then the system fallback renders — harmless.)

- [ ] **Step 2: Verify the build still succeeds**

Run: `npm run build`
Expected: build completes with no errors (token rename is backward-compatible — all consumers use `--color-*`).

- [ ] **Step 3: Visually confirm the site is now light**

Reload http://localhost:4321/ in Chrome DevTools MCP and screenshot the homepage.
Expected: page background is white, body text navy. (Components with hardcoded dark backgrounds — nav, footer, hero — are still dark; those are fixed in Tasks 6–8. This is expected mid-refactor.)

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css
git commit -m "feat(brand): add brand + semantic token layer, light default + dark dual-ready"
```

---

### Task 2: Self-host Barlow via Fontsource

**Files:**
- Modify: `package.json` (dependencies — via npm)
- Modify: `src/components/BaseHead.astro:1-3` (frontmatter imports)
- Modify: `src/styles/global.css:42-47` (body font-family already uses `--font-sans`; verify)

- [ ] **Step 1: Install Barlow (OFL, self-hosted)**

Run:
```bash
npm install @fontsource/barlow @fontsource-variable/barlow-condensed
```
Expected: both packages added to `dependencies`.

> If `@fontsource-variable/barlow-condensed` is unavailable, use `@fontsource/barlow-condensed` and import `600.css`/`700.css` instead of the variable CSS in Step 2.

- [ ] **Step 2: Import the needed weights in BaseHead frontmatter**

In `src/components/BaseHead.astro`, change the frontmatter top (lines 1–3) from:

```astro
---
// src/components/BaseHead.astro
import '../styles/global.css';
```

to:

```astro
---
// src/components/BaseHead.astro
import '@fontsource/barlow/300.css';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow/700.css';
import '@fontsource/barlow/800.css';
import '@fontsource-variable/barlow-condensed';
import '../styles/global.css';
```

(Fontsource ships self-hosted woff2 + `@font-face` for family `'Barlow'` / `'Barlow Condensed Variable'`. If you used the non-variable condensed package in Step 1, the family is `'Barlow Condensed'`, which already matches `--font-condensed`. If you used the variable package, also update `--font-condensed` in `global.css` to `'Barlow Condensed Variable', 'Barlow', sans-serif`.)

- [ ] **Step 3: Confirm body already consumes `--font-sans`**

Read `src/styles/global.css` around line 45. The `body { font-family: var(--font-sans); }` rule already exists — no change needed. Headings inherit `--font-sans` via the body.

- [ ] **Step 4: Verify build + render**

Run: `npm run build`
Expected: success, with Barlow woff2 files emitted to the build output.
Reload the homepage in Chrome DevTools MCP and screenshot.
Expected: headings/body now render in Barlow (visibly chunkier, more geometric than the prior system font).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/components/BaseHead.astro src/styles/global.css
git commit -m "feat(brand): self-host Barlow + Barlow Condensed via Fontsource"
```

---

### Task 3: Flatten gradients & retoken global components

**Files:**
- Modify: `src/styles/global.css` (`.gradient-text`, `.gradient-bg`, `.btn--primary`, `.btn--white`, `.btn--outline-white`, `.filter-pill--active`, `.page-hero`)

- [ ] **Step 1: Flatten the gradient utilities**

In `src/styles/global.css`, replace the `.gradient-text` and `.gradient-bg` rules (currently lines ~50–58) with flat brand-blue versions:

```css
/* ── Accent utilities (flat per brand — no gradients) ── */
.gradient-text {
  color: var(--color-accent-to);
}
.gradient-bg {
  background: var(--color-accent-to);
}
```

- [ ] **Step 2: Retoken the buttons**

Replace the `.btn--primary`, `.btn--white`, and `.btn--outline-white` rules (currently lines ~83–93) with:

```css
.btn--primary { background: var(--btn-primary-bg); color: var(--btn-primary-text); }
.btn--primary:hover { opacity: 0.9; }

.btn--accent { background: var(--btn-accent-bg); color: var(--btn-accent-text); }
.btn--accent:hover { opacity: 0.9; }

.btn--white { background: var(--lh-white); color: var(--lh-navy); }
.btn--white:hover { opacity: 0.9; }

.btn--outline-white { background: transparent; color: var(--lh-white); border: 2px solid rgba(255,255,255,0.4); }
.btn--outline-white:hover { border-color: rgba(255,255,255,0.7); }
```

- [ ] **Step 3: Flatten the active filter pill**

Replace the `.filter-pill--active` rule (currently lines ~199–203) with:

```css
.filter-pill--active {
  background: var(--color-accent-to);
  border-color: transparent;
  color: var(--lh-navy);
}
```

- [ ] **Step 4: Retoken the inner-page hero**

In the `.page-hero` rule (currently lines ~125–131), replace the `background` line:

```css
  background: linear-gradient(160deg, var(--color-bg), var(--color-surface-2));
```
with:
```css
  background: var(--color-bg-alt);
```

And in `.page-hero::after` (lines ~132–138), replace its `background` with a brand-blue tint:

```css
  background: radial-gradient(ellipse at 80% 50%, rgba(84,164,247,0.12) 0%, transparent 70%);
```

- [ ] **Step 5: Verify build + render**

Run: `npm run build` → expected success.
Reload `/teams` and `/about` (inner pages use `.page-hero`) in Chrome DevTools MCP; screenshot.
Expected: inner-page hero now light (soft blue tint), navy heading, buttons solid navy (no gradient). The `em` accent in `.page-hero__title` shows flat brand blue.

- [ ] **Step 6: Commit**

```bash
git add src/styles/global.css
git commit -m "feat(brand): flatten gradients, retoken buttons/pills/page-hero to brand"
```

---

### Task 4: Official logo as a theme-aware component

**Files:**
- Create: `src/assets/brand/logo-main.svg` (white wordmark)
- Create: `src/assets/brand/logo-main-base.svg` (navy wordmark)
- Create: `src/components/BrandLogo.astro`
- Modify: `src/components/Nav.astro:19-25` (markup) and `:114-116` (`.nav__crest` CSS)
- Modify: `src/components/Footer.astro:29-35` (markup) and `:125-129` (`.footer__logo` CSS)

- [ ] **Step 1: Copy the official SVGs into the repo**

Run:
```bash
mkdir -p src/assets/brand
cp "Lionhearts_Website_Assets/Logos_SVG/Lionhearts_Logo_Main.svg" src/assets/brand/logo-main.svg
cp "Lionhearts_Website_Assets/Logos_SVG/Lionhearts_Logo_Main_Base.svg" src/assets/brand/logo-main-base.svg
```
Expected: two files created.

- [ ] **Step 2: Create the theme-aware BrandLogo component**

Create `src/components/BrandLogo.astro`. It renders BOTH logo variants and shows the correct one per theme via CSS (so theme switching in Phase 2 needs no JS for the logo, and we never CSS-recolour the artwork — honouring the brand "don'ts").

```astro
---
// src/components/BrandLogo.astro
// Renders the official wordmark. Navy variant on light theme, white on dark.
interface Props {
  class?: string;
  width?: number;
  height?: number;
}
const { class: className, width = 132, height = 48 } = Astro.props;
---
<span class:list={['brand-logo', className]}>
  <img class="brand-logo__img brand-logo__img--light"
       src="/brand/logo-main-base.svg" alt="London Lionhearts Volleyball Club"
       width={width} height={height} />
  <img class="brand-logo__img brand-logo__img--dark"
       src="/brand/logo-main.svg" alt="" aria-hidden="true"
       width={width} height={height} />
</span>

<style>
  .brand-logo { display: inline-flex; line-height: 0; }
  .brand-logo__img { display: block; height: auto; }
  /* Default (light theme): show navy/base, hide white */
  .brand-logo__img--dark { display: none; }
  :global([data-theme="dark"]) .brand-logo__img--light { display: none; }
  :global([data-theme="dark"]) .brand-logo__img--dark { display: block; }
</style>
```

> The SVGs are referenced from `/brand/...`. Make them public assets: also run
> `mkdir -p public/brand && cp src/assets/brand/logo-main.svg src/assets/brand/logo-main-base.svg public/brand/`.
> (Keeping a copy in `src/assets` documents provenance; `public/brand` is what the `<img src>` resolves to.)

- [ ] **Step 3: Copy the SVGs into public/brand**

Run:
```bash
mkdir -p public/brand
cp src/assets/brand/logo-main.svg src/assets/brand/logo-main-base.svg public/brand/
```

- [ ] **Step 4: Use BrandLogo in the Nav**

In `src/components/Nav.astro` frontmatter, add the import after line 2:

```astro
import BrandLogo from './BrandLogo.astro';
```

Replace the logo markup (lines 19–25) with:

```astro
    <a href="/" class="nav__logo" aria-label="London Lionhearts Volleyball Club — home">
      <BrandLogo class="nav__brandlogo" width={150} height={36} />
    </a>
```

In the `<style>` block, replace the `.nav__crest` rule (lines 114–116) with:

```css
  .nav__brandlogo { height: 36px; }
  .nav__brandlogo :global(.brand-logo__img) { height: 36px; width: auto; }
```

Delete the now-unused `.nav__name` rules (lines 118–133) and the `@media (max-width: 380px) { .nav__name { display: none; } }` block (lines 269–271).

- [ ] **Step 5: Use BrandLogo in the Footer**

In `src/components/Footer.astro` frontmatter, add after line 6:

```astro
import BrandLogo from './BrandLogo.astro';
```

Replace the crest markup (lines 29–35) with:

```astro
      <div class="footer__crest">
        <BrandLogo class="footer__brandlogo" width={180} height={66} />
        <p class="footer__tagline">"Together We Roar."</p>
      </div>
```

In the `<style>` block, replace the `.footer__logo` rule (lines 125–129) with:

```css
  .footer__brandlogo { height: 60px; }
  .footer__brandlogo :global(.brand-logo__img) { height: 60px; width: auto; }
```

Delete the now-unused `.footer__crest-text` (lines 131–135) and `.footer__crest strong` (lines 137–142) rules.

- [ ] **Step 6: Verify build + render**

Run: `npm run build` → expected success.
Run: `npx astro check` → expected no new errors.
Reload `/` in Chrome DevTools MCP; screenshot nav + footer.
Expected: official wordmark crest renders (navy variant, since light theme). No broken image.

- [ ] **Step 7: Commit**

```bash
git add src/assets/brand public/brand src/components/BrandLogo.astro src/components/Nav.astro src/components/Footer.astro
git commit -m "feat(brand): use official wordmark via theme-aware BrandLogo in nav + footer"
```

---

### Task 5: Submark favicon

**Files:**
- Create: `public/favicon.svg` (overwrite the emoji placeholder)
- Modify: `src/components/BaseHead.astro:55-56`

- [ ] **Step 1: Replace the favicon with the official submark**

Run:
```bash
cp "Lionhearts_Website_Assets/Logos_SVG/Lionhearts_Logo_Submark.svg" public/favicon-submark-white.svg
cp "Lionhearts_Website_Assets/Logos_SVG/Lionhearts_Logo_Submark_Base.svg" public/favicon.svg
```
Expected: `public/favicon.svg` is now the navy submark (legible on light browser chrome); the white version is kept for dark chrome.

- [ ] **Step 2: Add a dark-chrome favicon hint**

In `src/components/BaseHead.astro`, replace lines 55–56:

```astro
<!-- Favicon placeholder — replace with actual SVG crest -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```
with:
```astro
<!-- Favicon — official Lionhearts submark -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" media="(prefers-color-scheme: light)" />
<link rel="icon" type="image/svg+xml" href="/favicon-submark-white.svg" media="(prefers-color-scheme: dark)" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

- [ ] **Step 3: Verify build**

Run: `npm run build` → expected success.
Reload `/` in Chrome DevTools MCP; confirm the browser tab shows the lion submark (not the emoji).

- [ ] **Step 4: Commit**

```bash
git add public/favicon.svg public/favicon-submark-white.svg src/components/BaseHead.astro
git commit -m "feat(brand): replace emoji favicon with official Lionhearts submark"
```

---

### Task 6: Re-tone the Nav to tokens

**Files:**
- Modify: `src/components/Nav.astro` (`.nav`, `.nav__overlay` hardcoded colours)

- [ ] **Step 1: Tokenize the sticky nav background and border**

In `src/components/Nav.astro` `<style>`, replace the `.nav` rule (lines 84–93) `background` and `border-bottom` lines:

```css
    background: rgba(5, 10, 22, 0.88);
    ...
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
```
with theme-aware values using `color-mix` against the page background:

```css
    background: color-mix(in srgb, var(--color-bg) 88%, transparent);
    ...
    border-bottom: 1px solid var(--color-border);
```

- [ ] **Step 2: Tokenize the mobile overlay background**

Replace `.nav__overlay` `background` (line 190):

```css
    background: rgba(5, 13, 26, 0.97);
```
with:
```css
    background: color-mix(in srgb, var(--color-bg) 97%, transparent);
```

And the `.nav__overlay-link` color (line 234) `rgba(255, 255, 255, 0.75)` → `var(--color-text-muted)`; its `:hover`/`--active` already use `--color-text` / `--color-accent-to`.

- [ ] **Step 3: Verify build + render at desktop and mobile**

Run: `npm run build` → success.
In Chrome DevTools MCP: reload `/`, screenshot the nav. Then resize to 390×800, open the hamburger, screenshot the overlay.
Expected: nav bar reads on a light surface with navy links; overlay is a light scrim with navy links. Active link underlined in brand blue.

- [ ] **Step 4: Commit**

```bash
git add src/components/Nav.astro
git commit -m "feat(brand): re-tone nav + mobile overlay to theme tokens"
```

---

### Task 7: Re-tone the Footer to tokens

**Files:**
- Modify: `src/components/Footer.astro` (`.footer`, `.footer__tagline`, `.footer__address`, social pills, `.footer__col a`, `.footer__bottom`)

- [ ] **Step 1: Tokenize the footer surface**

In `src/components/Footer.astro` `<style>`, replace `.footer` (lines 97–101) `background` and `border-top`:

```css
    background: #020609;
    border-top: 1px solid rgba(0, 80, 220, 0.25);
```
with:
```css
    background: var(--color-bg-alt);
    border-top: 1px solid var(--color-border);
```

- [ ] **Step 2: Tokenize footer text colours**

Apply these replacements in the `<style>` block:
- `.footer__tagline` `color: rgba(255,255,255,0.55);` → `color: var(--color-text-muted);`
- `.footer__address` `color: rgba(255,255,255,0.5);` → `color: var(--color-text-muted);`
- `.footer__address:hover` `color: rgba(255,255,255,0.7);` → `color: var(--color-text);`
- `.footer__col a` `color: rgba(255,255,255,0.65);` → `color: var(--color-text-muted);`
- `.footer__col a:hover` `color: rgba(255,255,255,0.75);` → `color: var(--color-text);`
- `.footer__bottom` `border-top: 1px solid rgba(255,255,255,0.05);` → `border-top: 1px solid var(--color-border);`
- `.footer__bottom p` `color: rgba(255,255,255,0.5);` → `color: var(--color-text-muted);`
- `.footer__col h4` already uses `var(--color-accent-to)` — leave it (now brand blue).

- [ ] **Step 3: Tokenize the social-pill surfaces**

Replace `.footer__social-pill` `background`/`border`/`color` (lines 174–180):

```css
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    ...
    color: rgba(255,255,255,0.6);
```
with:
```css
    background: color-mix(in srgb, var(--color-text) 5%, transparent);
    border: 1px solid var(--color-border);
    ...
    color: var(--color-text-muted);
```
Leave the brand-coloured per-network hover rules (Instagram/Facebook/YouTube) as-is — those are intentional brand colours of the networks.

- [ ] **Step 4: Verify build + render**

Run: `npm run build` → success.
Chrome DevTools MCP: reload `/`, scroll to footer, screenshot.
Expected: footer sits on the soft-blue alt surface, navy text, official wordmark, brand-blue column headings, legible social pills.

- [ ] **Step 5: Commit**

```bash
git add src/components/Footer.astro
git commit -m "feat(brand): re-tone footer to theme tokens"
```

---

### Task 8: Re-tone the Hero overlays to navy

**Files:**
- Modify: `src/components/Hero.astro` (`.hero__overlay`, `.hero__accent`, `.hero__location`)

The hero is a photo with a dark scrim — it is intentionally a dark "feature" surface in both themes. Keep it dark but move the scrim from blue-black to brand navy and the accent to brand blue.

- [ ] **Step 1: Navy-tint the scrim**

In `src/components/Hero.astro` `<style>`, replace `.hero__overlay` `background` (line 134):

```css
    background: linear-gradient(to top, rgba(5,13,26,0.97) 0%, rgba(5,13,26,0.55) 40%, rgba(5,13,26,0.1) 100%);
```
with brand-navy-deep tints:
```css
    background: linear-gradient(to top, rgba(5,18,43,0.97) 0%, rgba(5,18,43,0.55) 40%, rgba(5,18,43,0.10) 100%);
```

- [ ] **Step 2: Brand-blue the accent line**

Replace `.hero__accent` `background` (line 139):

```css
    background: linear-gradient(to bottom, transparent, rgba(0,100,255,0.25), transparent);
```
with:
```css
    background: linear-gradient(to bottom, transparent, rgba(84,164,247,0.3), transparent);
```

- [ ] **Step 3: Tokenize the location chip**

Replace `.hero__location` `background`/`border` (lines 157–158):

```css
    background: rgba(0,80,220,0.1);
    border: 1px solid rgba(0,120,255,0.2);
```
with:
```css
    background: rgba(84,164,247,0.12);
    border: 1px solid rgba(84,164,247,0.3);
```

The headline `.gradient-text` now resolves to flat brand blue (from Task 3) — no change needed. The hero text stays white-on-navy-photo, which is correct (navy feature surface).

- [ ] **Step 4: Verify build + render**

Run: `npm run build` → success.
Chrome DevTools MCP: reload `/`, screenshot the hero.
Expected: hero photo with a navy scrim, white headline, "We Roar." in flat brand blue, brand-blue accent line and location chip.

- [ ] **Step 5: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat(brand): re-tone hero scrim/accent to brand navy + blue"
```

---

### Task 9: Team wordmarks on cards (test-first resolver)

**Files:**
- Create: `src/lib/teamWordmark.ts`
- Create: `tests/lib/teamWordmark.test.ts`
- Create (copy): `public/brand/teams/*.svg`
- Modify: `src/components/TeamCard.astro`

- [ ] **Step 1: Write the failing test for the wordmark resolver**

Create `tests/lib/teamWordmark.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { teamWordmarkSrc } from '../../src/lib/teamWordmark';

describe('teamWordmarkSrc', () => {
  it('maps a team name to its navy (base) wordmark path', () => {
    expect(teamWordmarkSrc('Vinarius')).toBe('/brand/teams/vinarius-base.svg');
  });

  it('maps the white variant when variant="white"', () => {
    expect(teamWordmarkSrc('Roar', 'white')).toBe('/brand/teams/roar.svg');
  });

  it('lowercases multi-style names consistently', () => {
    expect(teamWordmarkSrc('Predators')).toBe('/brand/teams/predators-base.svg');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- teamWordmark`
Expected: FAIL — `Cannot find module '../../src/lib/teamWordmark'`.

- [ ] **Step 3: Implement the resolver**

Create `src/lib/teamWordmark.ts`:

```ts
// Maps a team name to its official wordmark asset under /brand/teams/.
// Base = navy (for light backgrounds); white = for dark backgrounds.
export type WordmarkVariant = 'base' | 'white';

export function teamWordmarkSrc(name: string, variant: WordmarkVariant = 'base'): string {
  const slug = name.trim().toLowerCase();
  return variant === 'white'
    ? `/brand/teams/${slug}.svg`
    : `/brand/teams/${slug}-base.svg`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- teamWordmark`
Expected: PASS (3 tests).

- [ ] **Step 5: Copy the wordmark assets with predictable names**

Run:
```bash
mkdir -p public/brand/teams
for n in Alpha Beats Cats Fury Leo Predators Pride Roar Vinarius; do
  lc=$(echo "$n" | tr '[:upper:]' '[:lower:]')
  cp "Lionhearts_Website_Assets/Logos_SVG/Lionhearts_Team_Wordmark_${n}.svg" "public/brand/teams/${lc}.svg"
  cp "Lionhearts_Website_Assets/Logos_SVG/Lionhearts_Team_Wordmark_${n}_Base.svg" "public/brand/teams/${lc}-base.svg"
done
ls public/brand/teams
```
Expected: 18 files (`alpha.svg`, `alpha-base.svg`, … `vinarius-base.svg`).

- [ ] **Step 6: Render the wordmark in TeamCard**

In `src/components/TeamCard.astro` frontmatter, add the import after line 3:

```astro
import { teamWordmarkSrc } from '../lib/teamWordmark';
```

Replace the `.team-card__info` block (lines 28–33) so the name uses the official wordmark while keeping an accessible `<h2>`:

```astro
  <div class="team-card__info">
    <span class="team-card__gender">{team.gender}</span>
    <h2 class="team-card__name">
      <img class="team-card__wordmark team-card__wordmark--light"
           src={teamWordmarkSrc(team.name, 'base')} alt={team.name} loading="lazy" />
      <img class="team-card__wordmark team-card__wordmark--dark"
           src={teamWordmarkSrc(team.name, 'white')} alt="" aria-hidden="true" loading="lazy" />
    </h2>
    <p class="team-card__division">{team.division}</p>
    {team.badge && <span class="team-card__badge">{team.badge}</span>}
  </div>
```

In the `<style>` block, replace the `.team-card__name` rule (lines 95–101) with wordmark styling, and retoken the featured/badge gradients:

```css
  .team-card__name { margin-bottom: 8px; line-height: 0; }
  .team-card__wordmark { height: 30px; width: auto; display: block; }
  .team-card__wordmark--dark { display: none; }
  :global([data-theme="dark"]) .team-card__wordmark--light { display: none; }
  :global([data-theme="dark"]) .team-card__wordmark--dark { display: block; }
```

Replace `.team-card--featured` background (line 47) and `.team-card__badge` background (line 113):

```css
  .team-card--featured {
    border-color: var(--color-border-blue);
    background: color-mix(in srgb, var(--lh-blue) 6%, transparent);
  }
```
```css
  .team-card__badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: var(--lh-blue);
    color: var(--lh-navy);
    border-radius: 3px;
    padding: 3px 10px;
    font-size: 0.5rem;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
```

Also retoken `.team-card` base background (line 38) `rgba(255,255,255,0.03)` → `var(--color-surface)` and `.team-card:hover` border (line 51) `rgba(0,120,255,0.3)` → `var(--color-border-blue)`.

- [ ] **Step 7: Verify build, check, tests, render**

Run: `npm run build` → success.
Run: `npx astro check` → no new errors.
Run: `npm test` → all pass (including the new resolver tests).
Chrome DevTools MCP: reload `/teams`, screenshot.
Expected: each card shows its official navy team wordmark; featured (Vinarius) card has a subtle blue tint + solid brand-blue "Super League" badge.

- [ ] **Step 8: Commit**

```bash
git add src/lib/teamWordmark.ts tests/lib/teamWordmark.test.ts public/brand/teams src/components/TeamCard.astro
git commit -m "feat(brand): render official team wordmarks on team cards"
```

---

### Task 10: Section-tone primitives

**Files:**
- Create: `src/components/Section.astro`
- Modify: `src/styles/global.css` (append `.section--*` tone classes)

- [ ] **Step 1: Add the section-tone classes to global.css**

Append to `src/styles/global.css`:

```css
/* ── Section tones (brand "moods") ──
   neutral/alt flip with the theme; feature/community are fixed brand
   surfaces in both themes. */
.section { background: var(--color-bg); color: var(--color-text); }
.section--alt { background: var(--color-bg-alt); color: var(--color-text); }
.section--feature {
  background: var(--lh-navy);
  color: var(--lh-white);
  --color-text: var(--lh-white);
  --color-text-muted: var(--lh-slate-200);
}
.section--community {
  background: var(--lh-blue);
  color: var(--lh-white);
  --color-text: var(--lh-white);
  --color-text-muted: rgba(255,255,255,0.85);
}
.section--feature .eyebrow,
.section--feature .eyebrow::before,
.section--community .eyebrow,
.section--community .eyebrow::before { color: var(--lh-white); background-color: currentColor; }
```

(Setting `--color-text`/`--color-text-muted` locally means child components that use those tokens automatically invert on feature/community surfaces.)

- [ ] **Step 2: Create the Section wrapper component**

Create `src/components/Section.astro`:

```astro
---
// src/components/Section.astro
// Brand section wrapper. tone: 'neutral' | 'alt' | 'feature' | 'community'.
interface Props {
  tone?: 'neutral' | 'alt' | 'feature' | 'community';
  class?: string;
}
const { tone = 'neutral', class: className } = Astro.props;
const toneClass = tone === 'neutral' ? 'section' : `section section--${tone}`;
---
<section class:list={[toneClass, className]}>
  <slot />
</section>
```

- [ ] **Step 3: Verify build + a smoke render**

Run: `npm run build` → success.
Run: `npx astro check` → no new errors.

> No page is re-mapped to tones in this phase (that's Phase 3). To smoke-test, temporarily add `<Section tone="community"><p style="padding:2rem">community test</p></Section>` is NOT allowed (no inline styles); instead verify the classes exist by grepping the built CSS:
> Run: `grep -c "section--community" dist/**/*.css` (after build) → expected ≥ 1.

- [ ] **Step 4: Commit**

```bash
git add src/components/Section.astro src/styles/global.css
git commit -m "feat(brand): add section-tone primitives (neutral/alt/feature/community)"
```

---

### Task 11: Graphic-accent component (claw / pride / ball)

**Files:**
- Create (copy): `public/brand/graphics/claw-1.svg`, `pride-1.svg`
- Create: `src/components/GraphicAccent.astro`
- Modify: `src/styles/global.css` (append `.graphic-accent` positioning helpers)

- [ ] **Step 1: Copy the graphic-element SVGs**

Run:
```bash
mkdir -p public/brand/graphics
cp "Lionhearts_Website_Assets/Graphic Elements_SVG/Claw Mark_1.svg" public/brand/graphics/claw-1.svg
cp "Lionhearts_Website_Assets/Graphic Elements_SVG/Pride Circle_1.svg" public/brand/graphics/pride-1.svg
ls public/brand/graphics
```
Expected: `claw-1.svg`, `pride-1.svg`.

- [ ] **Step 2: Create the GraphicAccent component**

Create `src/components/GraphicAccent.astro`:

```astro
---
// src/components/GraphicAccent.astro
// Decorative brand motif (claw stripes / pride circles). Purely decorative.
interface Props {
  motif?: 'claw' | 'pride';
  position?: 'top-right' | 'bottom-right' | 'bottom-left';
  class?: string;
}
const { motif = 'claw', position = 'bottom-right', class: className } = Astro.props;
const src = motif === 'pride' ? '/brand/graphics/pride-1.svg' : '/brand/graphics/claw-1.svg';
---
<img
  class:list={['graphic-accent', `graphic-accent--${position}`, className]}
  src={src} alt="" aria-hidden="true" loading="lazy" />
```

- [ ] **Step 3: Add positioning helpers to global.css**

Append to `src/styles/global.css`:

```css
/* ── Decorative brand motifs ── */
.graphic-accent {
  position: absolute;
  width: 220px;
  max-width: 40%;
  opacity: 0.12;
  pointer-events: none;
  user-select: none;
}
.graphic-accent--top-right    { top: 0; right: 0; }
.graphic-accent--bottom-right { bottom: 0; right: 0; }
.graphic-accent--bottom-left  { bottom: 0; left: 0; }
@media (prefers-reduced-motion: reduce) { .graphic-accent { opacity: 0.1; } }
```

(Consumers place it inside a `position: relative; overflow: hidden;` section. Wider application is Phase 3; this task ships the reusable primitive.)

- [ ] **Step 4: Verify build**

Run: `npm run build` → success.
Run: `npx astro check` → no new errors.

- [ ] **Step 5: Commit**

```bash
git add public/brand/graphics src/components/GraphicAccent.astro src/styles/global.css
git commit -m "feat(brand): add reusable GraphicAccent motif component (claw/pride)"
```

---

### Task 12: Full-site verification pass (light, + dark spot-check)

**Files:** none (verification only)

- [ ] **Step 1: Clean build + checks + tests**

Run:
```bash
npm run build && npx astro check && npm test
```
Expected: build succeeds, astro check reports no errors, Vitest all green.

- [ ] **Step 2: Screenshot every page in the light theme**

In Chrome DevTools MCP, at 1440×900, navigate and full-page screenshot each: `/`, `/about`, `/teams`, `/events`, `/sponsorship`, `/contact`, `/join`, `/sponsors/vinarius`, `/404`.
Expected for each: white/soft-tint backgrounds, navy Barlow text, official wordmark, flat brand-blue accents, solid navy primary buttons, official team wordmarks on `/teams`. No leftover bright-blue gradient and no black `#050d1a`/`#020609` surfaces. (Vinarius page is NOT yet sub-branded — that's Phase 3; it should still be on-theme and legible.)

- [ ] **Step 3: Mobile spot-check**

Resize to 390×800; screenshot `/` and the open nav overlay.
Expected: legible, light, official logo, no overflow.

- [ ] **Step 4: Dark dual-ready spot-check (no toggle yet)**

In Chrome DevTools MCP, run a script to set the attribute, then screenshot `/`:
Run via `evaluate_script`: `document.documentElement.setAttribute('data-theme','dark')`.
Expected: page flips to brand navy `#11234B`, white text, white wordmark variant, white team wordmarks, brand-blue primary buttons — confirming the dual-ready tokens work ahead of the Phase 2 toggle. Reset with `document.documentElement.removeAttribute('data-theme')`.

- [ ] **Step 5: Record results and commit any screenshot artifacts (optional)**

If keeping screenshots, save under `docs/superpowers/` and commit:

```bash
git add -A
git commit -m "test(brand): Phase 1 light-foundation verification screenshots"
```

(If no artifacts to keep, skip — Phase 1 is complete.)

---

## Self-review against the spec

**Spec coverage:**
- Colour system (navy `#11234B`, flat `#54A4F7`, secondary palette, tint ramp, light + dark token sets) → Task 1. ✓
- Light theme default → Task 1 (`:root`). ✓
- Dark theme authored dual-ready → Task 1 (`[data-theme="dark"]`), verified Task 12 Step 4. ✓
- Barlow typography (self-hosted, condensed) → Task 2. ✓
- Remove blue gradient / system font / ad-hoc colours → Tasks 3, 6, 7, 8, 9. ✓
- Official logo (theme-aware, no recolour) → Task 4. Submark favicon → Task 5. ✓
- Section-tone system primitives → Task 10. ✓
- Graphic-element accents (claw/pride/ball) → Task 11. ✓
- Team wordmarks → Task 9. ✓
- Accessibility (rel=noopener preserved, heading hierarchy kept, no inline styles) → honoured across tasks; `<h2>` retained in Task 9 with `alt` text on wordmark. ✓
- Out of scope this phase (per spec): photography (placeholders kept), Vinarius sub-brand (Phase 3), full per-section tone mapping (Phase 3), theme toggle (Phase 2). ✓ — intentionally deferred.

**Placeholder scan:** No "TBD/TODO/handle appropriately" steps; every code step shows complete code and exact commands/expected output. ✓

**Type/name consistency:** `teamWordmarkSrc(name, variant)` and `WordmarkVariant` used identically in test (Task 9 Step 1) and impl (Step 3); paths `/brand/teams/<slug>[-base].svg` match the copy step (Step 5). `BrandLogo`, `Section`, `GraphicAccent` prop names consistent between definition and usage. Legacy `--color-*` token names preserved so existing consumers stay valid. ✓

**Known follow-ups (not gaps — later phases):** Phase 2 plan = `[data-theme]` toggle slider + no-flash boot script + `prefers-color-scheme` default + a11y/contrast audit in both themes. Phase 3 plan = Vinarius sub-brand page, full section-tone mapping (sessions→community, teams/results→feature), photography pass.
