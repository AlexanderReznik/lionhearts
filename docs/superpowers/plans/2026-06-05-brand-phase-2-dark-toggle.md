# Brand Phase 2 — Dark Theme + Toggle (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the already-built dark theme user-reachable via a persisted pill-slider toggle (nav + mobile overlay), with a no-flash boot script, a no-JS `prefers-color-scheme` fallback, a `.force-light` opt-out for the Vinarius page, and a clean WCAG AA dark theme.

**Architecture:** A pre-paint inline boot script sets `html[data-theme]` from `localStorage` (else device preference, else light). The dark tokens already exist under `[data-theme="dark"]`; a `@media (prefers-color-scheme: dark)` duplicate covers no-JS users. A `ThemeToggle` pill-slider button (whose knob position is pure-CSS-driven from `html[data-theme]`) appears in the nav and overlay; one shared script flips the attribute, persists the choice, and syncs `aria-checked` across instances. Vinarius opts out via a `.force-light` token re-assertion.

**Tech Stack:** Astro 6 (static), CSS custom properties, vanilla TS, Vitest, Chrome DevTools MCP for the visual + AA audit.

**Spec:** `docs/superpowers/specs/2026-06-05-brand-phase-2-dark-toggle-design.md`

**Conventions (honour in every task):**
- One sanctioned inline script (the boot script). Everything else: scoped/global CSS + external/bundled scripts. No inline `style=`.
- External links keep `rel="noopener noreferrer"`; preserve heading hierarchy.
- Run git from project root (no `git -C`). Branch is `brand-phase-2-dark-toggle`.

**Baseline:** On `brand-phase-2-dark-toggle`, confirm `npm run build`, `npx astro check` (2 known pre-existing errors: `Hero.astro` relatedTarget, `contact.astro` BRAND_ICONS — fine), and `npm test` (51 pass) are green before Task 1. Dev server: `npm run dev` → http://localhost:4321/.

**Verification model:** Genuine logic (`resolveInitialTheme`) is built test-first. The toggle, boot, and theming are verified via build + Chrome DevTools MCP (persistence, no-flash, sync, AA contrast).

---

### Task 1: `resolveInitialTheme` pure helper (test-first)

**Files:**
- Create: `src/lib/theme.ts`
- Create: `tests/lib/theme.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/theme.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolveInitialTheme, THEME_KEY } from '../../src/lib/theme';

describe('resolveInitialTheme', () => {
  it('uses the stored value when present (stored wins over device)', () => {
    expect(resolveInitialTheme('dark', false)).toBe('dark');
    expect(resolveInitialTheme('light', true)).toBe('light');
  });

  it('falls back to the device preference when nothing is stored', () => {
    expect(resolveInitialTheme(null, true)).toBe('dark');
    expect(resolveInitialTheme(null, false)).toBe('light');
  });

  it('defaults to light when stored is absent and device is not dark', () => {
    expect(resolveInitialTheme(undefined, false)).toBe('light');
  });

  it('ignores an invalid stored value and uses the device preference', () => {
    expect(resolveInitialTheme('purple', true)).toBe('dark');
  });

  it('exposes the storage key', () => {
    expect(THEME_KEY).toBe('lh-theme');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- theme`
Expected: FAIL — cannot find module `../../src/lib/theme`.

- [ ] **Step 3: Implement the helper**

Create `src/lib/theme.ts`:

```ts
// Theme resolution shared by the boot script (mirrored inline) and the toggle.
export type Theme = 'light' | 'dark';
export const THEME_KEY = 'lh-theme';

/**
 * Resolve the initial theme: a valid stored choice wins; otherwise follow the
 * device preference; otherwise default to light.
 */
export function resolveInitialTheme(
  stored: string | null | undefined,
  prefersDark: boolean,
): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  return prefersDark ? 'dark' : 'light';
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- theme`
Expected: PASS (5 assertions).

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme.ts tests/lib/theme.test.ts
git commit -m "feat(theme): add resolveInitialTheme helper + THEME_KEY (test-first)"
```

---

### Task 2: No-flash boot script

**Files:**
- Modify: `src/components/BaseHead.astro` (add an inline script as the FIRST thing after `<meta charset>` / very early in `<head>` output)

- [ ] **Step 1: Add the pre-paint boot script**

In `src/components/BaseHead.astro`, immediately after the `<meta name="generator" ... />` line (line ~34, before `<title>`), insert:

```astro
<!-- Theme boot: set data-theme before first paint (no FOUC).
     Mirrors resolveInitialTheme() in src/lib/theme.ts — keep in sync. -->
