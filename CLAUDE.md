# Lionhearts Volleyball — Claude Code Notes

## Working Directory

All work happens in `/Users/alex/projects/lionhearts`.

## Git Commands

Run git commands from the project root — do NOT use `git -C <path>`. The working directory is already set correctly between shell calls.

```bash
# WRONG
git -C /Users/alex/projects/lionhearts add src/foo.ts

# RIGHT
git add src/foo.ts
git commit -m "feat: ..."
```

## Project Stack

- Astro 6 (static site)
- TypeScript strict
- Vitest for unit tests
- `@astrojs/sitemap` integration
- No framework (vanilla Astro components)

## Design System

All CSS tokens live in `src/styles/global.css`. Aligned to the Lionhearts brand book (Conway, 2026).

**Palette** — primary is Navy `#11234B` + White; accent is Lightblue `#54A4F7`. Secondary (accents only): Red `#C44128`, Pink `#D75EB1`, Green `#76CD54`, Black `#05122B`.
**Type** — Barlow (headlines/body) + Barlow Condensed (eyebrows, labels, buttons, pills). Loaded in `BaseHead.astro`.

### "One site" cohesion model — READ BEFORE TOUCHING ANY PAGE

The site mixes two visual styles but must always read as **one website**. Cohesion comes from a shared kit + one inverted palette, NOT from every page looking identical.

**1. One palette, inverted.** The two styles are the same two colours with fg/bg swapped — never introduce a new structural colour:
- **Style #1 — Strong** (default): navy bg, white text, lightblue accent. → Home hero, About, Teams, Fixtures, Sponsorship.
- **Style #2 — Friendly**: lightblue bg, navy text, white elements. → Join, Open Sessions, Join-success, beginner CTAs. Use the `.section--friendly` helper.
- Navy + lightblue + white stay ~95% of every pixel. A Style #1↔#2 boundary is always a clean hard edge, never a gradient blend.

**2. The spine (identical everywhere, every style):** Nav + Footer frame; the type system; the `.eyebrow` pattern (dash + condensed uppercase label); the giant faint section numerals (`01/02/03`); layout tokens (`--max-width`, `--page-px`, padding rhythm, hairline borders, radius); lightblue focus rings; shared hover/transition timing.

**3. Three decorative motifs, each with ONE fixed meaning** (reusable components, max one motif per section):
- `ClawMarks.astro` → energy / competition / heritage. Strong contexts.
- `PrideCircles.astro` → people / community / inclusion. Friendly contexts. Only place the secondary colours appear.
- `BallMark.astro` → oversized volleyball watermark, low opacity, ties a section back to the sport.

**4. Secondary colours are accents only** — red/pink/green appear only inside Pride Circles or tiny accents (a tag, an icon tile). Never a section background or body text.

**5. Shared section anatomy:** eyebrow → headline → body → (optional numeral) → (optional single motif). Same skeleton in both styles.
