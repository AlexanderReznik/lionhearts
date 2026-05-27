# Sub-Plan 01 — Project Setup

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task.

**Goal:** Scaffold the Astro project, configure the design system, write the data utilities with tests, and wire up BaseHead + BaseLayout. After this sub-plan, `astro dev` runs and `astro build` succeeds with a minimal index page.

**Visual reference:** `mockup-final.html` (any tab — all use the same design tokens)

---

### Task 1: Git init + Astro scaffold

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/env.d.ts`
- Create: `.gitignore`

- [ ] **Step 1: Init git**

```bash
cd /Users/alex/projects/lionhearts
git init
```

- [ ] **Step 2: Create .gitignore**

```
node_modules/
dist/
.astro/
.env
.env.*
!.env.example
.superpowers/
```

- [ ] **Step 3: Scaffold Astro**

```bash
npm create astro@latest . -- --template minimal --typescript strict --no-git --no-install
```

When prompted: TypeScript = strict, install deps = no (we'll install manually).

- [ ] **Step 4: Install dependencies**

```bash
npm install
npm install @astrojs/sitemap
npm install --save-dev vitest
```

- [ ] **Step 5: Configure astro.config.mjs**

Replace the generated file with:

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://lionheartsvolleyball.com',
  integrations: [sitemap()],
});
```

- [ ] **Step 6: Configure vitest**

Add to `package.json` (merge with existing scripts):

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: `http://localhost:4321` loads without errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro project with sitemap and vitest"
```

---

### Task 2: Design system (global CSS)

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: Create global.css**

```css
/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
img, video { max-width: 100%; display: block; }
button { cursor: pointer; font-family: inherit; }
a { color: inherit; }

/* ── Design tokens ── */
:root {
  /* Colours */
  --color-bg:           #050d1a;
  --color-surface:      #0a0e1a;
  --color-surface-2:    #0a1628;
  --color-surface-3:    #030810;
  --color-accent-from:  #0050e0;
  --color-accent-to:    #0090ff;
  --color-text:         #ffffff;
  --color-text-muted:   rgba(255, 255, 255, 0.5);
  --color-text-faint:   rgba(255, 255, 255, 0.25);
  --color-highlight-1:  #4da8ff;
  --color-highlight-2:  #00c2ff;
  --color-border:       rgba(255, 255, 255, 0.07);
  --color-border-blue:  rgba(0, 100, 220, 0.2);

  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

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

/* ── Base ── */
html { scroll-behavior: smooth; }
body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

/* ── Gradient utility ── */
.gradient-text {
  background: linear-gradient(90deg, var(--color-accent-from), var(--color-accent-to));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.gradient-bg {
  background: linear-gradient(90deg, var(--color-accent-from), var(--color-accent-to));
}

/* ── Buttons ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.75rem;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  text-decoration: none;
  border: none;
  transition: opacity 0.15s, transform 0.1s;
  white-space: nowrap;
}
.btn:active { transform: scale(0.98); }

.btn--primary { background: linear-gradient(90deg, var(--color-accent-from), var(--color-accent-to)); color: #fff; }
.btn--primary:hover { opacity: 0.88; }

.btn--ghost { background: transparent; color: rgba(255,255,255,0.75); border: 1px solid rgba(255,255,255,0.2); }
.btn--ghost:hover { border-color: rgba(255,255,255,0.5); color: #fff; }

.btn--white { background: #fff; color: #0040c0; }
.btn--white:hover { opacity: 0.9; }

.btn--outline-white { background: transparent; color: #fff; border: 2px solid rgba(255,255,255,0.4); }
.btn--outline-white:hover { border-color: rgba(255,255,255,0.7); }

/* ── Section eyebrow ── */
.eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-accent-to);
  font-size: 0.5625rem;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 1rem;
}
.eyebrow::before {
  content: '';
  display: block;
  width: 20px;
  height: 2px;
  background: var(--color-accent-to);
  flex-shrink: 0;
}

/* ── Container ── */
.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--page-px);
}

