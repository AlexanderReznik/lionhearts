# Tryouts — design

**Date:** 2026-06-20
**Status:** Approved, ready for implementation planning

## Summary

Add one-off pre-season **tryouts** to the site, alongside the existing recurring
Open Sessions and Junior Sessions. A tryout is a dated, single event for a
specific team, with a Google Form sign-up link. Tryouts are managed from a new
tab on the existing Google Sheet and surface in three places:

1. A **Tryouts section** at the top of the `/events` page.
2. A **slim alert bar** on the homepage, below the nav and above the hero.
3. A **rich accent band** on the homepage, between the hero and the sessions strip.

All three are **self-hiding**: they render only when there is at least one
upcoming, visible tryout. The rest of the year the feature is invisible.

## Data model

A new tab on the existing Google Sheet (same sheet as sessions/juniors/quotes),
with its own `gid` exposed via a new `GOOGLE_TRYOUTS_GID` environment variable.
The tab is published as CSV the same way the other tabs are.

Columns (header row, lower-cased on parse like the other parsers):

| column    | example                        | notes |
|-----------|--------------------------------|-------|
| `date`    | `13/09/2026`                   | UK day-first (`DD/MM/YYYY`); parsed to a real `Date` for sorting + auto-hide |
| `time`    | `6:00pm–8:00pm`                | free text, displayed as-is (same convention as sessions) |
| `team`    | `Men's NVL`                    | the row's title |
| `venue`   | `Mulberry Academy Shoreditch`  | blank → falls back to `DEFAULT_VENUE` (`src/data/club.ts`) |
| `form`    | `https://forms.gle/…`          | Google Form sign-up URL; opens in a new tab with `rel="noopener noreferrer"` |
| `visible` | `TRUE`                         | Google Sheets checkbox; exported as `TRUE`/`FALSE` |

### Visibility rule

A tryout is shown only if **both**:

- `visible` is truthy (`TRUE`/`true`/`yes`/`1`), AND
- its parsed date is **today or later** (compared against local midnight, so a
  tryout happening *today* still shows).

Eligible tryouts are sorted **soonest-first**.

### No fallback (key difference from sessions)

Sessions and juniors carry a hardcoded fallback CSV so their schedule never
renders empty. **Tryouts deliberately have no fallback.** If the sheet is
unreachable, misconfigured, or has no upcoming visible rows, `getUpcomingTryouts`
returns an empty array and **nothing renders** — no section, no bar, no band. We
must never advertise a tryout that may not be real, and the empty case *is* the
normal off-season state.

### Operational caveat — static-site auto-hide

The site is statically built, so a past tryout only disappears on the next
**rebuild**. In practice it vanishes whenever the sheet is next edited (which
triggers a rebuild via the existing webhook, see `human-todo.md`) or the site is
redeployed. To guarantee same-day expiry with no manual edit, add a daily
scheduled build. This is optional and noted as a follow-up, not part of this
implementation.

## Library changes — `src/lib/sheets.ts`

Add, mirroring the existing session/quote parsers and their test coverage:

```ts
export interface Tryout {
  date: string;      // raw cell, e.g. "13/09/2026"
  dateObj: Date;     // parsed date (local midnight)
  time: string;      // "6:00pm–8:00pm"
  team: string;
  venue: string;     // defaults to DEFAULT_VENUE when blank
  form: string;      // Google Form URL ("" when blank)
  visible: boolean;
}
```

- `parseUKDate(s: string): Date | null` — parse `DD/MM/YYYY` (day-first) to a
  local-midnight `Date`; return `null` on anything unparseable.
- `parseTryoutsCSV(csv: string): Tryout[]` — reuse `splitCSVLine`; drop rows
  whose date won't parse.
- `getUpcomingTryouts(sheetId?, gid?, now = new Date()): Promise<Tryout[]>` —
  returns `[]` when `sheetId`/`gid` unset or on fetch error; otherwise fetches,
  parses, filters (`visible && dateObj >= startOfToday(now)`), and sorts ascending.
  `now` is injectable for tests.
- `formatTryoutDate(d: Date): string` — `"Sat 13 Sep"` for display.

Truthy parsing for `visible`: `['true','yes','1'].includes(value.trim().toLowerCase())`.

## `/events` — Tryouts section (style B)

