# Brand Phase 3-B — Dual-Style Section Mapping (Design Spec)

**Date:** 2026-06-06
**Status:** Approved for planning
**Builds on:** Phases 1, 2, 3-A (merged to `main`). Part of Phase 3 — sub-project **B**
(of A · Vinarius [done], B · section mapping [this], C · photography [later]).

## Overview

The brand book defines two graphic "styles": **Style #1 — navy "feature"** for
competitive content (teams, results, announcements) and **Style #2 — light-blue
`#54a4f7` "community"** for welcoming content (open sessions, beginners, juniors).
Phase 1 built the `.section--*` primitives but they are **applied nowhere**, and the
community light-blue is **unused across the whole site**. This sub-project refines the
two tone primitives so they work in **both** themes and maps them onto the right
sections, giving the site the brand's competitive↔community rhythm.

## Goals

- Refine the `feature` and `community` tone primitives to read correctly in light **and**
  dark themes (feature must not blend into the dark navy page; community stays vivid and
  AA-readable).
- Apply `community` (light-blue) to welcoming/sessions sections and `feature` (navy) to
  competitive sections, per the mapping below.
- Keep every tone defined **once** (in `global.css`) and applied declaratively via a
  class on each component's root — no per-component colour duplication.
- Pass WCAG AA in both themes on all changed pages.

## Non-Goals

- Photography (sub-project C).
- The Vinarius page (its own sub-brand; untouched).
- Re-theming the neutral sections (About, Community, Sponsors, Instagram stay as-is so
  the feature/community sections punctuate rather than overwhelm).

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Community treatment | **A** — vivid `#54a4f7`, **white headings + navy body**, white buttons (AA-safe), both themes |
| Feature in dark | **Deep navy `#05122b` + hairline borders** (separates from the `#11234b` dark page) |
| Feature in light | Navy `#11234b` |
| Applied via | The Phase-1 `.section--feature` / `.section--community` classes on component roots |
| Neutral sections | Unchanged (About, CommunitySection, Sponsors, Instagram) |

## Tone system (refined)

Four tones in `global.css`:

| Tone | Light | Dark | Text |
|---|---|---|---|
| `neutral` (default) | white | navy `#11234b` | theme `--color-text` |
| `alt` | soft tint `#E0EEFB` | deep `#05122b` | theme `--color-text` |
| `feature` | navy `#11234b` | **deep navy `#05122b` + hairline top/bottom borders** | white / light-blue accent |
| `community` | `#54a4f7` | `#54a4f7` | **headings white, body navy, buttons white** |

### `.section--feature` (refined)

```css
.section--feature {
  background: var(--lh-navy);
  color: var(--lh-white);
  --color-text: var(--lh-white);
  --color-text-muted: var(--lh-slate-200);
}
[data-theme="dark"] .section--feature {
  background: var(--lh-navy-deep);
  border-top: 1px solid rgba(255,255,255,0.07);
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
```
(Mirror the dark override in the no-JS `@media (prefers-color-scheme: dark)` block.)

### `.section--community` (refined — Community A)

```css
.section--community {
  background: var(--lh-blue);
  color: var(--lh-navy);
  --color-text: var(--lh-navy);
  --color-text-muted: var(--lh-navy);   /* navy body/eyebrows for AA on #54a4f7 */
}
.section--community :is(h1, h2, h3) { color: var(--lh-white); }  /* white headings */
```
Buttons inside community sections use a white fill / navy text (`.btn--white` or a
community-scoped override). Same in both themes (community is a fixed brand mood).

> AA: navy `#11234b` on `#54a4f7` ≈ 4.5:1 (body passes); white headings are large
> (pass at 3:1). White on `#54a4f7` body text is **not** allowed (≈2.9:1).

## The mapping

**→ community (`.section--community`):**
- `SessionsStrip` (homepage open-sessions strip) — was navy
- `ClubBridge` **CONNECT** column — was navy (COMPETE stays navy feature; the two columns now literally show the two energies)
- `JoinCTA` ("Ready to play?") — was light/neutral
- `/events` open-session cards — were navy
- `/join` "come to an open session" pathway card — was navy

**→ feature (`.section--feature`):**
- `ClubBridge` **COMPETE** column (already navy → formalise as feature)
- `/events` fixtures and `/teams` competitive emphasis — ensure consistent navy feature treatment
- Hero stays as-is (navy photo feature; not a `.section--*` surface)

**→ unchanged (neutral/alt):** `AboutIntro`, `CommunitySection`, `SponsorsSection`,
`InstagramFeed`, and the global `.page-hero`.

## Implementation approach

1. Refine `.section--feature` and `.section--community` in `global.css` as above
   (including the no-JS dark mirror for feature).
2. For each mapped component, add the tone class to its **root** element and replace its
   internal hardcoded colours (e.g. `var(--lh-navy)` backgrounds, explicit white text)
   with the semantic tokens (`--color-text`, `--color-text-muted`, `--color-bg`), so the
   tone class drives them. Buttons in community sections → white fill / navy text.
3. Where a component currently sets its own background (e.g. `SessionsStrip` navy,
   `ClubBridge` columns), remove that background in favour of the tone class.
4. `ClubBridge`: COMPETE column → `feature`, CONNECT column → `community` (two columns,
   two tones).

## Files touched

- `src/styles/global.css` — refine `.section--feature` (+ dark + no-JS mirror) and
  `.section--community`.
- `src/components/SessionsStrip.astro` — community tone; tokens.
- `src/components/ClubBridge.astro` — COMPETE feature / CONNECT community; tokens.
- `src/components/JoinCTA.astro` — community tone; tokens.
- `src/pages/events.astro` — open-session cards → community; fixtures feature-consistent.
- `src/pages/join.astro` — open-session pathway card → community.
- (`/teams` — only if its competitive sections need feature-consistency; otherwise none.)

## Testing

- **Build** passes; `npx astro check` no new errors; `npm test` (56) green.
- **Visual (Chrome DevTools MCP):** homepage, `/events`, `/join` in **both** themes —
  confirm the neutral → feature → community rhythm; dark feature band separates from the
  page; community sections vivid + readable; ClubBridge shows navy COMPETE vs blue CONNECT.
- **AA sweep** (Phase-2 audit; treat gradient/`set:html` surfaces manually) on changed
  pages in light **and** dark → clean. Community: white headings (large, pass) + navy
  body (pass); feature: white/light-blue on navy/deep-navy (pass).
- **No regression:** neutral sections (About/Community/Sponsors/Instagram) unchanged in
  both themes; Vinarius page unaffected.

## Open questions / risks

- **Community button contrast:** white button with navy text on `#54a4f7` — ensure the
  button itself and its label pass AA (white on `#54a4f7` border/edges fine; navy label
  on white fill passes).
- **`set:html` / `is:global` surfaces** (e.g. `events.astro`): apply tone via plain
  selectors, not `:global(...)`, per the documented CLAUDE.md gotcha.
- **`/teams` scope:** keep minimal — only formalise feature treatment if the current
  navy-leaning sections are inconsistent; don't expand scope.
