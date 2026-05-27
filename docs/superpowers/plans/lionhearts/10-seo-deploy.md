# Sub-Plan 10 — SEO & Deploy

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task.

**Goal:** Wire up `robots.txt`, verify sitemap output, create a placeholder OG image, confirm Netlify deploy config, and run a pre-launch smoke-test checklist.

**Prerequisite:** Sub-plans 01–09 complete. Site builds cleanly (`npm run build`).

---

### Task 1: robots.txt and sitemap

**Files:**
- Create: `public/robots.txt`
- Verify: `astro.config.mjs` (sitemap integration, already set up in sub-plan 01)

- [ ] **Step 1: Create robots.txt**

Create `public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://lionheartsvolleyball.com/sitemap-index.xml
```

- [ ] **Step 2: Verify sitemap config in astro.config.mjs**

Confirm `astro.config.mjs` contains the sitemap integration with the canonical site URL:

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://lionheartsvolleyball.com',
  integrations: [sitemap()],
});
```

If `site:` is missing or wrong, update it now.

- [ ] **Step 3: Build and verify sitemap output**

```bash
npm run build && ls dist/sitemap*.xml
```

Expected output:
```
dist/sitemap-index.xml
dist/sitemap-0.xml
```

If neither file appears, the `site:` property is missing from `astro.config.mjs` — sitemap generation requires it.

- [ ] **Step 4: Check sitemap contents**

```bash
cat dist/sitemap-0.xml
```

Expected: entries for `/`, `/about`, `/events`, `/teams`, `/sponsorship`, `/join`, `/contact`. The `/join-success` page will also appear — that's fine.

- [ ] **Step 5: Commit**

```bash
git add public/robots.txt astro.config.mjs
git commit -m "feat: add robots.txt and verify sitemap integration"
```

---

### Task 2: OG image placeholder

**Files:**
- Create: `public/images/og-default.jpg`

The OG image is referenced in `BaseHead.astro` as the `ogImage` prop default. Until the club provides a real photo, we use a plain dark-blue placeholder so social shares don't show a broken image.

- [ ] **Step 1: Create the placeholder OG image**

Run this to generate a 1200×630 placeholder using ImageMagick (available on most macOS installs via Homebrew):

```bash
magick -size 1200x630 \
  gradient:'#050d1a-#0a1628' \
  -gravity Center \
  -font Helvetica-Bold -pointsize 64 -fill '#0090ff' \
  -annotate 0 'London Lionhearts VBC' \
  -font Helvetica -pointsize 28 -fill '#ffffff80' \
  -annotate +0+80 'East London Volleyball · Shoreditch E2' \
  public/images/og-default.jpg
```

If ImageMagick is not installed, create a minimal fallback instead:

```bash
# Check if ImageMagick is available
which magick || which convert
```

If neither is available, skip the generation step and create a note instead — the `og:image` tag will simply not resolve to a real image until one is supplied. Add a comment to `BaseHead.astro` marking this as a TODO:

```astro
<!-- TODO: replace /images/og-default.jpg with a real 1200×630 club photo before launch -->
```

- [ ] **Step 2: Verify BaseHead.astro uses the default**

Open `src/components/BaseHead.astro` and confirm the og:image tag falls back to `/images/og-default.jpg`:

```astro
const { ogImage = '/images/og-default.jpg' } = Astro.props;
```

The `<meta property="og:image">` tag should use this value.

- [ ] **Step 3: Commit**

```bash
git add public/images/og-default.jpg src/components/BaseHead.astro
git commit -m "feat: add OG image placeholder for social sharing"
```

---

### Task 3: Netlify deploy config

**Files:**
- Verify: `netlify.toml` (created in sub-plan 08)

- [ ] **Step 1: Confirm netlify.toml is complete**

`netlify.toml` should contain:

```toml
[build]
  command   = "npm run build"
  publish   = "dist"

[[redirects]]
  from   = "/*"
  to     = "/404"
  status = 404

[build.environment]
  NODE_VERSION = "20"
```

The 404 redirect catches any path Astro doesn't render and serves the 404 page with the correct HTTP status — important for Netlify since Astro generates static files.

- [ ] **Step 2: Create 404 page**

Create `src/pages/404.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout
  title="Page Not Found · London Lionhearts VBC"
  description="The page you're looking for doesn't exist."
>
  <div style="min-height: 60vh; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 1rem; padding: 4rem 2rem; text-align: center;">
    <div style="font-size: 4rem; font-weight: 900; color: var(--color-accent-to); line-height: 1;">404</div>
    <h1 style="font-size: 1.5rem; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
      Page Not Found
    </h1>
    <p style="color: rgba(255,255,255,0.4); max-width: 360px; line-height: 1.65; font-size: 0.875rem;">
      That page doesn't exist. Head back to the homepage or find what you need below.
    </p>
    <div style="display: flex; gap: 12px; margin-top: 1rem; flex-wrap: wrap; justify-content: center;">
      <a href="/" class="btn btn--primary">Back to Home</a>
      <a href="/events" class="btn btn--ghost">Sessions</a>
      <a href="/join" class="btn btn--ghost">Join Us</a>
    </div>
  </div>
</BaseLayout>
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: clean build, `dist/404/index.html` or `dist/404.html` present.

- [ ] **Step 4: Commit**

```bash
git add netlify.toml src/pages/404.astro
git commit -m "feat: add 404 page and confirm Netlify build config"
```

---

### Task 4: Environment variables for Netlify

**Files:**
- Verify: `.env.example`

