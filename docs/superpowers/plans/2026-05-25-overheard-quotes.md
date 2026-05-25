# Overheard at Training — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single placeholder quote in `CommunitySection` with a sheet-driven "Overheard at Training" archive: one quote visible at a time, navigable with prev/next + keyboard + swipe + slow auto-rotate.

**Architecture:** A new Astro component `OverheardArchive.astro` mounted inside `CommunitySection`. Quotes are fetched at build time from a second tab of the existing Google Sheet (the same sheet used for sessions) via a generic `fetchSheetCSV(sheetId, gid)` helper extracted from the existing `fetchSessions`. A small client-side script handles navigation, swipe, and auto-rotate. Fallback: a single hardcoded quote so the section never renders empty.

**Tech Stack:** Astro 6, TypeScript strict, Vitest, vanilla CSS (no framework). All Google Sheets I/O lives in `src/lib/sheets.ts`.

---

## File Map

| change          | path                                                              | responsibility                                                                |
|-----------------|-------------------------------------------------------------------|-------------------------------------------------------------------------------|
| modify          | `src/lib/sheets.ts`                                               | extract `fetchSheetCSV`; add `Quote`, `FALLBACK_QUOTES`, `parseQuotesCSV`, `getQuotes` |
| modify          | `tests/sheets.test.ts`                                            | add tests for new parser + helper                                             |
| create          | `src/components/OverheardArchive.astro`                           | renders the section header + carousel card + client script                    |
| modify          | `src/components/CommunitySection.astro`                           | remove old `<blockquote>`; mount `<OverheardArchive />`                       |
| modify          | `.env.example`                                                    | add `GOOGLE_SHEET_GID_QUOTES`                                                 |
| modify          | `human-todo.md`                                                   | add a new section about creating the Overheard tab                            |

---

## Task 1: Extract `fetchSheetCSV` (refactor — no behavior change)

**Files:**
- Modify: `src/lib/sheets.ts`

- [ ] **Step 1: Run the existing tests to confirm green starting point**

```bash
npm test
```

Expected: `Test Files 1 passed (1)` / `Tests 16 passed (16)`

- [ ] **Step 2: Refactor `fetchSessions` to use a new generic helper**

In `src/lib/sheets.ts`, replace the existing `fetchSessions` function (around line 49) with:

```ts
/**
 * Generic fetch — pulls any tab of a published Google Sheet as CSV.
 * gid defaults to '0' (leftmost tab).
 */
export async function fetchSheetCSV(sheetId: string, gid: string = '0'): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/export?format=csv&gid=${encodeURIComponent(gid)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Sheets fetch failed: ${res.status}`);
  return res.text();
}

export async function fetchSessions(sheetId: string): Promise<Session[]> {
  const csv = await fetchSheetCSV(sheetId, '0');
  return parseSessionsCSV(csv);
}
```

- [ ] **Step 3: Re-run tests**

```bash
npm test
```

Expected: still 16 passing. The two existing `fetchSessions` tests cover both branches via mocked `fetch`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/sheets.ts
git commit -m "refactor(sheets): extract fetchSheetCSV generic helper

Preparing to reuse the same fetch/CSV pipeline for the Overheard
quotes feature. fetchSessions becomes a thin wrapper over
fetchSheetCSV with gid='0'."
```

---

## Task 2: Add `Quote` type + `FALLBACK_QUOTES` constant

**Files:**
- Modify: `src/lib/sheets.ts`

- [ ] **Step 1: Add the type and fallback array**

Append to `src/lib/sheets.ts` (below the existing exports):

```ts
// ── Overheard quotes ──────────────────────────────────────────────────────

export interface Quote {
  quote: string;
  name: string;
  team: string;   // empty string when absent
}

/**
 * Hardcoded fallback used when the Overheard tab is unreachable.
 * One entry is enough to keep the section non-empty in dev.
 */
export const FALLBACK_QUOTES: Quote[] = [
  {
    quote: "I just heard 3 lightning strikes and was stuck in the shed cause of hail storms, I'm not going beach",
    name: 'Tope',
    team: "Men's Pride",
  },
];
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx astro check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/sheets.ts
git commit -m "feat(sheets): add Quote type and FALLBACK_QUOTES constant"
```

