# Title tracking & spacing — design

**Date:** 2026-06-11
**Status:** Approved (values locked)

## Problem

After bumping the base font to 18px, the display titles read as cramped: the
negative tracking (`-0.04em`) pulls the uppercase letters too close, multi-line
titles sit too tight vertically (`line-height: 0.9–1.0`), and the tracking is
expressed in three different units across components (`-0.04em`, `-1.5px`,
`-2px`, `-0.5px`).

## Scope

Two tiers of titles exist:

- **Tier A — readable display headings** (hero + section titles, weight 900,
  uppercase, `clamp(~1.4rem … 6rem)`). **In scope.**
- **Tier B — giant decorative watermark words** (`clamp(8rem … 16rem)`,
  `-0.05em`, single words used as background texture in About / Community /
  ClubBridge). **Out of scope** — the ultra-tight tracking is intentional there.

## Design

Introduce two shared tokens in `src/styles/global.css` `:root` so every Tier-A
title pulls from one source:

```css
--tracking-display: -0.02em;   /* was -0.04em / -1.5px / -2px / -0.5px */
--leading-display:  1.05;      /* was 0.9 – 1.0 */
```

These are brand-agnostic layout tokens, so they live alongside the existing
type tokens (not the themed `--color-*` set) and need no dark-mode mirror.

Each Tier-A title references them:

```css
letter-spacing: var(--tracking-display);
line-height: var(--leading-display);
```

### Effect

- **Tracking:** `-0.04em` → `-0.02em` — still tight/punchy at the new 18px base,
  no longer cramped; the three px outliers fold into the same em value.
- **Leading:** `0.9–1.0` → `1.05` — real vertical breathing room for multi-line
  titles (notably the hero).
- **Consistency:** one token pair, no mixed units.

## Files & selectors touched

| File | Selector | Before (ls / lh) |
|------|----------|------------------|
| `src/styles/global.css` | `:root` | *(add token defs)* |
| `src/styles/global.css` | `.page-hero__title` | `-2px` / `0.95` |
| `src/components/Hero.astro` | `.hero__headline` | `-0.04em` / `0.9` |
| `src/components/JoinCTA.astro` | `.join-cta__headline` | `-0.04em` / `0.95` |
| `src/components/ClubBridge.astro` | `.bridge__label` | `-0.04em` / `0.9` |
| `src/components/AboutIntro.astro` | `.about-intro__headline` | `-0.04em` / `1` |
| `src/components/CommunitySection.astro` | `.community__headline` | `-1.5px` / `1` |
| `src/components/OverheardArchive.astro` | `.overheard__title` | `-0.04em` / `1` |
| `src/components/InstagramFeed.astro` | `.instagram__heading` | `-0.5px` / *(unset)* |

`.instagram__heading` is a short single-line heading with no `line-height` set;
it takes the tracking token only (no leading change), matching its original rule.

## Out of scope

- Tier B watermark words (kept tight at `-0.05em`).
- Eyebrows, buttons, and other positive-tracking uppercase labels.
- Margins/gaps between titles and surrounding content.