/* ── Page hero (inner pages) ── */
.page-hero {
  background: linear-gradient(160deg, var(--color-bg), var(--color-surface-2));
  padding: 64px var(--page-px) 52px;
  border-bottom: 1px solid var(--color-border);
  position: relative;
  overflow: hidden;
}
.page-hero::after {
  content: '';
  position: absolute;
  top: 0; right: 0; bottom: 0; width: 40%;
  background: radial-gradient(ellipse at 80% 50%, rgba(0,80,220,0.1) 0%, transparent 70%);
  pointer-events: none;
}
.page-hero__eyebrow { color: var(--color-accent-to); font-size: 0.5625rem; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.page-hero__eyebrow::before { content: ''; display: block; width: 18px; height: 2px; background: var(--color-accent-to); }
.page-hero__title { font-size: clamp(2.5rem, 6vw, 3.5rem); font-weight: 900; text-transform: uppercase; letter-spacing: -2px; line-height: 0.95; }
.page-hero__title em { color: var(--color-accent-to); font-style: normal; }
.page-hero__sub { color: var(--color-text-muted); font-size: 0.9375rem; margin-top: 12px; max-width: 520px; line-height: 1.65; }

/* ── Page content wrapper ── */
.page-content { padding: 52px var(--page-px); }

/* ── Responsive ── */
@media (max-width: 768px) {
  :root {
    --page-px: 20px;
    --nav-height: 60px;
  }
}
```

- [ ] **Step 2: Run astro check**

```bash
npx astro check
```

Expected: no errors (CSS isn't type-checked, this just verifies Astro is configured).

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "chore: add design system CSS tokens and utility classes"
```

---

### Task 3: Data layer — sessions CSV parser (TDD)

**Files:**
- Create: `src/lib/sheets.ts`
- Create: `tests/sheets.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/sheets.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parseSessionsCSV, type Session } from '../src/lib/sheets';

describe('parseSessionsCSV', () => {
  it('parses a valid CSV into session objects', () => {
    const csv = `day,time,level,venue,price
Monday,7:00pm–9:00pm,All Levels,Mulberry Academy,£8
Friday,8:00pm–10:00pm,Intermediate / Advanced,Mulberry Academy,£8`;

    const result = parseSessionsCSV(csv);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual<Session>({
      day: 'Monday',
      time: '7:00pm–9:00pm',
      level: 'All Levels',
      venue: 'Mulberry Academy',
      price: '£8',
    });
    expect(result[1].level).toBe('Intermediate / Advanced');
  });

  it('returns empty array for empty string', () => {
    expect(parseSessionsCSV('')).toEqual([]);
  });

  it('returns empty array when only header row present', () => {
    expect(parseSessionsCSV('day,time,level,venue,price')).toEqual([]);
  });

  it('handles quoted fields containing commas', () => {
    const csv = `day,time,level,venue,price
Monday,7:00pm–9:00pm,All Levels,"Mulberry Academy, Shoreditch",£8`;

    const result = parseSessionsCSV(csv);
    expect(result[0].venue).toBe('Mulberry Academy, Shoreditch');
  });

  it('trims whitespace from field values', () => {
    const csv = `day,time,level,venue,price
 Monday , 7:00pm–9:00pm , All Levels , Mulberry Academy , £8 `;

    const result = parseSessionsCSV(csv);
    expect(result[0].day).toBe('Monday');
    expect(result[0].price).toBe('£8');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: `Cannot find module '../src/lib/sheets'`

- [ ] **Step 3: Implement sheets.ts**

Create `src/lib/sheets.ts`:

```ts
export interface Session {
  day: string;
  time: string;
  level: string;
  venue: string;
  price: string;
}

export function parseSessionsCSV(csv: string): Session[] {
  if (!csv.trim()) return [];

  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const keys = lines[0].split(',').map(k => k.trim().toLowerCase());

  return lines.slice(1).map(line => {
    const values = splitCSVLine(line);
    return Object.fromEntries(keys.map((k, i) => [k, (values[i] ?? '').trim()])) as Session;
  });
}

function splitCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

export async function fetchSessions(sheetId: string): Promise<Session[]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Sheets fetch failed: ${res.status}`);
  const csv = await res.text();
  return parseSessionsCSV(csv);
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test
```

Expected: 5 tests pass, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sheets.ts tests/sheets.test.ts vitest.config.ts
git commit -m "feat: add Google Sheets CSV parser with unit tests"
```

---

### Task 4: Static data — teams and flags

**Files:**
- Create: `src/data/teams.ts`
- Create: `src/data/flags.ts`

- [ ] **Step 1: Create teams.ts**

```ts
// src/data/teams.ts
export interface Team {
  name: string;
  gender: "Women's" | "Men's";
  division: string;        // placeholder — confirm with club before launch
  badge?: string;          // e.g. "⚡ Super League"
  volleyzoneSlug?: string; // e.g. "lionhearts-vinarius" — verify on Volleyzone
}

export const VOLLEYZONE_BASE =
  'https://competitions.volleyzone.co.uk/fixture-and-results/lva/';

export const teams: Team[] = [
  // Women's
  { name: 'Vinarius',   gender: "Women's", division: 'LVA Premier League', badge: '⚡ Super League', volleyzoneSlug: 'lionhearts-vinarius' },
  { name: 'Cats',       gender: "Women's", division: 'LVA Division 1',     volleyzoneSlug: 'lionhearts-cats' },
  { name: 'Fury',       gender: "Women's", division: 'LVA Division 2',     volleyzoneSlug: 'lionhearts-fury' },
  { name: 'Beats',      gender: "Women's", division: 'LVA Division 3',     volleyzoneSlug: 'lionhearts-beats' },
  // Men's
  { name: 'Alpha',      gender: "Men's",   division: 'NVL Super League',   badge: '⚡ Super League', volleyzoneSlug: 'lionhearts-alpha' },
  { name: 'Predators',  gender: "Men's",   division: 'LVA Division 1',     volleyzoneSlug: 'lionhearts-predators' },
  { name: 'Pride',      gender: "Men's",   division: 'LVA Division 2',     volleyzoneSlug: 'lionhearts-pride' },
  { name: 'Roar',       gender: "Men's",   division: 'LVA Division 3',     volleyzoneSlug: 'lionhearts-roar' },
  { name: 'Leo',        gender: "Men's",   division: 'LVA Division 4',     volleyzoneSlug: 'lionhearts-leo' },
];

// NOTE: volleyzoneSlug values are guesses. Before launch, visit
// https://competitions.volleyzone.co.uk/fixture-and-results/lva/,
// select each team, copy the URL, and update the slugs here.
```

- [ ] **Step 2: Create flags.ts**

```ts
// src/data/flags.ts
// Placeholder flags for the Community Section.
// Phase 2: replace with community-submitted flags from the database.
export interface Flag {
  emoji: string;
  country: string;
}

export const flags: Flag[] = [
  { emoji: '🇬🇧', country: 'United Kingdom' },
  { emoji: '🇧🇷', country: 'Brazil' },
  { emoji: '🇫🇷', country: 'France' },
  { emoji: '🇵🇹', country: 'Portugal' },
  { emoji: '🇩🇪', country: 'Germany' },
  { emoji: '🇯🇵', country: 'Japan' },
  { emoji: '🇳🇬', country: 'Nigeria' },
  { emoji: '🇦🇺', country: 'Australia' },
  { emoji: '🇮🇹', country: 'Italy' },
  { emoji: '🇪🇸', country: 'Spain' },
  { emoji: '🇺🇸', country: 'United States' },
  { emoji: '🇿🇦', country: 'South Africa' },
  { emoji: '🇵🇱', country: 'Poland' },
  { emoji: '🇷🇴', country: 'Romania' },
  { emoji: '🇸🇪', country: 'Sweden' },
  { emoji: '🇨🇦', country: 'Canada' },
  { emoji: '🇦🇷', country: 'Argentina' },
  { emoji: '🇬🇷', country: 'Greece' },
  { emoji: '🇳🇱', country: 'Netherlands' },
  { emoji: '🇹🇷', country: 'Turkey' },
  { emoji: '🇰🇷', country: 'South Korea' },
  { emoji: '🇨🇳', country: 'China' },
];
```

- [ ] **Step 3: Run astro check**

```bash
npx astro check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/data/teams.ts src/data/flags.ts
git commit -m "feat: add team and flag static data"
```

---

### Task 5: BaseHead component

**Files:**
- Create: `src/components/BaseHead.astro`

- [ ] **Step 1: Create BaseHead.astro**

```astro
---
// src/components/BaseHead.astro
import '../styles/global.css';

interface Props {
  title: string;
  description: string;
  canonicalURL?: string;
  ogImage?: string;
  jsonLd?: object | object[];
}

const {
  title,
  description,
  canonicalURL,
  ogImage,
  jsonLd,
} = Astro.props;

const SITE = 'https://lionheartsvolleyball.com';
const canonical = canonicalURL ?? SITE + Astro.url.pathname;
const image = ogImage ?? `${SITE}/images/og-default.jpg`;
const fullTitle = `${title} | London Lionhearts Volleyball Club`;
const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
---

<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="generator" content={Astro.generator} />

<title>{fullTitle}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />

<!-- Open Graph -->
<meta property="og:type"        content="website" />
<meta property="og:site_name"   content="London Lionhearts Volleyball Club" />
<meta property="og:url"         content={canonical} />
<meta property="og:title"       content={fullTitle} />
<meta property="og:description" content={description} />
<meta property="og:image"       content={image} />

<!-- Twitter -->
<meta name="twitter:card"        content="summary_large_image" />
<meta name="twitter:title"       content={fullTitle} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image"       content={image} />

<!-- Favicon placeholder — replace with actual SVG crest -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />

<!-- JSON-LD structured data -->
{schemas.map(schema => (
  <script type="application/ld+json" set:html={JSON.stringify(schema)} />
))}
```

- [ ] **Step 2: Create placeholder favicon**

Create `public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="16" fill="#0050e0"/>
  <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle"
        font-size="18" fill="white">🦁</text>
</svg>
```

- [ ] **Step 3: Create placeholder OG image**

Create `public/images/og-default.jpg` — this is a placeholder. In production, replace with a proper 1200×630 branded image. For now, create a minimal dark navy 1×1 JPEG:

```bash
mkdir -p public/images
# Create a 1200x630 dark navy placeholder using ImageMagick if available:
which convert && convert -size 1200x630 xc:#050d1a -fill white -font Helvetica-Bold \
  -pointsize 60 -gravity center -annotate 0 "London Lionhearts VBC" \
  public/images/og-default.jpg 2>/dev/null || \
  curl -s "https://placehold.co/1200x630/050d1a/ffffff.jpg?text=London+Lionhearts+VBC" \
  -o public/images/og-default.jpg 2>/dev/null || \
  echo "⚠️  Create public/images/og-default.jpg manually (1200×630, dark navy)"
```

- [ ] **Step 4: Commit**

```bash
git add src/components/BaseHead.astro public/favicon.svg public/images/
git commit -m "feat: add BaseHead component with SEO meta, OG, Twitter card, JSON-LD"
```

---

### Task 6: BaseLayout

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create BaseLayout.astro**

```astro
---
// src/layouts/BaseLayout.astro
import BaseHead from '../components/BaseHead.astro';

interface Props {
  title: string;
  description: string;
  ogImage?: string;
  jsonLd?: object | object[];
}

const { title, description, ogImage, jsonLd } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <BaseHead
      title={title}
      description={description}
      ogImage={ogImage}
      jsonLd={jsonLd}
    />
  </head>
  <body>
    <slot name="nav" />
    <main>
      <slot />
    </main>
    <slot name="footer" />
  </body>
</html>
```

- [ ] **Step 2: Replace src/pages/index.astro with a smoke-test page**

```astro
---
// src/pages/index.astro
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout
  title="London Lionhearts Volleyball Club — Shoreditch, East London"
  description="East London's volleyball club — competing from the NVL Super League to your first ever session. Open sessions 3× a week at Mulberry Academy, Shoreditch E2."
>
  <p style="color:white;padding:2rem;">Setup complete — homepage coming in sub-plan 03.</p>
</BaseLayout>
```

- [ ] **Step 3: Run build to verify setup is solid**

```bash
npm run build
```

Expected: `dist/` created with `index.html`, `sitemap-index.xml`, `sitemap-0.xml`. No errors.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/BaseLayout.astro src/pages/index.astro
git commit -m "feat: add BaseLayout; build passes end-to-end"
```

---

### ✅ Sub-plan 01 complete

After this sub-plan:
- `npm run dev` serves the site at `http://localhost:4321`
- `npm run build` succeeds with sitemap output
- `npm test` passes 5 sheets unit tests
- `git log` shows 5 commits

**Next:** `plans/lionhearts/02-shared-components.md` (Nav + Footer)