---

## Task 3: Add `parseQuotesCSV` (TDD)

**Files:**
- Modify: `tests/sheets.test.ts`
- Modify: `src/lib/sheets.ts`

- [ ] **Step 1: Add failing tests**

Append to `tests/sheets.test.ts` (after the existing `describe` blocks):

```ts
describe('parseQuotesCSV', () => {
  it('parses required + optional columns', () => {
    const csv = `quote,name,team
"Some weird thing",Tope,Men's Pride
"Another one",Sara,Women's Cats`;

    const result = parseQuotesCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ quote: 'Some weird thing', name: 'Tope', team: "Men's Pride" });
    expect(result[1].name).toBe('Sara');
  });

  it('defaults team to empty string when column is absent', () => {
    const csv = `quote,name
"Hello",Tope`;

    const result = parseQuotesCSV(csv);
    expect(result[0].team).toBe('');
  });

  it('defaults team to empty string when cell is blank', () => {
    const csv = `quote,name,team
"Hello",Tope,`;

    const result = parseQuotesCSV(csv);
    expect(result[0].team).toBe('');
  });

  it('skips rows where quote is blank', () => {
    const csv = `quote,name,team
"First one",Tope,Men's Pride
,Sara,Women's Cats
"Third one",Alex,Men's Roar`;

    const result = parseQuotesCSV(csv);
    expect(result).toHaveLength(2);
    expect(result.map(q => q.name)).toEqual(['Tope', 'Alex']);
  });

  it('handles quoted fields containing commas', () => {
    const csv = `quote,name,team
"It was raining, snowing, and hailing at once",Tope,Men's Pride`;

    const result = parseQuotesCSV(csv);
    expect(result[0].quote).toBe('It was raining, snowing, and hailing at once');
  });
});
```

Update the import at the top of `tests/sheets.test.ts`:

```ts
import {
  parseSessionsCSV,
  parseQuotesCSV,
  abbreviateDay,
  abbreviateTime,
  getSessions,
  type Session,
} from '../src/lib/sheets';
```

- [ ] **Step 2: Run tests and confirm they fail**

```bash
npm test
```

Expected: 5 new tests fail with `parseQuotesCSV is not a function` or similar.

- [ ] **Step 3: Implement `parseQuotesCSV`**

Append to `src/lib/sheets.ts` (below `FALLBACK_QUOTES`):

```ts
export function parseQuotesCSV(csv: string): Quote[] {
  if (!csv.trim()) return [];

  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const keys = lines[0].split(',').map(k => k.trim().toLowerCase());

  return lines.slice(1)
    .map(line => {
      const values = splitCSVLine(line);
      const raw: Record<string, string> = Object.fromEntries(keys.map((k, i) => [k, (values[i] ?? '').trim()]));
      return {
        quote: raw['quote'] ?? '',
        name:  raw['name']  ?? '',
        team:  raw['team']  ?? '',
      } satisfies Quote;
    })
    .filter(q => q.quote.length > 0);
}
```

- [ ] **Step 4: Re-run tests**

```bash
npm test
```

Expected: 21 passing (16 existing + 5 new).

- [ ] **Step 5: Commit**

```bash
git add tests/sheets.test.ts src/lib/sheets.ts
git commit -m "feat(sheets): parseQuotesCSV with required/optional columns

