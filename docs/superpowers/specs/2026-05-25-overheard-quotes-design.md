# Overheard at Training — Member Quotes Archive

**Status:** approved design
**Author:** Alex + Claude
**Date:** 2026-05-25
**Related:** replaces the single placeholder quote in `src/components/CommunitySection.astro`

---

## Problem

The homepage currently shows one placeholder quote ("I just heard 3 lightning strikes…") with a "replace before launch" note. A single sincere-looking pull quote misses two opportunities:

1. **Personality** — the quote reads as a testimonial. Lionhearts is a chatty, social club; the homepage should feel that way.
2. **Onboarding utility** — short, weird quotes give new joiners a ready-made ice-breaker for their first session ("you're Tope, right? What was the deal with the lightning?").

## Goal

Replace the single quote with a small **"Overheard at Training"** archive — a curated, growable collection of out-of-context member quotes the club can edit through a Google Sheet (mirroring the sessions schedule). One quote visible at a time; visitors flip through with prev/next or auto-rotation; quotes are attributed by name + (optional) team so they double as introduction prompts.

## Non-goals

- Not a dedicated `/quotes` page (yet). Homepage-only for v1.
- No moderation workflow — assumes the club self-moderates the sheet.
- No quote submission form for visitors.
- No randomised initial index per page load (avoids hydration flash; can revisit later).
- No filtering / search / categorisation.

---

## Placement & visual

**Section:** replaces the existing `.community__quote` blockquote inside `CommunitySection.astro`. Same vertical slot on the homepage (between the flag mosaic and the Compete/Connect bridge). The component itself ships as a new `OverheardArchive.astro` to keep CommunitySection focused on the flag mosaic.

**Visual treatment:** as approved in `quote-styles-v4.html` of the brainstorm session:

- Section header with `OVERHEARD AT TRAINING` eyebrow + headline **"Out of context. Mostly on purpose."** + ice-breaker invitation subtitle.
- Card with subtle navy bg + thin accent-blue border + rounded corners (14px) — matches the existing card vocabulary.
- Quote text large (`clamp(1rem, 2.5vw, 1.3rem)`), weight 600, white.
- Attribution row: `<strong>Name</strong> · Team` in small uppercase letter-spaced text.
- Pagination row at the card bottom: `№ NN / NN` counter on the left, prev/next arrow buttons on the right. Thin divider above.
- **No new ghost numeral.** The OverheardArchive component renders inside CommunitySection, which already carries the `02` numeral. The pattern (01 AboutIntro, 02 Community, 03 Bridge) is preserved.

**Copy (final):**

- Eyebrow: `Overheard at Training`
- Headline: `Out of context.` / `Mostly on *purpose*.` (the *purpose* word uses the accent-blue treatment like other gradient-em headlines on the site)
- Subtitle: `A growing collection of things our players have actually said. **Use them as ice-breakers** when you meet someone new at a session — ask whoever said it what on earth was going on.`

---

## Data model

### Sheet schema

New tab named **`Overheard`** on the same Google Sheet that holds the schedule. Row 1 headers (case-insensitive):

| column  | required | notes                                      |
|---------|----------|--------------------------------------------|
| `quote` | yes      | the line itself; no surrounding quote marks needed — the component adds them |
| `name`  | yes      | first name (or however the person wants to be credited) |
| `team`  | no       | e.g. "Men's Pride"; blank → attribution renders as just the name |

- Rows where `quote` is blank are skipped silently (lets the club leave gap rows for organisation).
- Standard CSV escaping: cells containing commas or double quotes are wrapped in `"…"` (existing `splitCSVLine` already handles this — verified by tests).

### TypeScript interface

```ts
export interface Quote {
  quote: string;
  name: string;
  team: string;  // empty string when absent
}
```

### Environment

- Reuses `GOOGLE_SHEET_ID` (already set in `.env.local` and prod).
- New env var `GOOGLE_SHEET_GID_QUOTES` = the numeric gid of the Overheard tab (found in the sheet URL `#gid=...` when that tab is selected).
- If `GOOGLE_SHEET_ID` is unset, or the gid is missing, or the fetch fails → fallback array is used (see below).

### Fallback

A tiny built-in fallback so the section never renders empty in dev or if the sheet breaks. Single quote — the existing lightning one — credited to Tope, Men's Pride. Lives alongside the fallback CSV in `src/lib/sheets.ts`.

---

## Code structure

### `src/lib/sheets.ts` additions

- Generic helper `fetchSheetCSV(sheetId, gid)` extracted from the existing `fetchSessions` so both quotes and sessions share the same fetch logic. `fetchSessions` becomes a thin wrapper that calls `fetchSheetCSV(sheetId, '0')`.
- `parseQuotesCSV(csv): Quote[]` — column-keyed parser matching the existing `parseSessionsCSV` pattern. Skips rows with blank `quote`.
- `getQuotes(sheetId?, gid?): Promise<{ quotes: Quote[]; usingFallback: boolean }>` — same fallback shape as `getSessions`.
- `FALLBACK_QUOTES` constant (one entry).

### `src/components/OverheardArchive.astro` (new)

