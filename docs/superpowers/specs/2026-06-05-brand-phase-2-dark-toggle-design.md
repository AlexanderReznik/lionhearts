# Brand Phase 2 — Dark-Theme Activation + Light/Dark Toggle (Design Spec)

**Date:** 2026-06-05
**Status:** Approved for planning
**Builds on:** Phase 1 (`docs/superpowers/specs/2026-06-05-brand-compliance-redesign-design.md`), merged to `main`.

## Overview

Phase 1 shipped a light-led site with a **dual-ready** token system — the dark
theme tokens already exist under `[data-theme="dark"]` and were verified working via
a manual attribute flip. Phase 2 makes the dark theme **user-reachable**: a persisted
light/dark **toggle**, a no-flash boot script, a no-JS fallback, and a **full WCAG AA
contrast sweep** of the dark theme. The Vinarius sub-brand page **opts out** of theming
(keeps its own light sub-brand look); full Vinarius polish remains Phase 3.

## Goals

- A **pill-slider** theme toggle in the nav (desktop) and the mobile overlay menu.
- **Persist** the user's choice; **default** to the device preference on first visit
  (`prefers-color-scheme`), falling back to light.
- **No theme flash** on load (attribute set before first paint).
- **No-JS fallback** that still honours the OS preference.
- **WCAG AA** compliance across the dark theme (text contrast).
- Vinarius page renders in its sub-brand light look regardless of theme.

## Non-Goals

- Vinarius burgundy/cream sub-brand styling (Phase 3).
- Full dual-style section mapping / community-surface usage (Phase 3).
- Photography (Phase 3).
- A third "auto/system" toggle state — the toggle is **binary** (light/dark); device
  preference only governs the first visit.

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Toggle control style | **Pill slider** (knob slides L→R; blue knob in dark) |
| Mobile placement | **Inside the overlay menu** (keep the top bar clean) |
| First-load default | **Follow device** (`prefers-color-scheme`), else light |
| Persistence | `localStorage['lh-theme']` = `'light' | 'dark'` |
| Contrast audit | **Full WCAG AA sweep** of the dark theme |
| Vinarius page | **Opt out** — force its own light sub-brand palette |

## Architecture

### 1. Theme resolution & no-flash boot

An inline script at the very top of `<head>` (in `BaseHead.astro`), before the
stylesheet, runs before first paint:

```js
(function () {
  try {
    var stored = localStorage.getItem('lh-theme');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (_) {}
})();
```

- Returning visitor → saved choice. First-time visitor → device preference. Default
  light. The attribute is set pre-paint, so there is **no FOUC**.
- This is the single sanctioned inline script (per project "no inline styles/scripts
  except the documented boot script" rule).

### 2. No-JS fallback (in `global.css`)

Because the boot script sets `data-theme` explicitly when JS runs, the existing
`[data-theme="dark"]` block covers JS users. For **no-JS** users, add a media block so
the OS preference still applies when no explicit theme attribute is present:

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* DUPLICATE of the [data-theme="dark"] token values — keep in sync. */
    --color-bg: var(--lh-navy);
    --color-bg-alt: var(--lh-navy-deep);
    --color-surface: var(--lh-navy-raised);
    --color-surface-2: #0c1d40;
    --color-surface-3: var(--lh-navy-deep);
    --color-text: var(--lh-white);
    --color-text-muted: var(--lh-slate-200);
    --color-text-faint: var(--lh-slate-400);
    --color-highlight-1: var(--lh-blue-300);
    --color-highlight-2: var(--lh-blue);
    --color-border: rgba(255, 255, 255, 0.10);
    --color-border-blue: rgba(84, 164, 247, 0.30);
    --btn-primary-bg: var(--lh-blue);
    --btn-primary-text: var(--lh-navy);
  }
}
```

This is a deliberate duplicate of the `[data-theme="dark"]` values. A comment on both
blocks notes they must stay in sync. (Acceptable: ~14 lines; the alternative
indirection is more confusing than the duplication.)

### 3. ThemeToggle component (`src/components/ThemeToggle.astro`)

A self-contained pill-slider switch:

- `<button class="theme-toggle" role="switch" aria-checked="false" aria-label="Toggle dark mode">`
  containing a sun icon, a moon icon, and a knob element.
- **Visual state is CSS-driven from `html[data-theme]`** — the knob sits left in light,
  right (blue) in dark — so every instance is always in sync with the global theme
  without per-instance JS. `aria-checked` is synced by the script (see §4).
- Knob slide transition wrapped in `@media (prefers-reduced-motion: no-preference)`;
  reduced-motion users get an instant change.
- Visible `:focus-visible` ring; fully keyboard-operable (it's a native button).
- Accepts an optional `class` prop for placement-specific sizing.

### 4. Toggle behaviour (one shared script)

A single small client script (in `Nav.astro`, alongside the existing menu script, or a
tiny imported module):

- `applyTheme(theme)`: set `document.documentElement.setAttribute('data-theme', theme)`,
  write `localStorage['lh-theme']`, and set `aria-checked = (theme === 'dark')` on **all**
  `.theme-toggle` buttons.
- Click handler on every `.theme-toggle`: read current `data-theme`, flip, call
  `applyTheme`.
- On load: sync `aria-checked` on all toggles to the current `data-theme` (the boot
  script already set the attribute).
- Pure resolver extracted for testing: `resolveInitialTheme(stored, prefersDark)`
  (see Testing).

### 5. Vinarius opt-out (`.force-light`)

A reusable utility in `global.css` that re-asserts the **light** semantic token values
on its subtree, overriding an ancestor `html[data-theme="dark"]` for that subtree:

```css
.force-light {
  --color-bg: var(--lh-white);
  --color-bg-alt: var(--lh-blue-100);
  --color-surface: var(--lh-white);
  --color-surface-2: #f4f8fd;
  --color-surface-3: #eaf1fb;
  --color-text: var(--lh-navy);
  --color-text-muted: #5a6b86;
  --color-text-faint: var(--lh-slate-400);
  --color-highlight-1: var(--lh-blue);
  --color-highlight-2: var(--lh-blue-deep);
  --color-border: rgba(17, 35, 75, 0.12);
  --color-border-blue: rgba(84, 164, 247, 0.35);
  --btn-primary-bg: var(--lh-navy);
  --btn-primary-text: var(--lh-white);
  background: var(--color-bg);
  color: var(--color-text);
}
```

The Vinarius page (`src/pages/sponsors/vinarius.astro`) wraps its content in
`.force-light` so the page is always its own light look; the toggle has no visible
effect there. (The page already uses its own `--vin-*` burgundy/cream palette for the
sub-brand elements; `.force-light` neutralises any leaked semantic tokens / body
background.)

### 6. WCAG AA contrast sweep

Browser-driven audit of the **dark** theme:

1. For each page, set `data-theme="dark"`, then run a script that walks every element
   with visible text, reads computed `color` and the effective background (resolving up
   the ancestor chain past transparent backgrounds), and computes the WCAG contrast
   ratio.
2. Flag failures: `< 4.5:1` for normal text, `< 3:1` for large text (≥ 24px, or ≥ 18.66px
   bold).
3. Fix each failure by adjusting the relevant **dark** token (e.g. lighten
   `--color-text-muted` in the dark block) or the element's local colour — never by
   degrading the light theme.
4. Re-run until the dark theme is clean. Keep `--color-accent`/blue text legible on navy
   surfaces.

**Known starting fixes:**
- `JoinCTA.astro`: `background: #fff` → `var(--color-surface)` so the card flips in dark.
- Any other hardcoded light backgrounds outside Vinarius surface in dark mode (audit
  confirms; Phase 1 scan found only JoinCTA + Vinarius).