Skips rows with blank quote. Team defaults to empty string when the
column is absent or the cell is blank. Tests cover quoted commas."
```

---

## Task 4: Add `getQuotes` (TDD)

**Files:**
- Modify: `tests/sheets.test.ts`
- Modify: `src/lib/sheets.ts`

- [ ] **Step 1: Add failing tests**

Append to `tests/sheets.test.ts` (after the `parseQuotesCSV` describe block):

```ts
describe('getQuotes', () => {
  const realFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it('returns fallback when no sheet ID is provided', async () => {
    const { quotes, usingFallback } = await getQuotes();
    expect(usingFallback).toBe(true);
    expect(quotes).toEqual(FALLBACK_QUOTES);
  });

  it('returns fallback when no gid is provided', async () => {
    const { quotes, usingFallback } = await getQuotes('sheet-id');
    expect(usingFallback).toBe(true);
    expect(quotes).toEqual(FALLBACK_QUOTES);
  });

  it('returns live data when the fetch succeeds', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `quote,name,team\n"A live one",Sara,Women's Cats`,
    } as Response);

    const { quotes, usingFallback } = await getQuotes('sheet-id', '123');
    expect(usingFallback).toBe(false);
    expect(quotes).toHaveLength(1);
    expect(quotes[0].name).toBe('Sara');
  });

  it('falls back when the fetch fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response);

    const { quotes, usingFallback } = await getQuotes('sheet-id', '123');
    expect(usingFallback).toBe(true);
    expect(quotes).toEqual(FALLBACK_QUOTES);
  });
});
```

Update the import at the top of `tests/sheets.test.ts` to include the new symbols:

```ts
import {
  parseSessionsCSV,
  parseQuotesCSV,
  abbreviateDay,
  abbreviateTime,
  getSessions,
  getQuotes,
  FALLBACK_QUOTES,
  type Session,
} from '../src/lib/sheets';
```

- [ ] **Step 2: Run tests and confirm they fail**

```bash
npm test
```

Expected: 4 new tests fail with `getQuotes is not a function`.

- [ ] **Step 3: Implement `getQuotes`**

Append to `src/lib/sheets.ts`:

```ts
/**
 * Returns quotes from the Overheard tab if both sheetId and gid are set,
 * otherwise from FALLBACK_QUOTES. Resolves `usingFallback` so callers can
 * surface a notice if needed (currently no UI for this — the component
 * just renders whatever it gets).
 */
export async function getQuotes(sheetId?: string, gid?: string): Promise<{ quotes: Quote[]; usingFallback: boolean }> {
  if (!sheetId || !gid) {
    return { quotes: FALLBACK_QUOTES, usingFallback: true };
  }
  try {
    const csv = await fetchSheetCSV(sheetId, gid);
    const parsed = parseQuotesCSV(csv);
    if (parsed.length === 0) {
      return { quotes: FALLBACK_QUOTES, usingFallback: true };
    }
    return { quotes: parsed, usingFallback: false };
  } catch (e) {
    console.warn('Google Sheets fetch failed for quotes, using fallback:', e);
    return { quotes: FALLBACK_QUOTES, usingFallback: true };
  }
}
```

- [ ] **Step 4: Re-run tests**

```bash
npm test
```

Expected: 25 passing (21 existing + 4 new).

- [ ] **Step 5: Commit**

```bash
git add tests/sheets.test.ts src/lib/sheets.ts
git commit -m "feat(sheets): getQuotes with fallback for missing ID/gid/fetch fail

Mirrors getSessions but requires both sheetId AND gid because the
Overheard tab isn't the leftmost. Falls back to FALLBACK_QUOTES when
either is missing, the fetch fails, or the parsed result is empty."
```

---

## Task 5: Create the `OverheardArchive` component (static shell, no JS)

**Files:**
- Create: `src/components/OverheardArchive.astro`

- [ ] **Step 1: Write the component**

Create `src/components/OverheardArchive.astro` with this exact content:

```astro
---
// src/components/OverheardArchive.astro
// "Overheard at Training" — sheet-driven, one-at-a-time quote archive.
// Spec: docs/superpowers/specs/2026-05-25-overheard-quotes-design.md
import { getQuotes } from '../lib/sheets';

const { quotes } = await getQuotes(
  import.meta.env.GOOGLE_SHEET_ID,
  import.meta.env.GOOGLE_SHEET_GID_QUOTES,
);

// Don't render the section at all if there are zero quotes.
const showSection = quotes.length > 0;
const total = quotes.length;
const showPagination = total > 1;
const first = quotes[0];
---