These environment variables need to be set in Netlify's dashboard (Site settings → Environment variables) before deploying:

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_SHEET_ID` | Optional | Google Sheet ID for live session data. Without it, fallback hardcoded sessions are used. |
| `BEHOLD_FEED_ID` | Optional | Behold.so feed widget ID for Instagram embed. Without it, the placeholder grid is shown. |
| `NODE_VERSION` | Recommended | Set to `20` — already in `netlify.toml` build environment |

- [ ] **Step 1: Verify .env.example is correct**

`.env.example` should contain:

```
GOOGLE_SHEET_ID=your_google_sheet_id_here
BEHOLD_FEED_ID=your_behold_feed_id_here
```

- [ ] **Step 2: Confirm .gitignore excludes .env**

```bash
grep -n "^\.env" .gitignore
```

Expected: `.env` appears on its own line (added in sub-plan 01).

- [ ] **Step 3: Commit if .env.example was updated**

```bash
git add .env.example
git commit -m "docs: update .env.example with all required env vars"
```

---

### Task 5: Pre-launch smoke test

Run a full build and verify every page and key feature before handing off to the client.

- [ ] **Step 1: Final build**

```bash
npm run build
```

Expected: zero errors, zero TypeScript errors.

- [ ] **Step 2: Start preview server**

```bash
npm run preview
```

Navigate to `http://localhost:4321` in a browser.

- [ ] **Step 3: Page checklist**

Visit each URL and verify it loads without errors:

| URL | Check |
|---|---|
| `/` | Hero carousel, stats bar, about intro, community, sponsors placeholder, Instagram placeholder, join CTA |
| `/about` | Page hero, photo placeholder, founders section, values cards |
| `/events` | Session cards (fallback data), Volleyzone links for 9 teams, filter pills |
| `/teams` | 4 Women's cards + 5 Men's cards, placeholder photos visible |
| `/sponsorship` | Sponsor hero, "Partner With Lionhearts" CTA, 6 perks grid |
| `/join` | 3 pathway cards, form with all fields, submit button |
| `/contact` | 3 contact cards, location block (address + sessions + map area), social row |
| `/404` | 404 message with navigation links (navigate to `/nonexistent`) |

- [ ] **Step 4: SEO meta checklist**

Open DevTools → Elements on each page and verify:

- `<title>` tag is page-specific (not just site name)
- `<meta name="description">` is present and non-empty
- `<meta property="og:title">` is present
- `<meta property="og:image">` points to `/images/og-default.jpg`
- `<link rel="canonical">` matches the page URL

- [ ] **Step 5: JSON-LD check**

On the homepage (`/`), verify the `SportsOrganization` JSON-LD is present:

```bash
grep -o '"@type":"SportsOrganization"' dist/index.html
```

On the events page (`/events`), verify Event JSON-LD:

```bash
grep -o '"@type":"Event"' dist/events/index.html | wc -l
```

Expected: `2` (one for each recurring session schema).

- [ ] **Step 6: robots.txt and sitemap**

```bash
curl http://localhost:4321/robots.txt
curl http://localhost:4321/sitemap-index.xml
```

Both should return content (not 404).

- [ ] **Step 7: Final commit**

```bash
git add -A
git status
```

Confirm no untracked files that should be committed. Then:

```bash
git commit -m "chore: pre-launch smoke test complete — site ready for Netlify deploy"
```

---

### Task 6: Deploy to Netlify

- [ ] **Step 1: Push to GitHub**

The user creates a GitHub repo and adds it as remote. Then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/lionhearts.git
git branch -M main
git push -u origin main
```

- [ ] **Step 2: Connect to Netlify**

1. Log in to [netlify.com](https://netlify.com)
2. "Add new site" → "Import an existing project" → GitHub
3. Select the `lionhearts` repo
4. Build settings will be auto-detected from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add environment variables (Site settings → Environment variables):
   - `GOOGLE_SHEET_ID` — from Google Sheets (if configured)
   - `BEHOLD_FEED_ID` — from Behold.so dashboard (if configured)
6. Click "Deploy site"

- [ ] **Step 3: Verify live deploy**

Once Netlify build completes:
- Visit the Netlify preview URL (e.g. `https://random-name.netlify.app`)
- Check `/`, `/events`, `/join`, `/contact` all load
- Verify `robots.txt` and `sitemap-index.xml` are accessible

- [ ] **Step 4: Custom domain (when ready)**

In Netlify → Domain management:
1. Add custom domain: `lionheartsvolleyball.com`
2. Update DNS at registrar to point to Netlify's nameservers (or add CNAME/A records as instructed)
3. Enable HTTPS (automatic via Let's Encrypt — Netlify handles this)
4. Once DNS propagates, verify canonical URL matches and sitemap URL is correct

---

### ✅ Sub-plan 10 complete

**All 10 sub-plans complete. The site is ready to build and deploy.**

**Post-launch client handoff checklist:**
- [ ] Replace `sponsor.url`, `sponsor.name`, `sponsor.description`, `sponsor.logo` in `sponsorship.astro`
- [ ] Replace Volleyzone slugs in `src/data/teams.ts` after verifying on volleyzone.co.uk
- [ ] Add `GOOGLE_SHEET_ID` to Netlify env vars and publish the Google Sheet as CSV
- [ ] Add `BEHOLD_FEED_ID` after setting up Behold.so account linked to `@lionhearts_volleyball`
- [ ] Replace team photo placeholders in `public/images/` (named `team-vinarius.jpg` etc.)
- [ ] Replace OG image placeholder with a real 1200×630 club photo
- [ ] Confirm session times with club before launch (Mon/Thu/Fri hardcoded in fallback + JSON-LD)