> Note: community surfaces (white on `--lh-blue` #54a4f7 ≈ 2.9:1) are **not** in scope —
> no page uses `tone="community"` yet (Phase 3). If the audit encounters one, defer.

## Files touched

- `src/components/BaseHead.astro` — inline boot script in `<head>`.
- `src/styles/global.css` — `@media (prefers-color-scheme: dark)` no-JS block;
  `.force-light` utility; dark-token nudges from the audit.
- `src/components/ThemeToggle.astro` — **new** pill-slider switch.
- `src/components/Nav.astro` — toggle in the desktop cluster (before "Join Us") and in
  the overlay menu; shared toggle script + `aria-checked` sync.
- `src/lib/theme.ts` — **new** `resolveInitialTheme()` pure helper (for tests + reuse).
- `src/pages/sponsors/vinarius.astro` — wrap content in `.force-light`.
- `src/components/JoinCTA.astro` — `#fff` → `var(--color-surface)`; other audit fixes.

## Testing

- **Unit (Vitest):** `resolveInitialTheme(stored, prefersDark)` matrix:
  - `('dark', false)` → `'dark'`; `('light', true)` → `'light'` (stored wins).
  - `(null, true)` → `'dark'`; `(null, false)` → `'light'` (device).
  - `(undefined, false)` → `'light'` (default).
- **Manual / visual (Chrome DevTools MCP):**
  - Toggle flips the whole site; persists across reload; both instances stay in sync.
  - First load with no stored pref: dark device → dark, light device → light.
  - No theme flash on load (attribute present pre-paint).
  - Keyboard: toggle reachable, operable with Enter/Space, visible focus ring.
  - Vinarius page stays light in both themes.
- **AA:** the dark-theme contrast sweep returns no failures.

## Accessibility & constraints

- One sanctioned inline script (the boot script); everything else stays in scoped/global
  CSS and external scripts.
- Toggle uses `role="switch"` + `aria-checked` + `aria-label`; visible focus; honours
  `prefers-reduced-motion`.
- External links keep `rel="noopener noreferrer"`; heading hierarchy unchanged.
- AA contrast verified in **both** themes after the sweep.

## Open questions / risks

- **Duplicate dark tokens** (no-JS `@media` block vs `[data-theme="dark"]`): mitigated by
  a sync comment; if it drifts, a build-time check could be added later (out of scope).
- **`localStorage` unavailable** (private mode / blocked): boot script and `applyTheme`
  wrap access in try/catch; toggle still works for the session, just won't persist.
- **Audit scope creep:** the AA sweep only fixes **dark-theme** failures; it must not
  alter the already-shipped light theme.