{showSection && (
  <section class="overheard" aria-labelledby="overheard-heading">
    <div class="overheard__header">
      <p class="eyebrow overheard__eyebrow">Overheard at Training</p>
      <h2 id="overheard-heading" class="overheard__title">
        Out of context.<br />Mostly on <em>purpose</em>.
      </h2>
      <p class="overheard__sub">
        A growing collection of things our players have actually said.
        <strong>Use them as ice-breakers</strong> when you meet someone new at a session —
        ask whoever said it what on earth was going on.
      </p>
    </div>

    <div class="overheard__card">
      <blockquote
        class="overheard__quote"
        aria-live="polite"
        data-overheard-quote
      >
        <p data-overheard-text>"{first.quote}"</p>
        <footer class="overheard__attrib" data-overheard-attrib>
          <strong>{first.name}</strong>{first.team ? <> · {first.team}</> : null}
        </footer>
      </blockquote>

      {showPagination && (
        <div class="overheard__pagination">
          <span
            class="overheard__counter"
            data-overheard-counter
            aria-label={`Quote 1 of ${total}`}
          >№ 01 / {String(total).padStart(2, '0')}</span>
          <div class="overheard__nav">
            <button
              type="button"
              class="overheard__nav-btn"
              data-overheard-prev
              aria-label="Previous quote"
            >←</button>
            <button
              type="button"
              class="overheard__nav-btn"
              data-overheard-next
              aria-label="Next quote"
            >→</button>
          </div>
        </div>
      )}
    </div>

    <script type="application/json" data-overheard-data set:html={JSON.stringify(quotes)} />
  </section>
)}

<style>
  .overheard {
    margin-top: 36px;
  }

  .overheard__header {
    margin-bottom: 24px;
  }

  .overheard__eyebrow {
    margin-bottom: 12px;
  }

  .overheard__title {
    font-size: clamp(1.4rem, 3vw, 1.8rem);
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.04em;
    text-transform: uppercase;
    color: #fff;
    margin-bottom: 14px;
  }

  .overheard__title em {
    color: var(--color-accent-to);
    font-style: normal;
  }

  .overheard__sub {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    line-height: 1.55;
    max-width: 540px;
  }

  .overheard__sub strong {
    color: rgba(255, 255, 255, 0.8);
    font-weight: 600;
  }

  .overheard__card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(0, 100, 220, 0.18);
    border-radius: 14px;
    padding: 32px 32px 20px;
    position: relative;
  }

  .overheard__quote {
    margin: 0 0 18px;
    transition: opacity 0.25s ease;
  }

  .overheard__quote p {
    font-size: clamp(1rem, 2.5vw, 1.3rem);
    line-height: 1.4;
    font-weight: 600;
    color: #fff;
    margin: 0 0 16px;
  }

  .overheard__attrib {
    font-size: 0.7rem;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .overheard__attrib strong {
    color: #fff;
    font-weight: 700;
  }

  .overheard__pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .overheard__counter {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 0.65rem;
    letter-spacing: 1.5px;
    color: rgba(255, 255, 255, 0.45);
  }

  .overheard__nav {
    display: flex;
    gap: 6px;
  }

  .overheard__nav-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.7);
    border-radius: 6px;
    min-width: 44px;
    min-height: 44px;
    font: inherit;
    font-size: 0.95rem;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }

  .overheard__nav-btn:hover {
    border-color: rgba(255, 255, 255, 0.4);
    color: #fff;
  }

  .overheard__nav-btn:focus-visible {
    outline: 2px solid var(--color-accent-to);
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    .overheard__quote { transition: none; }
  }

  @media (max-width: 640px) {
    .overheard__card { padding: 24px 22px 16px; }
  }
</style>
```

- [ ] **Step 2: Verify the file compiles**

```bash
npx astro check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/OverheardArchive.astro
git commit -m "feat(home): add OverheardArchive component (static shell)