A new section rendered **at the top of `.page-content`, above Open Sessions**,
with an `id="tryouts"` anchor (the homepage links target it). Conditional:
renders only when `getUpcomingTryouts(...)` is non-empty.

Layout — wide announcement rows (one per tryout):

- **Date-box** (left): bold day number + abbreviated month on a navy block.
- **Meta** (centre): team name (title) + a line of `weekday · time · 📍 venue`.
- **Sign up →** button (right): the brand-blue `.btn--accent`-style action linking
  to the tryout's `form` URL (new tab, `rel="noopener noreferrer"`).

Section header matches the existing `.section-head` pattern (e.g. heading
"Pre-season <em>Tryouts</em>", short sub-line). Followed by the existing
`.section-divider` before Open Sessions.

Responsive: on narrow widths the row keeps the date-box + meta side by side and
the Sign-up button drops to a full-width row beneath, with comfortable tap
targets.

Extracted into a dedicated `TryoutsSection.astro` component (rather than inlined)
so `events.astro` — already large — does not grow further.

## Homepage — two touchpoints

`index.astro` calls `getUpcomingTryouts(...)` **once** and passes the resulting
array to both components, so the sheet is fetched a single time. Both are
homepage-only and render nothing when the array is empty.

### Slim alert bar — `TryoutsAlertBar.astro`

Placed as the **first element in the homepage content, below the global nav and
above the hero**. A thin navy strip: a pulsing accent dot, a one-line teaser
(e.g. "**Tryouts now open** — see dates & sign up"), and a "Sign up →" link to
`/events#tryouts`. Copy is generic (no hardcoded season) so it needs no extra
data. Mobile: text wraps and the link centers beneath it; full-width, no overflow.

### Rich band — `TryoutsBand.astro`

Placed **between `<Hero />` and `<SessionsStrip />`**. A blue-tinted band with:

- a small "Pre-season tryouts" pill,
- a headline,
- the **soonest** tryout summarised: `team — <formatTryoutDate> · venue`,
- a button "See all dates & sign up →" linking to `/events#tryouts`.

Mobile: the button drops below the text (flex-wrap); spacing scales down.

## Components & files touched

| file | change |
|------|--------|
| `src/lib/sheets.ts` | add `Tryout`, `parseUKDate`, `parseTryoutsCSV`, `getUpcomingTryouts`, `formatTryoutDate` |
| `tests/sheets.test.ts` | extend with unit tests for the new parsers/filters/formatter |
| `src/env.d.ts` | add `GOOGLE_TRYOUTS_GID?: string` |
| `src/components/TryoutsSection.astro` | **new** — events-page section (style B rows) |
| `src/components/TryoutsBand.astro` | **new** — homepage rich band |
| `src/components/TryoutsAlertBar.astro` | **new** — homepage slim bar |
| `src/pages/events.astro` | import + render `TryoutsSection` at top of content; add `id="tryouts"` |
| `src/pages/index.astro` | fetch once; render `TryoutsAlertBar` (above hero) + `TryoutsBand` (after hero) |

## Styling notes

- Reference only semantic `--color-*` tokens; accent **text** uses
  `--color-accent-text`, accent **backgrounds** (button, band tint, bar dot) use
  `--lh-blue`/`#54a4f7` — per the WCAG-AA rules in `CLAUDE.md`.
- No inline styles — scoped BEM classes (per project feedback memory).
- The date-box and Sign-up button must keep AA contrast in both light and dark
  themes; mirror any dark override in the no-JS `prefers-color-scheme: dark`
  block where applicable.

## Out of scope

- Scheduled daily rebuild for same-day expiry (optional follow-up, noted above).
- Site-wide alert bar (tryouts promotion is homepage-only by request).
- Editing the Google Form itself (created separately by the club).
- Per-tryout capacity / spots-left tracking.

## Testing

- Vitest unit tests for `parseUKDate` (valid, invalid, day-first disambiguation),
  `parseTryoutsCSV` (blank venue default, missing columns, bad dates dropped,
  `visible` truthiness), and `getUpcomingTryouts` (empty on no config/error,
  past-date filtering with injected `now`, sort order).
- Manual responsive check at 320/375/414px (Chrome DevTools emulate) for the
  alert bar, band, and section rows, in both light and dark themes.