- Astro frontmatter calls `getQuotes(import.meta.env.GOOGLE_SHEET_ID, import.meta.env.GOOGLE_SHEET_GID_QUOTES)`.
- Renders the section header + the first quote's card.
- All quotes are serialised into a `<script type="application/json" data-overheard-quotes>` block (same pattern as the hero carousel labels).
- Client-side script reads the JSON, indexes the visible elements, and handles prev/next, swipe, auto-rotation, keyboard, and reduced-motion preference.

### `src/components/CommunitySection.astro` change

- Remove the existing `.community__quote` `<blockquote>` and its CSS.
- After the flag mosaic + "every flag added by a club member" divider, render `<OverheardArchive />`.

### File map

| change             | file                                              |
|--------------------|---------------------------------------------------|
| new component      | `src/components/OverheardArchive.astro`           |
| new helpers + types | `src/lib/sheets.ts` (additions, plus refactor)    |
| new tests          | `tests/sheets.test.ts` (additions)                |
| edit               | `src/components/CommunitySection.astro` (remove old quote, mount new component) |
| docs               | `human-todo.md` (new item: how to add a new "Overheard" tab to the sheet) |
| env example        | `.env.example` (add `GOOGLE_SHEET_GID_QUOTES`)    |

---

## Behavior

### Navigation

- **Prev / next** arrow buttons wrap at both ends (modulo length).
- **Counter** updates in lock-step with the visible quote: `№ 03 / 14`.
- **Keyboard:** when focus is anywhere within the section, `ArrowLeft` / `ArrowRight` navigate; matches the hero carousel pattern.
- **Mobile swipe:** `touchstart` / `touchend` with a ~50px horizontal threshold. Ignore short flicks and vertical drags (don't hijack page scrolling).
- **Auto-rotate:** advance every **7 seconds**.
  - Pause on `mouseenter` and `focusin` within the section; resume on `mouseleave` / `focusout`.
  - Pause permanently on `prefers-reduced-motion: reduce`.
  - Pause permanently when only 1 quote is loaded.

### Initial state

- Server renders index 0. JS attaches and starts auto-rotate. No randomised init.

### Animation

- Fade between quotes via opacity transition (~250ms).
- Reduced motion: no transition (instant swap).

---

## Edge cases

| condition                                    | result                                                                         |
|----------------------------------------------|--------------------------------------------------------------------------------|
| 0 quotes (fallback empty + fetch fails)      | section is not rendered at all (Astro conditional)                             |
| 1 quote                                      | render the card; pagination row + counter hidden; no auto-rotate               |
| `team` blank                                 | attribution renders as `<strong>Name</strong>` only                            |
| very long quote (>250 chars)                 | no truncation; `clamp()` font-size + line-height keeps it readable on narrow viewports |
| quote contains double quotes                 | CSV escaping per standard (`"…""…"`) — existing splitCSVLine handles it       |
| quote contains emoji or non-Latin script     | rendered as-is                                                                |
| sheet fetched but Overheard tab missing      | gid invalid → fetch returns a 4xx → fallback used; warning logged              |

---

## Accessibility

- Component wraps in `<section aria-labelledby="overheard-heading">`. Eyebrow becomes a real `<h2 id="overheard-heading">` (visually styled as eyebrow text). This sits as a sibling `<h2>` to CommunitySection's existing heading — both at heading-level 2, since they're peers in the page's information hierarchy.
- Quote text rendered as `<blockquote>`; attribution as `<footer><cite>…</cite></footer>` inside it.
- `aria-live="polite"` on the blockquote so screen readers announce changes after nav or auto-rotate.
- Prev/next buttons: `aria-label="Previous quote"` / `"Next quote"`. Min touch target 44×44px.
- Counter: `aria-label="Quote 3 of 14"`; visually `№ 03 / 14`.
- Auto-rotate respects `prefers-reduced-motion: reduce`.
- Focus-visible outline already inherited from the project's button styles.

---

## Testing

### Unit (`tests/sheets.test.ts`)

- `parseQuotesCSV`:
  - parses required + optional columns
  - skips rows with blank quote
  - blank `team` becomes empty string (not "undefined")
  - handles quoted fields containing commas and double quotes
- `getQuotes`:
  - returns fallback when no sheet ID
  - returns live data when fetch succeeds (mocked)
  - falls back when fetch fails (mocked 500)

Target: 6 new test cases. All passing before merge.

### Manual

- Visual verification at desktop (1440×900) and mobile (375×812):
  - Card padding, button size, counter readability
  - Swipe gesture advances on mobile
  - Auto-rotate pauses on hover (desktop) and focus (keyboard)
- Keyboard-only pass:
  - Tab to section, arrow keys advance
  - Focus visible on prev/next
- Reduced motion: enable in OS, confirm no auto-rotate and no fade transition
- Build with `GOOGLE_SHEET_ID` unset → confirm single fallback quote renders, pagination hidden
- Build with sheet wired → confirm live quotes render, counter accurate

---

## Open questions for the implementer

None — design is concrete.

## Future extensions (not in scope)

- Dedicated `/overheard` page with all quotes scrollable on one page, plus filters by team.
- Random initial index on mount (accepting the hydration flash).
- Anonymous attribution option.
- Quote submission form for members.
- Light moderation queue (sheet with `approved: yes/no` flag).