Renders the section header and a single-quote card. Pagination markup
is present when quotes.length > 1 but is not yet interactive — JS
arrives in the next task. Section is hidden entirely when quotes is
empty (defensive — fallback should always provide at least one)."
```

---

## Task 6: Add the client-side carousel script (prev/next, keyboard, swipe, auto-rotate)

**Files:**
- Modify: `src/components/OverheardArchive.astro`

- [ ] **Step 1: Append the script block at the end of the component**

Add this just before the closing of the file (after the `<style>` block) in `src/components/OverheardArchive.astro`:

```astro
<script>
  const section = document.querySelector<HTMLElement>('.overheard');
  if (section) {
    const data = section.querySelector<HTMLScriptElement>('script[data-overheard-data]');
    type Quote = { quote: string; name: string; team: string };
    const quotes: Quote[] = data ? JSON.parse(data.textContent ?? '[]') : [];

    if (quotes.length > 1) {
      const textEl    = section.querySelector<HTMLElement>('[data-overheard-text]')!;
      const attribEl  = section.querySelector<HTMLElement>('[data-overheard-attrib]')!;
      const counterEl = section.querySelector<HTMLElement>('[data-overheard-counter]')!;
      const quoteEl   = section.querySelector<HTMLElement>('[data-overheard-quote]')!;
      const prevBtn   = section.querySelector<HTMLButtonElement>('[data-overheard-prev]')!;
      const nextBtn   = section.querySelector<HTMLButtonElement>('[data-overheard-next]')!;

      let current = 0;
      let timer: ReturnType<typeof setInterval> | undefined;
      const ROTATE_MS = 7000;
      const SWIPE_THRESHOLD = 50;
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      function render(idx: number) {
        const q = quotes[idx];
        const update = () => {
          textEl.textContent = `"${q.quote}"`;
          attribEl.innerHTML = q.team
            ? `<strong>${escapeHtml(q.name)}</strong> · ${escapeHtml(q.team)}`
            : `<strong>${escapeHtml(q.name)}</strong>`;
          counterEl.textContent = `№ ${String(idx + 1).padStart(2, '0')} / ${String(quotes.length).padStart(2, '0')}`;
          counterEl.setAttribute('aria-label', `Quote ${idx + 1} of ${quotes.length}`);
        };

        if (prefersReduced) {
          update();
        } else {
          quoteEl.style.opacity = '0';
          window.setTimeout(() => {
            update();
            quoteEl.style.opacity = '1';
          }, 200);
        }
      }

      function escapeHtml(s: string): string {
        return s.replace(/[&<>"']/g, c => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
        }[c] as string));
      }

      function goTo(n: number) {
        current = (n + quotes.length) % quotes.length;
        render(current);
      }

      function startTimer() {
        if (prefersReduced) return;
        timer = window.setInterval(() => goTo(current + 1), ROTATE_MS);
      }

      function stopTimer() {
        if (timer !== undefined) {
          clearInterval(timer);
          timer = undefined;
        }
      }

      function resetTimer() {
        stopTimer();
        startTimer();
      }

      // Buttons
      prevBtn.addEventListener('click', () => { goTo(current - 1); resetTimer(); });
      nextBtn.addEventListener('click', () => { goTo(current + 1); resetTimer(); });

      // Pause on hover / focus
      section.addEventListener('mouseenter', stopTimer);
      section.addEventListener('mouseleave', startTimer);
      section.addEventListener('focusin', stopTimer);
      section.addEventListener('focusout', (e) => {
        if (!section.contains(e.relatedTarget as Node)) startTimer();
      });

      // Keyboard
      section.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(current - 1); resetTimer(); }
        if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); resetTimer(); }
      });

      // Swipe (mobile)
      let touchStartX = 0;
      let touchStartY = 0;
      section.addEventListener('touchstart', (e: TouchEvent) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });
      section.addEventListener('touchend', (e: TouchEvent) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
        if (dx < 0) goTo(current + 1); else goTo(current - 1);
        resetTimer();
      });

      startTimer();
    }
  }
</script>
```

- [ ] **Step 2: Verify it compiles**

```bash
npx astro check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/OverheardArchive.astro
git commit -m "feat(home): wire OverheardArchive interactions