<script is:inline>
  (function () {
    try {
      var stored = localStorage.getItem('lh-theme');
      var theme = (stored === 'light' || stored === 'dark')
        ? stored
        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {}
  })();
</script>
```

(`is:inline` tells Astro to emit it verbatim, un-bundled, so it runs before paint.)

- [ ] **Step 2: Verify build + that the attribute is set pre-paint**

Run: `npm run build` → expected success.
In Chrome DevTools MCP: navigate to http://localhost:4321/, then run via `evaluate_script`:
`() => document.documentElement.getAttribute('data-theme')`
Expected: returns `"light"` (or `"dark"` if the test machine's OS is in dark mode). Not `null`.

- [ ] **Step 3: Commit**

```bash
git add src/components/BaseHead.astro
git commit -m "feat(theme): add no-flash theme boot script in <head>"
```

---

### Task 3: No-JS `prefers-color-scheme` fallback

**Files:**
- Modify: `src/styles/global.css` (add a media block right AFTER the existing `[data-theme="dark"]` block)

- [ ] **Step 1: Add the no-JS dark fallback**

In `src/styles/global.css`, locate the `[data-theme="dark"] { ... }` block (ends around line 88). Immediately after its closing `}`, add:

```css
/* No-JS fallback: honour the OS preference when no explicit theme attribute
   is set. DUPLICATE of the [data-theme="dark"] values above — keep in sync. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
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
}
```

(With JS, the boot script sets `data-theme` explicitly so `[data-theme="dark"]` wins and this block is inert. Without JS, no attribute is set, so a dark-OS user still gets the dark tokens. When the boot script sets `data-theme="light"`, the `:not([data-theme="light"])` guard prevents this from overriding an explicit light choice on a dark-OS machine.)

- [ ] **Step 2: Verify build + the values match the explicit dark block**

Run: `npm run build` → success.
Run: `git diff` and confirm every `--color-*`/`--btn-*` line here is identical to the corresponding line in the `[data-theme="dark"]` block.

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "feat(theme): add no-JS prefers-color-scheme dark fallback"
```

---

### Task 4: ThemeToggle component (pill slider)

**Files:**
- Create: `src/components/ThemeToggle.astro`

- [ ] **Step 1: Create the component**

Create `src/components/ThemeToggle.astro`:

```astro
---
// src/components/ThemeToggle.astro
// Pill-slider theme switch. Visual state is driven purely by html[data-theme],
// so every instance stays in sync. The shared script in Nav wires clicks +
// keeps aria-checked in sync.
interface Props {
  class?: string;
}
const { class: className } = Astro.props;
---
<button
  type="button"
  class:list={['theme-toggle', className]}
  role="switch"
  aria-checked="false"
  aria-label="Toggle dark mode"
>
  <svg class="theme-toggle__icon theme-toggle__icon--sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <circle cx="12" cy="12" r="4" /><path d="M12 3v1M12 20v1M3 12h1M20 12h1M5.5 5.5l.7.7M17.8 17.8l.7.7M18.5 5.5l-.7.7M6.2 17.8l-.7.7" />
  </svg>
  <svg class="theme-toggle__icon theme-toggle__icon--moon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
  <span class="theme-toggle__knob" aria-hidden="true"></span>
</button>

<style>
  .theme-toggle {
    position: relative;
    flex-shrink: 0;
    width: 58px;
    height: 30px;
    padding: 0 7px;
    border-radius: 20px;
    border: 1px solid var(--color-border);
    background: var(--color-bg-alt);
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
  }
  .theme-toggle:focus-visible {
    outline: 2px solid var(--color-accent-to);
    outline-offset: 3px;
  }
  .theme-toggle__icon {
    width: 13px;
    height: 13px;
    z-index: 1;
    color: var(--color-text-muted);
  }
  .theme-toggle__knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--lh-navy);
    z-index: 2;
    transition: left 0.2s ease, background 0.2s ease;
  }
  :global(html[data-theme="dark"]) .theme-toggle__knob {
    left: 33px;
    background: var(--lh-blue);
  }
  @media (prefers-reduced-motion: reduce) {
    .theme-toggle__knob { transition: none; }
  }
</style>
```

- [ ] **Step 2: Verify build + astro check**

Run: `npm run build` → success.
Run: `npx astro check` → no NEW errors (only the 2 pre-existing).

- [ ] **Step 3: Commit**

```bash
git add src/components/ThemeToggle.astro
git commit -m "feat(theme): add ThemeToggle pill-slider component"
```

---

### Task 5: Wire the toggle into the Nav + behaviour script

**Files:**
- Modify: `src/components/Nav.astro` (import + two placements + `<script>`)

- [ ] **Step 1: Import the component**

In `src/components/Nav.astro` frontmatter, after the existing `import BrandLogo from './BrandLogo.astro';` line, add:

```astro
import ThemeToggle from './ThemeToggle.astro';
```

- [ ] **Step 2: Add the desktop toggle (before "Join Us")**

In the markup, the CTA is currently:

```astro
    <a href="/join" class="btn btn--primary nav__cta">Join Us</a>
```

Insert the toggle immediately BEFORE that line:

```astro
    <ThemeToggle class="nav__theme-toggle" />
    <a href="/join" class="btn btn--primary nav__cta">Join Us</a>
```

- [ ] **Step 3: Add the mobile toggle (in the overlay footer)**

The overlay footer is currently:

```astro
  <div class="nav__overlay-footer">
    <a href="/join" class="btn btn--primary nav__overlay-cta">Join the Club</a>
  </div>
```

Replace it with (adds a labelled toggle row above the CTA):

```astro
  <div class="nav__overlay-footer">
    <div class="nav__overlay-theme">
      <span>Appearance</span>
      <ThemeToggle class="nav__overlay-toggle" />
    </div>
    <a href="/join" class="btn btn--primary nav__overlay-cta">Join the Club</a>
  </div>
```

- [ ] **Step 4: Add placement CSS**

In the Nav `<style>` block, append:

```css
  .nav__theme-toggle { margin-left: 0; }

  .nav__overlay-theme {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  .nav__overlay-theme span {
    font-size: 0.625rem;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  /* Hide the desktop toggle on mobile (it lives in the overlay there) */
  @media (max-width: 768px) {
    .nav__theme-toggle { display: none; }
  }