Prev/next buttons, ArrowLeft/ArrowRight when focus is in-section,
horizontal swipe on mobile (50px threshold, ignored if vertical
drag dominates), 7s auto-rotate paused on hover/focus and disabled
under prefers-reduced-motion. Transitions skipped under reduced motion."
```

---

## Task 7: Mount `OverheardArchive` inside `CommunitySection`

**Files:**
- Modify: `src/components/CommunitySection.astro`

- [ ] **Step 1: Add the import and remove the old quote**

Open `src/components/CommunitySection.astro`. At the top of the frontmatter section, add the import:

```ts
import OverheardArchive from './OverheardArchive.astro';
```

The current frontmatter is:

```ts
---
// src/components/CommunitySection.astro
import { flags } from '../data/flags';
---
```

Update it to:

```ts
---
// src/components/CommunitySection.astro
import { flags } from '../data/flags';
import OverheardArchive from './OverheardArchive.astro';
---
```

- [ ] **Step 2: Replace the old `<blockquote>` with the new component**

Find this block in the template:

```astro
    <!-- Member quote -->
    <blockquote class="community__quote">
      <p>
        "I just heard 3 lightning strikes and was stuck in the shed cause of hail storms,
        I'm not going beach"
      </p>
      <footer>
        — <cite>Babatope Oscar Alabi</cite>
        <span class="community__quote-note">(placeholder — replace before launch)</span>
      </footer>
    </blockquote>
```

Replace it with:

```astro
    <OverheardArchive />
```

- [ ] **Step 3: Remove the dead CSS for `.community__quote`**

In the `<style>` block of the same file, delete the following rules (they're no longer referenced):

```css
  .community__quote {
    background: linear-gradient(135deg, rgba(0,60,180,0.1), rgba(0,120,255,0.05));
    border-left: 3px solid #0070ff;
    border-radius: 0 12px 12px 0;
    padding: 24px 28px;
  }

  .community__quote p {
    font-size: 1.0625rem;
    color: rgba(255,255,255,0.7);
    line-height: 1.6;
    font-style: italic;
    margin-bottom: 12px;
  }

  .community__quote footer {
    font-size: 0.6875rem;
    color: var(--color-text-muted);
    font-weight: 600;
  }

  .community__quote-note {
    color: rgba(255,255,255,0.5);
    font-style: italic;
    margin-left: 8px;
  }
```

- [ ] **Step 4: Manual visual check**

Start the dev server if it isn't already running:

```bash
npm run dev
```

Open `http://localhost:4324/` (or whichever port Astro picks). Confirm:
- The "Overheard at Training" section appears below the flag mosaic.
- Without `GOOGLE_SHEET_ID` set, the fallback quote renders and pagination is hidden.
- No console errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/CommunitySection.astro
git commit -m "feat(home): mount OverheardArchive in CommunitySection

Removes the placeholder blockquote and its associated CSS. The new
archive component takes over the same vertical slot below the flag
mosaic."
```

---

## Task 8: Document the new env var and the Overheard tab setup

**Files:**
- Modify: `.env.example`
- Modify: `human-todo.md`

- [ ] **Step 1: Add the env var to `.env.example`**

Open `.env.example`. The current content is:

```
GOOGLE_SHEET_ID=your_google_sheet_id_here
BEHOLD_FEED_ID=your_behold_feed_id_here
```

Update to:

```
GOOGLE_SHEET_ID=your_google_sheet_id_here
GOOGLE_SHEET_GID_QUOTES=your_overheard_tab_gid_here
BEHOLD_FEED_ID=your_behold_feed_id_here
```

- [ ] **Step 2: Add a new section to `human-todo.md`**

Append the following section to `human-todo.md` (after item 9 if numbered sections exist, otherwise at the end before the "Image folder structure" reference block):

```markdown
## 10. Overheard at Training tab (Google Sheet)

The "Overheard at Training" archive on the homepage reads from a second tab on the same Google Sheet you set up in item 8. Skip this and the section shows a single hardcoded fallback quote — fine for launch, easy to add later.

### 10a. Create the tab

1. Open the existing schedule sheet.
2. Click the `+` at the bottom-left to add a new tab. Rename it to **Overheard**.
3. In row 1 add these headers (case-insensitive):
   - `quote` (required) — the line itself, no surrounding quote marks (the site adds them)
   - `name` (required) — first name or however the person wants to be credited
   - `team` (optional) — e.g. "Men's Pride"; leave blank to show just the name
4. Add one row per quote. Rows where `quote` is blank are skipped silently, so you can leave gaps for organisation.

Example:

| quote | name | team |
|---|---|---|
| I just heard 3 lightning strikes and was stuck in the shed cause of hail storms, I'm not going beach | Tope | Men's Pride |
| Probably my favourite hummus | Sara | Women's Cats |

### 10b. Wire the tab's gid into the site

The "gid" is the numeric ID of the tab. Find it by clicking the Overheard tab and looking at the URL: `...#gid=987654321` — that number is the gid.

1. Locally: add to `.env.local`:
   ```
   GOOGLE_SHEET_GID_QUOTES=987654321
   ```
2. In Netlify/Vercel: add `GOOGLE_SHEET_GID_QUOTES` as an env var with the same value.
3. Trigger a redeploy.

The webhook from item 8c already covers this tab — onChange fires for edits to any tab in the sheet.
```

- [ ] **Step 3: Commit**

```bash
git add .env.example human-todo.md
git commit -m "docs: document GOOGLE_SHEET_GID_QUOTES and the Overheard tab

Step-by-step instructions for adding the Overheard tab, finding its
gid in the sheet URL, and wiring it locally + in production."
```

---

## Task 9: Final verification

- [ ] **Step 1: All unit tests pass**

```bash
npm test
```

Expected: 25 tests passing (16 existing + 5 parseQuotesCSV + 4 getQuotes).

- [ ] **Step 2: Type check is clean**

```bash
npx astro check
```

Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Visual check at desktop width**

With dev server running, open `http://localhost:4324/`. Confirm:
- "Overheard at Training" section appears below the flag mosaic.
- Eyebrow, headline, subtitle render as designed.
- Quote card has subtle border, quote text large, attribution in uppercase below.
- With only 1 quote (fallback), pagination + counter are hidden.

- [ ] **Step 4: Wire up the sheet and re-verify**

If `GOOGLE_SHEET_ID` and `GOOGLE_SHEET_GID_QUOTES` are set in `.env.local`:
- Quotes from the sheet render
- Counter shows `№ 01 / NN` where NN is the row count
- Prev/next buttons advance the quote
- Counter updates in sync

- [ ] **Step 5: Mobile check (375×812 in Chrome devtools)**

- Section padding looks correct (matches the alignment of other cards)
- Counter and arrows fit on one row
- Tap each arrow — quote advances
- Horizontal swipe gesture advances the quote; vertical scroll still works normally

- [ ] **Step 6: Keyboard nav check**

- Tab through the page until focus enters the section (e.g. on a button)
- Press `ArrowLeft` / `ArrowRight` — quote advances
- Focus outline is visible on the focused button

- [ ] **Step 7: Reduced motion check**

In OS settings, enable "Reduce motion" (macOS: System Settings → Accessibility → Display → Reduce motion). Reload the page.
- Auto-rotate does not run
- Clicking prev/next still works but the quote swap is instant (no fade)

- [ ] **Step 8: No commit needed unless verification surfaces an issue.**

If everything passes, the feature is done. If anything fails, fix it in a new commit and re-verify.

---

## Self-Review Checklist (already run by the planner)

Coverage:
- Spec §Problem/Goal → Tasks 5–7 (the new component lands as designed)
- Spec §Placement & visual → Task 5 (Astro markup + CSS) + Task 7 (mount)
- Spec §Data model → Tasks 2 (type + fallback) + 3 (parser) + 4 (getQuotes)
- Spec §Code structure → Tasks 1 (refactor), 2–4 (sheets.ts), 5–6 (component), 7 (CommunitySection edit)
- Spec §Behavior → Task 6 (script: prev/next/keyboard/swipe/auto-rotate/reduced-motion)
- Spec §Edge cases → Task 5 (`showSection` / `showPagination` conditionals); 0-quote case covered by `parsed.length === 0` in `getQuotes` (Task 4) returning fallback
- Spec §Accessibility → Task 5 (aria-label, aria-live, blockquote/footer/cite, min 44×44 buttons)
- Spec §Testing → Tasks 3–4 (unit) + Task 9 (manual)
- Spec §File map → File Map table at top of plan ✓

No placeholders. All code shown inline. Types and identifiers (`Quote`, `getQuotes`, `parseQuotesCSV`, `fetchSheetCSV`, data-attribute names) are consistent across tasks.