```

- [ ] **Step 5: Add the toggle behaviour script**

In `src/components/Nav.astro`, at the END of the existing `<script>` block (after the focus-trap code, before `</script>`), append:

```ts
  // ── Theme toggle ──────────────────────────────────────────────
  const THEME_KEY = 'lh-theme';

  function currentTheme(): 'light' | 'dark' {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function syncToggles(theme: 'light' | 'dark'): void {
    document.querySelectorAll<HTMLButtonElement>('.theme-toggle').forEach(btn => {
      btn.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
    });
  }

  function applyTheme(theme: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    syncToggles(theme);
  }

  // Sync aria-checked to whatever the boot script already set.
  syncToggles(currentTheme());

  document.querySelectorAll<HTMLButtonElement>('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  });
```

(`THEME_KEY` is duplicated as a string literal here because Astro's bundled `<script>` cannot import the `.ts` module value at this point without restructuring; it must match `THEME_KEY` in `src/lib/theme.ts`. The Task 1 test pins that value to `'lh-theme'`.)

- [ ] **Step 6: Verify build + interactive behaviour**

Run: `npm run build` → success. Run: `npx astro check` → no new errors.
In Chrome DevTools MCP at 1440×900, navigate to `/`:
1. Screenshot — confirm the pill toggle appears before "Join Us" (knob left, light).
2. Click the toggle (use `click` on the `.theme-toggle` uid from a snapshot) → page flips to dark; knob slides right/blue.
3. Run `() => localStorage.getItem('lh-theme')` → `"dark"`.
4. Reload → page stays dark (persisted), knob right, `aria-checked="true"`.
5. Toggle back to light; reload → stays light.
6. Resize to 390×800, open the hamburger overlay, screenshot → "Appearance" row + toggle visible; desktop toggle hidden.

- [ ] **Step 7: Commit**

```bash
git add src/components/Nav.astro
git commit -m "feat(theme): add theme toggle to nav + overlay with persistence + aria sync"
```

---

### Task 6: `.force-light` utility, Vinarius opt-out, JoinCTA fix

**Files:**
- Modify: `src/styles/global.css` (append `.force-light`)
- Modify: `src/pages/sponsors/vinarius.astro` (wrap content)
- Modify: `src/components/JoinCTA.astro` (`#fff` → token)

- [ ] **Step 1: Add the `.force-light` utility**

Append to `src/styles/global.css`:

```css
/* ── Force-light subtree ──
   Re-asserts the light semantic tokens, overriding an ancestor
   html[data-theme="dark"]. Used by the Vinarius sub-brand page. */
.force-light {
  --color-bg:           var(--lh-white);
  --color-bg-alt:       var(--lh-blue-100);
  --color-surface:      var(--lh-white);
  --color-surface-2:    #f4f8fd;
  --color-surface-3:    #eaf1fb;
  --color-text:         var(--lh-navy);
  --color-text-muted:   #5a6b86;
  --color-text-faint:   var(--lh-slate-400);
  --color-highlight-1:  var(--lh-blue);
  --color-highlight-2:  var(--lh-blue-deep);
  --color-border:       rgba(17, 35, 75, 0.12);
  --color-border-blue:  rgba(84, 164, 247, 0.35);
  --btn-primary-bg:     var(--lh-navy);
  --btn-primary-text:   var(--lh-white);
  background: var(--color-bg);
  color: var(--color-text);
}
```

(These values are identical to the `:root` light semantic tokens.)

- [ ] **Step 2: Wrap the Vinarius page content in `.force-light`**

In `src/pages/sponsors/vinarius.astro`, the markup currently looks like:

```astro
<BaseLayout
  title="Vinarius London · London Lionhearts VBC"
  description="..."
>

  <!-- ── HERO ── -->
  <section class="vin-hero">
  ...
</BaseLayout>
```

Wrap ALL the content between the opening `<BaseLayout ...>` tag and the closing `</BaseLayout>` in a single `<div class="force-light">`:

```astro
<BaseLayout
  title="Vinarius London · London Lionhearts VBC"
  description="..."
>
  <div class="force-light">

    <!-- ── HERO ── -->
    <section class="vin-hero">
    ...   (all existing sections unchanged)
  </div>
</BaseLayout>
```

(Indentation of inner content may stay as-is; only the wrapping `<div class="force-light">` … `</div>` is added. The global nav/footer remain theme-following; only the Vinarius page body is forced light.)

- [ ] **Step 3: Fix the JoinCTA card so it flips in dark**

In `src/components/JoinCTA.astro` `<style>`, the `.join-cta__inner` rule has `background: #fff;` (line ~31). Change it to:

```css
    background: var(--color-surface);
```

- [ ] **Step 4: Verify build + visual (both themes)**

Run: `npm run build` → success.
In Chrome DevTools MCP:
1. `/` in light → JoinCTA "Ready to play?" card is white (unchanged look).
2. Set `() => document.documentElement.setAttribute('data-theme','dark')`, reload-free re-screenshot `/` → JoinCTA card now navy (`--color-surface` = raised navy), text legible.
3. Navigate to `/sponsors/vinarius` with `data-theme="dark"` still toggled (set it again after nav) → the Vinarius page body renders in its LIGHT sub-brand look (white/cream), not dark.
4. Reset: `() => document.documentElement.setAttribute('data-theme','light')`.

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css src/pages/sponsors/vinarius.astro src/components/JoinCTA.astro
git commit -m "feat(theme): .force-light Vinarius opt-out + JoinCTA dark-mode fix"
```

---

### Task 7: WCAG AA dark-theme contrast sweep

**Files:**
- Modify: `src/styles/global.css` (dark-token nudges, only if the audit finds failures) and/or specific component styles as needed.

This task is audit-driven: measure, fix, re-measure. Fixes adjust the **dark** theme only — never the light theme.

- [ ] **Step 1: Run the contrast audit on every page in dark**

In Chrome DevTools MCP, for EACH page (`/`, `/about`, `/teams`, `/events`, `/join`, `/sponsorship`, `/contact`, `/404`, `/join-success`): navigate, force dark with `() => document.documentElement.setAttribute('data-theme','dark')`, then run this audit via `evaluate_script` (it returns failing elements):

```js
() => {
  function lum(c){const[r,g,b]=c.map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return 0.2126*r+0.7152*g+0.0722*b;}
  function parse(s){const m=s.match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(',').map(x=>parseFloat(x));return p.length>=3?[p[0],p[1],p[2],p[3]??1]:null;}
  function bgOf(el){let n=el;while(n){const b=getComputedStyle(n).backgroundColor;const p=parse(b);if(p&&p[3]>0)return [p[0],p[1],p[2]];n=n.parentElement;}return [255,255,255];}
  const fails=[];
  document.querySelectorAll('body *').forEach(el=>{
    const t=el.textContent?.trim();if(!t||el.children.length>0&&!Array.from(el.childNodes).some(n=>n.nodeType===3&&n.textContent.trim()))return;
    const cs=getComputedStyle(el);const fg=parse(cs.color);if(!fg)return;
    const bg=bgOf(el);
    const L1=lum([fg[0],fg[1],fg[2]])+0.05, L2=lum(bg)+0.05;
    const ratio=L1>L2?L1/L2:L2/L1;
    const size=parseFloat(cs.fontSize), bold=parseInt(cs.fontWeight)>=700;
    const large=size>=24||(bold&&size>=18.66);
    const min=large?3:4.5;
    if(ratio<min){fails.push({tag:el.className||el.tagName,text:t.slice(0,30),ratio:+ratio.toFixed(2),min,size:+size.toFixed(0),fg:cs.color,bg:`rgb(${bgOf(el).join(',')})`});}
  });
  // de-dupe by class+ratio
  const seen=new Set(),out=[];for(const f of fails){const k=f.tag+f.ratio;if(!seen.has(k)){seen.add(k);out.push(f);}}
  return out.slice(0,40);
}
```

Record the failing `{tag, text, ratio, min, fg, bg}` rows for each page.

- [ ] **Step 2: Triage the failures**

For each unique failure, classify:
- **Muted/faint text too dark on a dark surface** → lighten the dark token (e.g. `--color-text-muted` / `--color-text-faint`) in the `[data-theme="dark"]` block (and mirror in the no-JS `@media` block).
- **Blue accent text too dark on navy** → use `--color-highlight-1` (`--lh-blue-300`) instead of a deep blue in that spot.
- **A hardcoded light surface still showing in dark** → point it at a token.
- **`tone="community"` surfaces** → out of scope (none exist yet); skip if encountered.

- [ ] **Step 3: Apply fixes**

Make the minimal token/colour changes. Example pattern (only if the audit shows muted text failing — adjust the actual failing token/value to what the audit indicates):

```css
/* in BOTH the [data-theme="dark"] block AND the @media (prefers-color-scheme: dark)
   :root:not([data-theme="light"]) block — keep them identical */
  --color-text-muted: #c3cfe2;  /* lighter than --lh-slate-200 if 0.55-weight muted text failed */
```

Only change values the audit flagged. Keep both dark blocks in sync.

- [ ] **Step 4: Re-run the audit until clean**

Repeat Step 1 on the affected pages after each fix. Expected end state: the audit returns `[]` (empty) for every page in dark (excluding any deferred `tone="community"` cases, of which there should be none in Phase 2).

- [ ] **Step 5: Confirm the light theme is unchanged**

Set `data-theme="light"`, re-screenshot `/`, `/events`, `/join` → identical to pre-Task-7 light appearance (the fixes must not touch light).

- [ ] **Step 6: Commit**

```bash
git add src/styles/global.css src/components
git commit -m "fix(theme): WCAG AA contrast fixes for the dark theme"
```

(If the audit finds NO failures, commit a note instead: `git commit --allow-empty -m "test(theme): dark theme passes WCAG AA sweep, no fixes needed"`.)

---

### Task 8: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Build, check, tests**

Run:
```bash
npm run build && npx astro check && npm test
```
Expected: build succeeds; astro check shows only the 2 pre-existing errors; Vitest all green (56 = 51 prior + 5 theme).

- [ ] **Step 2: Toggle behaviour matrix (Chrome DevTools MCP)**

On `/`:
- Toggle flips entire site light↔dark; both nav + overlay instances stay in sync (knob + `aria-checked`).
- Choice persists across reload (`localStorage['lh-theme']`).
- Clear storage (`() => localStorage.removeItem('lh-theme')`) + reload → theme follows the OS preference (the boot script). 
- No theme flash on reload (the page paints in the final theme).
- Keyboard: Tab to the toggle, press Enter/Space → flips; visible focus ring.

- [ ] **Step 3: Per-page dark screenshots**

At 1440×900 with `data-theme="dark"`, screenshot `/`, `/about`, `/teams`, `/events`, `/join`, `/sponsorship`, `/contact` → all legible, on-brand navy, no white-on-navy or navy-on-navy text. Vinarius page (`/sponsors/vinarius`) stays light in dark mode.

- [ ] **Step 4: Reduced-motion check**

In DevTools emulate `prefers-reduced-motion: reduce`, toggle → knob changes instantly (no slide). 

- [ ] **Step 5: Done**

Phase 2 complete. (Optionally commit any kept screenshots under `docs/superpowers/`.)

---

## Self-review against the spec

**Spec coverage:**
- Pill-slider toggle, nav + overlay → Task 4 + Task 5. ✓
- No-flash boot script (follow-device default, persistence) → Task 2 (boot) + Task 5 (persistence/sync) + Task 1 (resolver/tested rule). ✓
- No-JS `prefers-color-scheme` fallback → Task 3. ✓
- `.force-light` Vinarius opt-out → Task 6. ✓
- JoinCTA dark fix → Task 6. ✓
- Full WCAG AA dark sweep → Task 7. ✓
- `resolveInitialTheme` unit tests → Task 1. ✓
- Reduced-motion, focus, aria-checked, role=switch → Task 4 (markup/CSS) + Task 5 (aria sync) + Task 8 (verification). ✓
- Out of scope (Vinarius sub-brand palette, community surfaces, photos) → not included. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code and exact commands. Task 7 is audit-driven but provides the exact audit script and concrete remediation patterns; its only conditional values are the specific tokens the audit flags (unavoidable for an audit task) with an explicit example and the empty-result fallback commit. ✓

**Type/name consistency:** `THEME_KEY` = `'lh-theme'` is pinned by the Task 1 test and reused (as a matching literal) in Task 2 boot, Task 5 script, and the `.theme-toggle` class is consistent across Task 4 (definition), Task 5 (script selector + placement classes), and Task 7/8 (audit/verify). `resolveInitialTheme(stored, prefersDark)` signature matches the test. The dark token values in Task 3's `@media` block are specified to match the existing `[data-theme="dark"]` block, and Task 7 instructs editing both in sync. ✓
